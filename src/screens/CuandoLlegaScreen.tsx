import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Chip,
  Fab,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate, useParams } from 'react-router-dom';
import { getParadaInfo } from '../services/api';
import type { Arribo, ParadaInfo } from '../types';

export default function CuandoLlegaScreen() {
  const { id } = useParams<{ id: string }>();
  const [arribos, setArribos] = useState<Arribo[]>([]);
  const [parada, setParada] = useState<ParadaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const result = await getParadaInfo(id);
        setArribos(result.arribos || []);
        setParada(result.parada?.[0] || null);
      } catch (error) {
        console.error('Error fetching arribos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const getIconColor = (minutos: number | null, minutosGPS: number) => {
    if (minutos === null) return 'error';
    if (minutosGPS > 10) return 'error';
    if (minutosGPS > 4) return 'warning';
    return 'success';
  };

  const getIcon = (minutos: number | null, minutosGPS: number) => {
    if (minutos === null) return <WarningIcon color="error" />;
    if (minutosGPS > 10) return <WarningIcon color="error" />;
    if (minutosGPS > 4) return <ScheduleIcon color="warning" />;
    return <CheckCircleIcon color="success" />;
  };

  const getTiempoTexto = (minutos: number | null) => {
    if (minutos === null) return 'SIN SERVICIO';
    if (minutos === 0) return 'Llegando';
    return `${minutos} min`;
  };

  const seleccionarArribo = (arriboItem: Arribo) => {
    navigate(`/detalle/${id}/${arriboItem.identificadorCoche}`);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white' }}>
            Cuándo llega
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 2, pb: 10 }}>
        <Alert severity="success" sx={{ mb: 2 }}>
          Ya estamos mostrando todos los arribos.
        </Alert>

        {parada && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Parada {parada.cod_sms}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {parada.calle1Nombre} Y {parada.calle2Nombre} (ochava {parada.ochava})
            </Typography>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <List>
            {arribos.map((item, index) => (
              <ListItem key={`${item.identificadorCoche}-${index}`} disablePadding>
                <ListItemButton onClick={() => seleccionarArribo(item)}>
                  <ListItemIcon>
                    {getIcon(item.tiempoArriboMinutos, item.minutosDesdeUltimaGPS)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        {item.descripcionLinea} {item.descripcionCortaBandera}
                      </Typography>
                    }
                  />
                  <Chip
                    label={getTiempoTexto(item.tiempoArriboMinutos)}
                    color={getIconColor(item.tiempoArriboMinutos, item.minutosDesdeUltimaGPS) as any}
                    variant={item.tiempoArriboMinutos === null ? 'outlined' : 'filled'}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}

        {!loading && arribos.length === 0 && (
          <Typography sx={{ textAlign: 'center', py: 4 }} color="text.secondary">
            No hay colectivos en camino
          </Typography>
        )}
      </Container>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/')}
      >
        <SearchIcon />
      </Fab>
    </Box>
  );
}