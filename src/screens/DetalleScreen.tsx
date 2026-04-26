import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const BUS_ICON = 'https://ssl.gstatic.com/images/icons/palau/dir21_hc.png';
const STOP_ICON = 'https://ssl.gstatic.com/images/icons/palau/dir21_gc.png';

import { useNavigate, useParams } from 'react-router-dom';
import { getParadaInfo } from '../services/api';
import { getLineaGobierno } from '../services/apiGobierno';
import { useLineasGobierno } from '../hooks/useLineasGobierno';
import type { Arribo, ParadaInfo } from '../types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCP4Zo1sJq5nfWsnWNUa9j6aI5lSMWArBk';

const mapContainerStyle = {
  width: '100%',
  height: '350px',
};

export default function DetalleScreen() {
  const { id, interno } = useParams<{ id: string; interno: string }>();
  const navigate = useNavigate();
  const { buscarLineaId } = useLineasGobierno();
  
  const [arribo, setArribo] = useState<Arribo | null>(null);
  const [parada, setParada] = useState<ParadaInfo | null>(null);
  const [lineaDetalle, setLineaDetalle] = useState<any>(null);
  const [loadingRecorrido, setLoadingRecorrido] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const result = await getParadaInfo(id);
        const found = result.arribos?.find((a: Arribo) => a.identificadorCoche === interno);
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
  }, [id, interno, buscarLineaId]);

  const handleShare = async () => {
    if (!arribo || !parada) return;
    const text = `${arribo.descripcionLinea} ${arribo.descripcionCortaBandera} (Int. ${arribo.identificadorCoche}) llega en ${arribo.tiempoArriboMinutos} min. a la parada ${parada.cod_sms} (${parada.calle1Nombre} y ${parada.calle2Nombre})`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Magic Bus', text });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const formatDistancia = (km: number) => {
    if (km < 1) return `${(km * 1000).toFixed(0)} mts.`;
    return `${km.toFixed(2)} km.`;
  };

const center = useMemo(() => {
    if (parada) {
      return { lat: parada.punto_x, lng: parada.punto_y };
    }
    return { lat: -32.9441, lng: -60.6346 };
  }, [parada]);

  const horaArribo = arribo && arribo.tiempoArriboMinutos
    ? new Date(Date.now() + arribo.tiempoArriboMinutos * 60000)
    : null;

  const colorLinea = lineaDetalle?.color || '#1976d2';

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
                  primary="Hora de arribo которая объявляется"
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

        <Box sx={{ height: 350, mb: 2, borderRadius: 2, overflow: 'hidden' }}>
          {!isLoaded ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f0f0f0' }}>
              <CircularProgress />
            </Box>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={14}
              options={{
                disableDefaultUI: false,
                zoomControl: true,
              }}
>
              <Marker 
                position={center} 
                title={parada ? `Parada ${parada.cod_sms}` : 'Parada'}
                icon={STOP_ICON}
              />
              {arribo && (
                <Marker 
                  position={{ lat: arribo.latitud, lng: arribo.longitud }} 
                  title={`Coche ${arribo.identificadorCoche}`}
                  icon={BUS_ICON}
                />
              )}
            </GoogleMap>
          )}
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