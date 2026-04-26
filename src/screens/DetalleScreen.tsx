import { useState, useEffect } from 'react';
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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate, useParams } from 'react-router-dom';
import { getParadaInfo } from '../services/api';
import type { Arribo, ParadaInfo } from '../types';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function DetalleScreen() {
  const { id, interno } = useParams<{ id: string; interno: string }>();
  const navigate = useNavigate();
  const [arribo, setArribo] = useState<Arribo | null>(null);
  const [parada, setParada] = useState<ParadaInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const result = await getParadaInfo(id);
        const found = result.arribos?.find((a) => a.identificadorCoche === interno);
        setArribo(found || null);
        setParada(result.parada?.[0] || null);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchData();
  }, [id, interno]);

  const handleShare = async () => {
    if (!arribo || !parada) return;
    const text = `${arribo.descripcionLinea} ${arribo.descripcionCortaBandera} (Int. ${arribo.identificadorCoche}) llega en ${arribo.tiempoArriboMinutos} min. a la parada ${parada.cod_sms} (${parada.calle1Nombre} y ${parada.calle2Nombre})`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Magic Bus',
          text: text,
        });
      } catch (e) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const formatDistancia = (km: number) => {
    if (km < 1) return `${(km * 1000).toFixed(0)} mts.`;
    return `${km.toFixed(2)} km.`;
  };

  const center: [number, number] = parada
    ? [parada.punto_x, parada.punto_y]
    : [-32.9441, -60.6346];

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
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {arribo.descripcionLinea} {arribo.descripcionCortaBandera}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              (Int. {arribo.identificadorCoche})
            </Typography>

            <List dense>
              <ListItem>
                <ListItemText
                  primary="Hora de arribo anunciada"
                  secondary={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

        <Box sx={{ flexGrow: 1, minHeight: 300 }}>
          <MapContainer
            center={center}
            zoom={15}
            style={{ height: '100%', width: '100%', borderRadius: 12 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {parada && (
              <Marker position={[parada.punto_x, parada.punto_y]} icon={defaultIcon}>
                <Popup>Parada {parada.cod_sms}</Popup>
              </Marker>
            )}
            {arribo && (
              <Marker position={[arribo.latitud, arribo.longitud]} icon={defaultIcon}>
                <Popup>Coche {arribo.identificadorCoche}</Popup>
              </Marker>
            )}
          </MapContainer>
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ShareIcon />}
              onClick={handleShare}
            >
              Compartir
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/')}
            >
              Volver
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}