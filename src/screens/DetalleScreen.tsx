import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Grid,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { useNavigate, useParams } from 'react-router-dom';
import { getParadaInfo } from '../services/api';
import { getLineaGobierno } from '../services/apiGobierno';
import { useLineasGobierno } from '../hooks/useLineasGobierno';
import type { Arribo } from '../types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCP4Zo1sJq5nfWsnWNUa9j6aI5lSMWArBk';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const defaultCenter = { lat: -32.9441, lng: -60.6346 };

const PROJ_ORIGIN_LON = -60.5;
const PROJ_ORIGIN_LAT = -33.0;
const PROJ_SCALE = 0.9996;

const gaussToWGS84 = (x: number, y: number): { lat: number; lng: number } => {
  const xkm = (x - 500000) / 100000;
  const ykm = (y - 10000000) / 100000;
  const lng = PROJ_ORIGIN_LON + (xkm / 111319 * PROJ_SCALE);
  const lat = PROJ_ORIGIN_LAT + (ykm / 111319 * PROJ_SCALE);
  return { lat, lng };
};

const parseParadasToCoords = (paradas: any[]): { lat: number; lng: number }[] => {
  if (!paradas || paradas.length === 0) return [];
  return paradas.map((p: any) => gaussToWGS84(p.x, p.y));
};

const formatDistancia = (km: number) => {
  if (km < 1) return `${(km * 1000).toFixed(0)} mts.`;
  return `${km.toFixed(2)} km.`;
};

export default function DetalleScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buscarLineaId } = useLineasGobierno();

  const [parada, setParada] = useState<any>(null);
  const [arribo, setArribo] = useState<Arribo | null>(null);
  const [lineaDetalle, setLineaDetalle] = useState<any>(null);
  const [loadingRecorrido, setLoadingRecorrido] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const result = await getParadaInfo(id);
        const found = result.arribos?.find((a: Arribo) => a.identificadorCoche === id);
        setArribo(found || null);
        setParada(result.parada?.[0] || null);

        if (found) {
          setLoadingRecorrido(true);
          try {
            const lineaId = buscarLineaId(found.descripcionLinea);
            console.log('Buscando lineaId:', found.descripcionLinea, '->', lineaId);
            
            if (lineaId) {
              const rec = await getLineaGobierno('1', lineaId);
              console.log('Recorrido cargado:', rec);
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
      }
    };
    fetchData();
  }, [id, buscarLineaId]);

  const handleShare = async () => {
    if (!arribo || !parada) return;
    const text = `Línea ${arribo.descripcionLinea} - Int. ${arribo.identificadorCoche}
Llega a "${parada.calle1Nombre} Y ${parada.calle2Nombre}"
Distancia: ${formatDistancia(arribo.distanciaKm)}
Parada código: ${parada.cod_sms}`;
    try {
      await navigator.share({ title: 'Magic Bus', text });
    } catch (e) {
      await navigator.clipboard.writeText(text);
    }
  };

  const horaArribo = arribo && arribo.tiempoArriboMinutos
    ? new Date(Date.now() + arribo.tiempoArriboMinutos * 60000)
    : null;

  const center = useMemo(() => {
    if (parada?.punto_x && parada?.punto_y) {
      return gaussToWGS84(parada.punto_x, parada.punto_y);
    }
    return defaultCenter;
  }, [parada]);

  const paradaCoords = useMemo(() => {
    return lineaDetalle?.paradas ? parseParadasToCoords(lineaDetalle.paradas) : [];
  }, [lineaDetalle]);

  const colorLinea = lineaDetalle?.color || '#1976d2';

  if (loadError) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Error loading Google Maps</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white' }}>
            Detalle
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
        {arribo && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: colorLinea }}>
              {arribo.descripcionLinea} {arribo.descripcionCortaBandera}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Int. {arribo.identificadorCoche})
            </Typography>

            <List dense>
              <ListItem>
                <ListItemText
                  primary="Hora de arribo anunciada"
                  secondary={horaArribo ? horaArribo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Bandera / recorrido"
                  secondary={arribo.descripcionBandera}
                />
              </ListItem>
              {parada && (
                <ListItem>
                  <ListItemText
                    primary="Parada"
                    secondary={`${parada.cod_sms} - ${parada.calle1Nombre} Y ${parada.calle2Nombre}`}
                  />
                </ListItem>
              )}
              <ListItem>
                <ListItemText
                  primary="Última actualización GPS"
                  secondary={`hace ${arribo.minutosDesdeUltimaGPS} min`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Distancia"
                  secondary={`El coche se encuentra a ${formatDistancia(arribo.distanciaKm)}`}
                />
              </ListItem>
            </List>
          </Paper>
        )}

        <Box sx={{ mb: 2 }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
            }}
          >
            {parada && (
              <Marker
                position={center}
                label={`P`}
                title={`Parada ${parada.cod_sms}`}
              />
            )}
            {arribo && (
              <Marker
                position={{ lat: arribo.latitud, lng: arribo.longitud }}
                label={`B`}
                title={`Coche ${arribo.identificadorCoche}`}
              />
            )}
            {paradaCoords.length > 0 && (
              <Polyline
                path={paradaCoords}
                options={{
                  strokeColor: colorLinea,
                  strokeOpacity: 0.7,
                  strokeWeight: 3,
                }}
              />
            )}
          </GoogleMap>
        </Box>

        {loadingRecorrido && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" startIcon={<ShareIcon />} onClick={handleShare}>
              Compartir
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={() => navigate('/')}>
              Volver
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}