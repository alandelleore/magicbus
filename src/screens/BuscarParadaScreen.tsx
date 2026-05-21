import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Skeleton,
  Fab,
  AppBar,
  Toolbar,
} from '@mui/material';
import { IconArrowLeft, IconMapPin, IconCurrentLocation, IconStar, IconStarFilled } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { buscarParadas } from '../services/api';
import type { Parada } from '../types';
import { tokens } from '../theme';
import MagicBusLogo from '../components/MagicBusLogo';
import SearchBox from '../components/SearchBox';
import { useFavoritos } from '../hooks/useFavoritos';
import { useSearchContext } from '../context/SearchContext';
import DownloadCTA from '../components/DownloadCTA';

export default function BuscarParadaScreen() {
  const [inputValue, setInputValue] = useState('');
  const [queryBuscada, setQueryBuscada] = useState('');
  const [resultados, setResultados] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const addLog = useCallback((msg: string) => {
    setDebugLogs(prev => [...prev, msg]);
    console.log('[📍GeoDebug]', msg);
  }, []);
  const navigate = useNavigate();
  const { favoritos, toggleFavorito, esFavorito } = useFavoritos();
  const { searchState, setSearchState } = useSearchContext();

  useEffect(() => {
    if (searchState.queryBuscada) {
      setInputValue(searchState.inputValue);
      setQueryBuscada(searchState.queryBuscada);
      setResultados(searchState.resultados);
    }
  }, []);

  const hasBuscado = queryBuscada.length > 0;

  const handleSearch = async () => {
    const q = inputValue.trim();
    if (!q) return;
    setErrorMsg('');
    setQueryBuscada(q);
    setLoading(true);
    try {
      const data = await buscarParadas(q);
      const results = data.paradas || [];
      setResultados(results);
      setSearchState({ inputValue: q, queryBuscada: q, resultados: results });
    } catch {
      setResultados([]);
      setSearchState({ inputValue: q, queryBuscada: q, resultados: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setErrorMsg('');
    if (val === '') {
      setQueryBuscada('');
      setResultados([]);
      setSearchState({ inputValue: '', queryBuscada: '', resultados: [] });
    }
  };

  const parseLineas = (lineasTXT: string) =>
    lineasTXT.replace(/<\/?b>/g, '').split(' | ').map((l) => l.trim());

  const splitNombre = (nombre: string) => {
    const parts = nombre.split(' y ');
    return { calle1Nombre: parts[0] || nombre, calle2Nombre: parts[1] || '' };
  };

  const seleccionarParada = (cod_sms: string) => {
    navigate(`/cuando-llega/${cod_sms}`);
  };

  const obtenerUbicacion = async () => {
    setLoading(true);
    setQueryBuscada(' ');
    setResultados([]);
    setInputValue('');
    setSearchState({ inputValue: '', queryBuscada: ' ', resultados: [] });
    setErrorMsg('');
    setDebugLogs([]);

    addLog('Iniciando búsqueda de ubicación...');
    let lat: number, lng: number;

    const cached = (window as any).__nativeLocation as { lat: number; lng: number } | undefined;
    if (cached) {
      addLog('✅ Cache hit, usando coordenadas previas');
      lat = cached.lat;
      lng = cached.lng;
    } else {
      const hasPostMessage = !!(window as any).ReactNativeWebView?.postMessage;
      addLog(`¿ReactNativeWebView.postMessage disponible? ${hasPostMessage ? 'SÍ' : 'NO'}`);
      const hasGeolocation = !!navigator.geolocation;
      addLog(`¿navigator.geolocation disponible? ${hasGeolocation ? 'SÍ' : 'NO'}`);

      if (hasPostMessage) {
        addLog('Intentando postMessage a app nativa...');
        let cleaned = false;
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          delete (window as any).__handleLocation;
          delete (window as any).__handleLocationError;
        };

        try {
          const pos = await new Promise<{ lat: number; lng: number }>((resolve, reject) => {
            const timeout = setTimeout(() => {
              cleanup();
              addLog('❌ Timeout 15s alcanzado');
              reject(new Error('timeout'));
            }, 15000);

            (window as any).__handleLocation = (loc: { lat: number; lng: number }) => {
              addLog(`✅ Recibidas coordenadas: ${loc.lat}, ${loc.lng}`);
              cleanup();
              resolve(loc);
            };
            (window as any).__handleLocationError = (msg: string) => {
              addLog(`❌ Error recibido de app nativa: ${msg}`);
              cleanup();
              reject(new Error(msg));
            };

            addLog('Enviando GET_LOCATION...');
            (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'GET_LOCATION' }));
          });

          (window as any).__nativeLocation = pos;
          lat = pos.lat;
          lng = pos.lng;
          addLog('✅ Coordenadas cacheadas en __nativeLocation');
        } catch (err) {
          cleanup();
          setLoading(false);
          setQueryBuscada('');
          const msg = err instanceof Error ? err.message : 'Error desconocido';
          setErrorMsg(`No se pudo obtener tu ubicación. ${msg}`);
          setSearchState({ inputValue: '', queryBuscada: '', resultados: [] });
          return;
        }
      } else if (hasGeolocation) {
        addLog('Intentando navigator.geolocation...');
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
              enableHighAccuracy: false,
            });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          addLog(`✅ Coordenadas obtenidas: ${lat}, ${lng}`);
        } catch {
          addLog('❌ navigator.geolocation falló');
          setLoading(false);
          setQueryBuscada('');
          setErrorMsg('No se pudo obtener tu ubicación. Intentá de nuevo o buscá por texto.');
          setSearchState({ inputValue: '', queryBuscada: '', resultados: [] });
          return;
        }
      } else {
        addLog('❌ Sin postMessage ni geolocation');
        setLoading(false);
        setQueryBuscada('');
        setErrorMsg('No se pudo obtener tu ubicación. Intentá de nuevo o buscá por texto.');
        setSearchState({ inputValue: '', queryBuscada: '', resultados: [] });
        return;
      }
    }

    addLog('Llamando a la API con coordenadas...');
    try {
      const data = await buscarParadas('', lat, lng);
      const results = data.paradas || [];
      setResultados(results);
      setSearchState({ inputValue: '', queryBuscada: ' ', resultados: results });
      addLog(`✅ API respondió con ${results.length} resultados`);
      setDebugLogs([]);
    } catch {
      addLog('❌ API falló');
      setResultados([]);
      setSearchState({ inputValue: '', queryBuscada: ' ', resultados: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: tokens.bg, display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" sx={{ bgcolor: tokens.brand }}>
        <Toolbar sx={{ minHeight: '48px !important', px: 1.5, gap: 1 }}>
          {hasBuscado && (
            <Box
              onClick={() => handleInputChange('')}
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
            >
              <IconArrowLeft size={14} color="#FFFFFF" />
            </Box>
          )}
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: 18,
              color: '#FFFFFF',
              lineHeight: 1.2,
            }}
          >
            {hasBuscado ? 'Búsqueda' : 'MagicBus'}
          </Typography>
        </Toolbar>
      </AppBar>

      {hasBuscado ? (
        <Box sx={{ flex: 1, px: 1.5, pt: 1.5 }}>
          <SearchBox value={inputValue} onChange={handleInputChange} onSearch={handleSearch} />

          {loading && [0, 1, 2].map(i => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 1.75, py: 1.5, borderBottom: i < 2 ? `0.5px solid ${tokens.border}` : 'none' }}>
              <Skeleton variant="circular" width={30} height={30} />
              <Box sx={{ flexGrow: 1 }}>
                <Skeleton variant="text" width="30%" height={16} />
                <Skeleton variant="text" width="60%" height={14} sx={{ mt: 0.5 }} />
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.75 }}>
                  <Skeleton variant="rounded" width={40} height={18} sx={{ borderRadius: '6px' }} />
                  <Skeleton variant="rounded" width={50} height={18} sx={{ borderRadius: '6px' }} />
                </Box>
              </Box>
            </Box>
          ))}

          {!loading && resultados.length === 0 && !errorMsg && (
            <Typography sx={{ textAlign: 'center', py: 4, color: tokens.textSecondary, fontSize: 14 }}>
              No se encontraron paradas
            </Typography>
          )}

          {errorMsg && (
            <Typography sx={{ textAlign: 'center', py: 2, color: tokens.red, fontSize: 12 }}>
              {errorMsg}
            </Typography>
          )}

          {!loading && resultados.map((parada, idx) => {
            const isFav = esFavorito(parada.cod_sms);
            return (
            <Box
              key={parada.cod_sms}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                px: 1.75,
                py: 1.5,
                borderBottom: idx < resultados.length - 1 ? `0.5px solid ${tokens.border}` : 'none',
                '&:hover': { bgcolor: tokens.surface2 },
              }}
            >
              <Box
                onClick={() => seleccionarParada(parada.cod_sms)}
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexGrow: 1, minWidth: 0, cursor: 'pointer' }}
              >
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    bgcolor: tokens.brandLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 0.125,
                  }}
                >
                  <IconMapPin size={14} color={tokens.brand} />
                </Box>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: '"DM Mono", monospace',
                      fontWeight: 600,
                      fontSize: 13,
                      color: tokens.textPrimary,
                      lineHeight: 1.3,
                    }}
                  >
                    {parada.cod_sms}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 400,
                      fontSize: 12,
                      color: tokens.textSecondary,
                      mt: 0.125,
                      lineHeight: 1.3,
                    }}
                  >
                    {parada.nombre}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.75 }}>
                    {parseLineas(parada.lineasTXT).slice(0, 4).map((linea, li) => (
                      <Typography
                        key={li}
                        sx={{
                          fontFamily: '"DM Mono", monospace',
                          fontWeight: 500,
                          fontSize: 10,
                          color: tokens.textSecondary,
                          bgcolor: tokens.surface2,
                          borderRadius: '6px',
                          px: 0.75,
                          py: 0.25,
                          lineHeight: 1.3,
                        }}
                      >
                        {linea}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
              <Box
                onClick={() => toggleFavorito({ cod_sms: parada.cod_sms, ...splitNombre(parada.nombre) })}
                sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mt: 0.25, cursor: 'pointer', px: 0.5 }}
              >
                {isFav ? (
                  <IconStarFilled size={16} color="#F05510" />
                ) : (
                  <IconStar size={16} color="#9B9790" />
                )}
              </Box>
            </Box>
            );
          })}
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '15%',
            px: 2,
          }}
        >
          <MagicBusLogo variant="light" />
          <Box sx={{ mt: 3, width: '100%', maxWidth: 340 }}>
            <SearchBox value={inputValue} onChange={handleInputChange} onSearch={handleSearch} />
          </Box>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: 11,
              color: tokens.textMuted,
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            Buscá por número de parada<br />o nombre de calle
          </Typography>

          {favoritos.length > 0 && (
            <Box sx={{ width: '100%', maxWidth: 340, mt: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  fontSize: 13,
                  color: tokens.textSecondary,
                  mb: 1,
                }}
              >
                Paradas favoritas
              </Typography>
              {favoritos.map(f => (
                <Box
                  key={f.cod_sms}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    px: 1.75,
                    py: 1.5,
                    bgcolor: tokens.surface,
                    borderRadius: '12px',
                    border: `1px solid ${tokens.border}`,
                    mb: 0.75,
                  }}
                >
                  <Box
                    onClick={() => seleccionarParada(f.cod_sms)}
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexGrow: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: '50%',
                        bgcolor: tokens.brandLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        mt: 0.125,
                      }}
                    >
                      <IconMapPin size={14} color={tokens.brand} />
                    </Box>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: '"DM Mono", monospace',
                          fontWeight: 600,
                          fontSize: 13,
                          color: tokens.textPrimary,
                          lineHeight: 1.3,
                        }}
                      >
                        {f.cod_sms}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontWeight: 400,
                          fontSize: 12,
                          color: tokens.textSecondary,
                          mt: 0.125,
                          lineHeight: 1.3,
                        }}
                      >
                        {f.calle1Nombre}{f.calle2Nombre ? ` y ${f.calle2Nombre}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    onClick={() => toggleFavorito({ cod_sms: f.cod_sms, calle1Nombre: f.calle1Nombre, calle2Nombre: f.calle2Nombre })}
                    sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mt: 0.25, cursor: 'pointer', px: 0.5 }}
                  >
                    <IconStarFilled size={16} color="#F05510" />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}

      <DownloadCTA />

      {debugLogs.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 72,
            left: 8,
            right: 8,
            bgcolor: '#1A1917',
            borderRadius: '10px',
            p: 1.25,
            zIndex: 9999,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {debugLogs.map((log, i) => {
            const ok = log.includes('✅');
            const err = log.includes('❌');
            return (
              <Typography
                key={i}
                sx={{
                  fontFamily: '"DM Mono", monospace',
                  fontSize: 10,
                  lineHeight: 1.6,
                  color: err ? tokens.red : ok ? tokens.green : '#FFFFFF',
                }}
              >
                {log}
              </Typography>
            );
          })}
        </Box>
      )}

      <Fab
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          width: 44,
          height: 44,
          bgcolor: tokens.brand,
          boxShadow: `0 3px 10px rgba(240,85,16,0.35)`,
          '&:hover': { bgcolor: tokens.brandDark },
        }}
        onClick={obtenerUbicacion}
      >
        <IconCurrentLocation size={20} color="#FFFFFF" />
      </Fab>
    </Box>
  );
}
