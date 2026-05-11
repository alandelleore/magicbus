import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Skeleton,
} from '@mui/material';
import {
  IconArrowLeft,
  IconBus,
  IconBusStop,
  IconFlag,
  IconMapPin,
  IconRoute,
  IconSatellite,
  IconShare,
} from '@tabler/icons-react';
import { GoogleMap, useJsApiLoader, Polyline, OverlayView } from '@react-google-maps/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getParadaInfo } from '../services/api';
import { getLineaGobierno } from '../services/apiGobierno';
import { useLineasGobierno } from '../hooks/useLineasGobierno';
import type { Arribo, ParadaInfo } from '../types';
import { tokens } from '../theme';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCP4Zo1sJq5nfWsnWNUa9j6aI5lSMWArBk';

const mapContainerStyle = { width: '100%', height: '350px' };

function getGpsBadge(minutosGPS: number) {
  if (minutosGPS <= 5) {
    return { bg: tokens.greenBg, color: tokens.green, label: `hace ${minutosGPS} min` };
  }
  return { bg: tokens.amberBg, color: tokens.amber, label: 'sin señal reciente' };
}

export default function DetalleScreen() {
  const { id, interno } = useParams<{ id: string; interno: string }>();
  const navigate = useNavigate();
  const { buscarLineaId } = useLineasGobierno();

  const [arribo, setArribo] = useState<Arribo | null>(null);
  const [parada, setParada] = useState<ParadaInfo | null>(null);
  const [lineaDetalle, setLineaDetalle] = useState<any>(null);
  const [loadingRecorrido, setLoadingRecorrido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [mostrarRecorrido, setMostrarRecorrido] = useState(false);
  const initialLoadDone = useRef(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const tienePosicionValida = arribo && arribo.latitud !== 0 && arribo.longitud !== 0;

  const { isLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    setArribo(null);
    setParada(null);
    setLineaDetalle(null);
    setLoading(true);
    initialLoadDone.current = false;
    setSecondsLeft(30);

    const fetchData = async () => {
      if (!id) return;
      try {
        const result = await getParadaInfo(id);
        const found = result.arribos?.find(
          (a: Arribo) => a.identificadorCoche === interno,
        );
        setArribo(found || null);
        setParada(result.parada?.[0] || null);

        if (found) {
          setLoadingRecorrido(true);
          try {
            const lineaId = buscarLineaId(found.descripcionLinea, found.descripcionCortaBandera);
            if (lineaId) {
              const rec = await getLineaGobierno('1', lineaId);
              setLineaDetalle(rec);
            }
          } catch (e: any) {
            console.log('No se pudo cargar recorrido:', e?.message || e);
          } finally {
            setLoadingRecorrido(false);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        if (!initialLoadDone.current) initialLoadDone.current = true;
        setLoading(false);
      }
    };

    fetchData();

    const pollTimer = setInterval(fetchData, 30000);
    const countdownTimer = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 30 : s - 1));
    }, 1000);

    return () => {
      clearInterval(pollTimer);
      clearInterval(countdownTimer);
    };
  }, [id, interno, buscarLineaId]);

  const APP_URL = 'https://magicbus91.vercel.app';

  const handleShare = async () => {
    if (!arribo || !parada) return;
    const url = `${APP_URL}/cuando-llega/${id}`;
    const text = `${arribo.descripcionLinea} ${arribo.descripcionCortaBandera} (Int. ${arribo.identificadorCoche}) llega en ${arribo.tiempoArriboMinutos} min. a la parada ${parada.cod_sms} (${parada.calle1Nombre} y ${parada.calle2Nombre})\n\n${url}`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Magic Bus', text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const formatDistancia = (km: number) => {
    if (km < 1) return `${(km * 1000).toFixed(0)} mts.`;
    return `${km.toFixed(2)} km.`;
  };

  const center = useMemo(() => {
    if (parada) return { lat: parada.punto_x, lng: parada.punto_y };
    return { lat: -32.9441, lng: -60.6346 };
  }, [parada]);

  const rutaPath = useMemo(() => {
    if (lineaDetalle?.geojsonIda?.coordinates) {
      try {
        const geojson = lineaDetalle.geojsonIda;
        const coordinates = geojson.coordinates || [];
        const path: { lat: number; lng: number }[] = [];
        for (const lineString of coordinates) {
          for (const [lng, lat] of lineString) {
            path.push({ lat, lng });
          }
        }
        return path;
      } catch {}
    }
    if (lineaDetalle?.paradas?.length) {
      try {
        return lineaDetalle.paradas
          .filter((p: any) => p.latitud && p.longitud)
          .map((p: any) => ({ lat: p.latitud, lng: p.longitud }));
      } catch {}
    }
    return [];
  }, [lineaDetalle]);

  const getHoraArribo = () => {
    const mins = arribo?.tiempoArriboMinutos ?? null;
    if (!arribo || mins === null || mins <= 0) return 'Llegando';
    const hora = new Date(Date.now() + mins * 60000);
    return hora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  useEffect(() => {
    if (!mapReady || !mapRef.current || !parada) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(center);

    if (tienePosicionValida) {
      bounds.extend({ lat: arribo!.latitud, lng: arribo!.longitud });
    }

    if (mostrarRecorrido && rutaPath.length > 0) {
      rutaPath.forEach((point: { lat: number; lng: number }) => bounds.extend(point));
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const latDiff = Math.abs(ne.lat() - sw.lat());
    const lngDiff = Math.abs(ne.lng() - sw.lng());

    if (latDiff < 0.005 && lngDiff < 0.005) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(16);
    } else {
      mapRef.current.fitBounds(bounds, { top: 80, bottom: 80, left: 60, right: 60 });
    }
  }, [arribo, mapReady, center, tienePosicionValida, mostrarRecorrido, rutaPath, parada]);

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: tokens.bg }}>
      <AppBar position="static" sx={{ bgcolor: tokens.brand }}>
        <Toolbar sx={{ minHeight: '48px !important', px: 1.5, gap: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/cuando-llega/${id}`)}
          >
            <IconArrowLeft size={14} color="#FFFFFF" />
          </Box>
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              fontSize: 13,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.2,
            }}
          >
            Volver
          </Typography>
        </Toolbar>
        <Toolbar sx={{ minHeight: '36px !important', px: 2, pt: 0 }}>
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: 18,
              color: '#FFFFFF',
              lineHeight: 1.2,
            }}
          >
            Detalle
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 2 }}>
        {loading ? (
          <Box sx={{ mx: 1.5, mt: 1.5, bgcolor: tokens.surface, borderRadius: '16px', border: `1px solid ${tokens.border}`, p: 1.75 }}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="text" width="40%" />
          </Box>
        ) : (
          <>
            {arribo && (
              <Box
                sx={{
                  bgcolor: tokens.surface,
                  mx: 1.5,
                  mt: 1.5,
                  borderRadius: '16px',
                  border: `1px solid ${tokens.border}`,
                  p: 1.75,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: tokens.brandLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconBus size={20} color={tokens.brand} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: '"DM Mono", monospace',
                        fontWeight: 700,
                        fontSize: 20,
                        color: tokens.textPrimary,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.2,
                      }}
                    >
                      {arribo.descripcionLinea} {arribo.descripcionCortaBandera}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: '"DM Mono", monospace',
                      fontWeight: 400,
                      fontSize: 11,
                      color: tokens.textMuted,
                      lineHeight: 1.2,
                    }}
                  >
                    Int. {arribo.identificadorCoche}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                    mb: 1.25,
                  }}
                >
                  <Box sx={{ bgcolor: tokens.surface2, borderRadius: '10px', p: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 600,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: tokens.textMuted,
                        lineHeight: 1.2,
                        mb: 0.25,
                      }}
                    >
                      Llega en
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"DM Mono", monospace',
                        fontWeight: 600,
                        fontSize: 16,
                        color: tokens.textPrimary,
                        lineHeight: 1.2,
                      }}
                    >
                      {getHoraArribo()}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 400,
                        fontSize: 10,
                        color: tokens.textSecondary,
                        lineHeight: 1.2,
                      }}
                    >
                      {arribo.tiempoArriboMinutos ? `${arribo.tiempoArriboMinutos} min` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: tokens.surface2, borderRadius: '10px', p: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 600,
                        fontSize: 10,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: tokens.textMuted,
                        lineHeight: 1.2,
                        mb: 0.25,
                      }}
                    >
                      Distancia
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"DM Mono", monospace',
                        fontWeight: 600,
                        fontSize: 16,
                        color: tokens.textPrimary,
                        lineHeight: 1.2,
                      }}
                    >
                      {formatDistancia(arribo.distanciaKm)}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 400,
                        fontSize: 10,
                        color: tokens.textSecondary,
                        lineHeight: 1.2,
                      }}
                    >
                      del colectivo
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ borderTop: `0.5px solid ${tokens.border}`, pt: 0.875 }}>
                  <DetailRow icon={<IconFlag size={14} />} label="Recorrido" value={arribo.descripcionBandera} />
                  {parada && (
                    <DetailRow
                      icon={<IconMapPin size={14} />}
                      label="Parada"
                      value={`${parada.cod_sms} - ${parada.calle1Nombre} Y ${parada.calle2Nombre}`}
                    />
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.875, borderTop: `0.5px solid ${tokens.border}` }}>
                    <Box sx={{ width: 20, flexShrink: 0, pt: '1px', color: tokens.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconSatellite size={14} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: '"DM Sans", sans-serif',
                        fontWeight: 400,
                        fontSize: 11,
                        color: tokens.textMuted,
                        lineHeight: 1.3,
                        minWidth: 70,
                      }}
                    >
                      GPS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontWeight: 500,
                          fontSize: 12,
                          color: tokens.textPrimary,
                          lineHeight: 1.3,
                          flexGrow: 1,
                        }}
                      >
                        {getGpsBadge(arribo.minutosDesdeUltimaGPS).label}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 10,
                          fontWeight: 600,
                          px: 0.75,
                          py: 0.125,
                          borderRadius: '5px',
                          bgcolor: getGpsBadge(arribo.minutosDesdeUltimaGPS).bg,
                          color: getGpsBadge(arribo.minutosDesdeUltimaGPS).color,
                          lineHeight: 1.3,
                          flexShrink: 0,
                        }}
                      >
                        hace {arribo.minutosDesdeUltimaGPS} min
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
          </>
        )}

        <Box sx={{ height: 350, mx: 1.5, my: 1.5, borderRadius: '14px', border: `1px solid ${tokens.border}`, overflow: 'hidden', position: 'relative' }}>
          {!isLoaded || loading ? (
            <Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: 0 }} />
          ) : (
            <>
              {rutaPath.length > 0 && (
                <Box
                  onClick={() => setMostrarRecorrido((v) => !v)}
                  sx={{
                    position: 'absolute',
                    top: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    bgcolor: 'white',
                    borderRadius: '20px',
                    px: 1.5,
                    py: 0.625,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
                    cursor: 'pointer',
                    border: mostrarRecorrido ? '1.5px solid #F05510' : '1px solid rgba(0,0,0,0.1)',
                    transition: 'border 0.15s',
                  }}
                >
                  <IconRoute size={13} color={mostrarRecorrido ? '#F05510' : '#6B6760'} />
                  <Typography sx={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 12,
                    fontWeight: 500,
                    color: mostrarRecorrido ? '#F05510' : '#6B6760',
                    lineHeight: 1,
                  }}>
                    {mostrarRecorrido ? 'Ocultar recorrido' : 'Ver recorrido'}
                  </Typography>
                </Box>
              )}
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={14}
                onLoad={(map) => {
                  mapRef.current = map;
                  setMapReady(true);
                }}
                options={{
                  disableDefaultUI: true,
                  zoomControl: false,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  keyboardShortcuts: false,
                }}
              >
                <OverlayView
                  position={center}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h })}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'default',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: '#1A1917', border: '3px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconBusStop size={16} color="#FFFFFF" />
                    </div>
                    <div style={{
                      marginTop: 4, background: 'white', borderRadius: 6,
                      padding: '2px 7px', fontSize: 10,
                      fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                      color: '#1A1917',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                      whiteSpace: 'nowrap',
                    }}>
                      Parada {parada?.cod_sms}
                    </div>
                  </div>
                </OverlayView>

                {tienePosicionValida && (
                  <OverlayView
                    position={{ lat: arribo!.latitud, lng: arribo!.longitud }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h })}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'default',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: '#F05510', border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(240,85,16,0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <IconBus size={16} color="#FFFFFF" />
                      </div>
                      <div style={{
                        marginTop: 4, background: 'white', borderRadius: 6,
                        padding: '2px 7px', fontSize: 10,
                        fontFamily: '"DM Sans", sans-serif', fontWeight: 600,
                        color: '#F05510',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        whiteSpace: 'nowrap',
                      }}>
                        Int. {arribo!.identificadorCoche}
                      </div>
                    </div>
                  </OverlayView>
                )}

                {rutaPath.length > 0 && (
                  <Polyline
                    path={rutaPath}
                    options={{
                      strokeColor: '#F05510',
                      strokeOpacity: 0.75,
                      strokeWeight: 4,
                      visible: mostrarRecorrido,
                    }}
                  />
                )}
              </GoogleMap>
            </>
          )}
        </Box>

        {loadingRecorrido && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1, mx: 1.5 }}>
            <Skeleton variant="rounded" width={120} height={20} sx={{ borderRadius: '8px' }} />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, px: 1.5 }}>
          <Box
            onClick={handleShare}
            sx={{
              flex: 1,
              height: 42,
              borderRadius: '10px',
              border: `1.5px solid ${tokens.borderStrong}`,
              bgcolor: tokens.surface,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              cursor: 'pointer',
              '&:hover': { bgcolor: tokens.surface2 },
            }}
          >
            <IconShare size={15} color={tokens.textSecondary} />
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                fontSize: 13,
                color: tokens.textPrimary,
                lineHeight: 1.2,
              }}
            >
              Compartir
            </Typography>
          </Box>
          <Box
            onClick={() => navigate('/')}
            sx={{
              flex: 2,
              height: 42,
              borderRadius: '10px',
              bgcolor: tokens.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              cursor: 'pointer',
              '&:hover': { bgcolor: tokens.brandDark },
            }}
          >
            <IconArrowLeft size={15} color="#FFFFFF" />
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: 13,
                color: '#FFFFFF',
                lineHeight: 1.2,
              }}
            >
              Volver
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.875, borderTop: `0.5px solid ${tokens.border}` }}>
      <Box sx={{ width: 20, flexShrink: 0, pt: '1px', color: tokens.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 400,
          fontSize: 11,
          color: tokens.textMuted,
          lineHeight: 1.3,
          minWidth: 70,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 500,
          fontSize: 12,
          color: tokens.textPrimary,
          lineHeight: 1.3,
          mt: '1px',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}
