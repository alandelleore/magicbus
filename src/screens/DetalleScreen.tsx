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
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import { useNavigate, useParams } from 'react-router-dom';
import { getParadaInfo } from '../services/api';
import { getLineaGobierno } from '../services/apiGobierno';
import { useLineasGobierno } from '../hooks/useLineasGobierno';
import type { Arribo, ParadaInfo } from '../types';

const ROSARIO_CENTER = { lat: -32.9441, lng: -60.6346 };

function MockMap({ center }: { center: [number, number] }) {
  const [lat, lng] = center;
  const zoom = 14;
  
  return (
    <Box sx={{ height: '100%', width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
      <iframe
        width="100%"
        height="100%"
        frameBorder={0}
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
        title="Rosario"
      />
    </Box>
  );
}

export default function DetalleScreen() {
  const { id, interno } = useParams<{ id: string; interno: string }>();
  const navigate = useNavigate();
  const { buscarLineaId } = useLineasGobierno();
  
  const [arribo, setArribo] = useState<Arribo | null>(null);
  const [parada, setParada] = useState<ParadaInfo | null>(null);
  const [lineaDetalle, setLineaDetalle] = useState<any>(null);
  const [loadingRecorrido, setLoadingRecorrido] = useState(false);

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

  const center: [number, number] = parada
    ? [parada.punto_y, parada.punto_x]
    : [-60.6346, -32.9441];

  const horaArribo = arribo && arribo.tiempoArriboMinutos
    ? new Date(Date.now() + arribo.tiempoArriboMinutos * 60000)
    : null;

const PROJ_ORIGIN_LON = -60.5;
  const PROJ_ORIGIN_LAT = -33.0;
  const PROJ_SCALE = 0.9996;

  const gaussToWGS84 = (x: number, y: number): [number, number] => {
    const xkm = (x - 500000) / 100000;
    const ykm = (y - 10000000) / 100000;
    const lon = PROJ_ORIGIN_LON + (xkm / 111319 * PROJ_SCALE);
    const lat = PROJ_ORIGIN_LAT + (ykm / 111319 * PROJ_SCALE);
    return [lat, lon];
  };

  const parseGeoJSON = (geojson: any): [number, number][] => {
    if (!geojson?.coordinates) return [];
    const coords: [number, number][] = [];
    geojson.coordinates.forEach((line: number[][]) => {
      if (Array.isArray(line)) {
        line.forEach((point: number[]) => {
          if (point.length >= 2) coords.push([point[1], point[0]]);
        });
      }
    });
    return coords;
  };

  const parseParadasToCoords = (paradas: any[]): [number, number][] => {
    if (!paradas || paradas.length === 0) return [];
    return paradas.map((p: any) => gaussToWGS84(p.x, p.y));
  };

  const idaCoords = lineaDetalle?.geojsonIda ? parseGeoJSON(lineaDetalle.geojsonIda) : [];
  const vueltaCoords = lineaDetalle?.geojsonVuelta ? parseGeoJSON(lineaDetalle.geojsonVuelta) : [];
  const paradaCoords = lineaDetalle?.paradas ? parseParadasToCoords(lineaDetalle.paradas) : [];
  
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
                    secondary={(`${parada.cod_sms} - ${parada.calle1Nombre} Y ${parada.calle2Nombre}`)}
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
          <MockMap center={center} />
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