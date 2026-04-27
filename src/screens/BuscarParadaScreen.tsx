import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  CircularProgress,
  AppBar,
  Toolbar,
  Chip,
  Fab,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useNavigate } from 'react-router-dom';
import { buscarParadas } from '../services/api';
import type { Parada } from '../types';

export default function BuscarParadaScreen() {
  const [query, setQuery] = useState('');
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [loading, setLoading] = useState(false);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const navigate = useNavigate();

  const buscar = async (q: string) => {
    const hasQuery = q.trim().length > 0;
    const hasUbicacion = ubicacion?.lat && ubicacion?.lng;
    
    if (!hasQuery && !hasUbicacion) {
      setParadas([]);
      return;
    }
    
    setLoading(true);
    try {
      const result = await buscarParadas(hasQuery ? q : '', ubicacion?.lat, ubicacion?.lng);
      console.log('result:', result);
      setParadas(result.paradas || []);
    } catch (error) {
      console.error('Error buscando paradas:', error);
      setParadas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    buscar(query);
  };

  const obtenerUbicacion = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUbicacion({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setQuery('');
          buscar('');
        },
        (error) => {
          console.error('Error de geolocalización:', error);
        }
      );
    }
  };

  useEffect(() => {
    if (ubicacion) {
      buscar('');
    }
  }, [ubicacion]);

  const parseLineas = (lineasTXT: string) => {
    return lineasTXT.replace(/<\/?b>/g, '').split(' | ').map((l) => l.trim());
  };

  const seleccionarParada = (cod_sms: string) => {
    navigate(`/cuando-llega/${cod_sms}`);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white' }}>
            Buscar parada
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          Tus consultas más recientes
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="Buscar parada por número de parada o por dirección"
            placeholder="Ingresar parada o dirección"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} color="primary">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && paradas.length > 0 && (
          <List>
            {paradas.map((parada) => (
              <ListItem key={parada.cod_sms} disablePadding>
                <ListItemButton onClick={() => seleccionarParada(parada.cod_sms)}>
                  <ListItemIcon>
                    <LocationOnIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        {parada.cod_sms} ({parada.nombre})
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {parseLineas(parada.lineasTXT).slice(0, 4).map((linea, idx) => (
                          <Chip
                            key={idx}
                            label={linea}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {!loading && paradas.length === 0 && query && (
          <Typography sx={{ textAlign: 'center', py: 4 }} color="text.secondary">
            No se encontraron paradas
          </Typography>
        )}
      </Container>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={obtenerUbicacion}
      >
        <MyLocationIcon />
      </Fab>
    </Box>
  );
}