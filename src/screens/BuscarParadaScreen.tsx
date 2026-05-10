import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  CircularProgress,
  Fab,
  InputBase,
} from '@mui/material';
import { IconSearch, IconMapPin, IconCurrentLocation } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { buscarParadas } from '../services/api';
import type { Parada } from '../types';
import { tokens } from '../theme';

const CACHE_KEY = 'magicbus_search';

function loadCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCache(query: string, paradas: Parada[], searched: boolean) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ query, paradas, searched }));
  } catch {}
}

export default function BuscarParadaScreen() {
  const cached = loadCache();
  const [query, setQuery] = useState(cached?.query ?? '');
  const [paradas, setParadas] = useState<Parada[]>(cached?.paradas ?? []);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(cached?.searched ?? false);
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
    setSearched(true);
    try {
      const result = await buscarParadas(
        hasQuery ? q : '',
        ubicacion?.lat,
        ubicacion?.lng,
      );
      const results = result.paradas || [];
      setParadas(results);
      saveCache(q, results, true);
    } catch {
      setParadas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => buscar(query);

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
        },
      );
    }
  };

  useEffect(() => {
    if (ubicacion) buscar('');
  }, [ubicacion]);

  const parseLineas = (lineasTXT: string) =>
    lineasTXT.replace(/<\/?b>/g, '').split(' | ').map((l) => l.trim());

  const seleccionarParada = (cod_sms: string) => {
    navigate(`/cuando-llega/${cod_sms}`);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: tokens.bg }}>
      <AppBar position="static" sx={{ bgcolor: tokens.brand }}>
        <Toolbar sx={{ minHeight: '48px !important', px: 2, flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              fontSize: 18,
              color: '#FFFFFF',
              lineHeight: 1.3,
              mt: 0.5,
            }}
          >
            Buscar parada
          </Typography>
          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 1.2,
              mb: 0.5,
            }}
          >
            Ingresá una parada o dirección
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          bgcolor: tokens.surface,
          borderRadius: '16px',
          border: `1px solid ${tokens.border}`,
          mx: 1.75,
          mt: 1.75,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: 48,
            px: 1.75,
            gap: 1.25,
          }}
        >
          <IconSearch size={18} color={tokens.brand} />
          <InputBase
            fullWidth
            placeholder="Ingresar parada o dirección"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 14,
              color: tokens.textPrimary,
              '&::placeholder': { color: tokens.textMuted, opacity: 1 },
            }}
          />
        </Box>

        {paradas.length > 0 && (
          <Box sx={{ height: '0.5px', bgcolor: tokens.border, mx: 1.75 }} />
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading &&
          paradas.map((parada, idx) => (
            <Box
              key={parada.cod_sms}
              onClick={() => seleccionarParada(parada.cod_sms)}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1.5,
                px: 1.75,
                py: 1.5,
                borderBottom: idx < paradas.length - 1 ? `0.5px solid ${tokens.border}` : 'none',
                cursor: 'pointer',
                '&:hover': { bgcolor: tokens.surface2 },
              }}
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
          ))}

        {!loading && paradas.length === 0 && searched && (
          <Typography
            sx={{ textAlign: 'center', py: 4, color: tokens.textSecondary, fontSize: 14 }}
          >
            No se encontraron paradas
          </Typography>
        )}
      </Box>

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
