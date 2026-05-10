import { useState } from 'react';
import { Card, CardContent, Collapse, Typography, Box } from '@mui/material';
import {
  IconBus,
  IconBusStop,
  IconIdBadge2,
  IconSatellite,
  IconRoute,
  IconChevronDown,
  IconAccessible,
} from '@tabler/icons-react';
import type { Arribo } from '../types';
import { tokens } from '../theme';

interface ArriboCardProps {
  codigoLinea: string;
  descripcionLinea: string;
  descripcionCortaBandera: string;
  arribos: Arribo[];
  onVerDetalle: (arribo: Arribo) => void;
}

function getChipStyle(minutos: number | null) {
  if (minutos === null || minutos === 0) {
    return { bg: tokens.greenBg, color: tokens.green, label: 'Llegando' };
  }
  if (minutos <= 12) {
    return { bg: tokens.greenBg, color: tokens.green, label: `${minutos} min` };
  }
  if (minutos <= 30) {
    return { bg: tokens.amberBg, color: tokens.amber, label: `${minutos} min` };
  }
  return { bg: tokens.surface2, color: tokens.textSecondary, label: `${minutos} min` };
}

function getGpsBadge(minutosGPS: number) {
  if (minutosGPS <= 5) {
    return { bg: tokens.greenBg, color: tokens.green, label: `hace ${minutosGPS} min` };
  }
  return { bg: tokens.amberBg, color: tokens.amber, label: 'sin señal reciente' };
}

const ExpandedRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, py: 0.5 }}>
    <Box sx={{ width: 20, flexShrink: 0, pt: '1px' }}>
      {icon}
    </Box>
    <Typography
      sx={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 11,
        color: tokens.textSecondary,
        minWidth: 70,
        lineHeight: 1.3,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ mt: '1px' }}>{children}</Box>
  </Box>
);

export default function ArriboCard({
  codigoLinea,
  descripcionLinea,
  descripcionCortaBandera,
  arribos,
  onVerDetalle,
}: ArriboCardProps) {
  const [expanded, setExpanded] = useState(false);

  const proximo = arribos[0];
  const segundo = arribos.length > 1 ? arribos[1] : null;
  const chipStyle = getChipStyle(proximo.tiempoArriboMinutos);

  return (
    <Card
      sx={{
        border: `1px solid ${tokens.border}`,
        borderLeft: `3px solid ${tokens.brand}`,
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: 'none',
        mb: 1,
        bgcolor: tokens.surface,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          px: 1.5,
          py: 1.375,
          cursor: 'pointer',
          '&:hover': { bgcolor: tokens.surface2 },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: '10px',
            bgcolor: tokens.surface2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <IconBus size={17} color={tokens.textSecondary} />
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Typography
              sx={{
                fontFamily: '"DM Mono", monospace',
                fontWeight: 600,
                fontSize: 15,
                color: tokens.textPrimary,
                lineHeight: 1.2,
              }}
            >
              {descripcionLinea}
            </Typography>
            {descripcionCortaBandera && (
              <Typography
                sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 500,
                  fontSize: 11,
                  color: tokens.textSecondary,
                  bgcolor: tokens.surface2,
                  borderRadius: '5px',
                  px: 0.625,
                  py: 0.125,
                  lineHeight: 1.3,
                }}
              >
                {descripcionCortaBandera}
              </Typography>
            )}
          </Box>

          <Typography
            sx={{
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 400,
              fontSize: 11,
              color: tokens.textSecondary,
              mt: 0.25,
              lineHeight: 1.3,
            }}
          >
            <Box component="span" sx={{ color: tokens.textMuted }}>Próx.</Box>{' '}
            <Box component="span" sx={{ color: tokens.textPrimary, fontWeight: 500 }}>
              {proximo.tiempoArriboMinutos === null ? 'Llegando' : `${proximo.tiempoArriboMinutos} min`}
            </Box>
            {segundo && (
              <>
                <Box component="span" sx={{ color: tokens.borderStrong, mx: 0.5 }}>·</Box>
                <Box component="span" sx={{ color: tokens.textMuted }}>Sig.</Box>{' '}
                <Box component="span" sx={{ color: tokens.textPrimary, fontWeight: 500 }}>
                  {segundo.tiempoArriboMinutos === null ? 'Llegando' : `${segundo.tiempoArriboMinutos} min`}
                </Box>
              </>
            )}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontFamily: '"DM Mono", monospace',
            fontWeight: 700,
            fontSize: 12,
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            bgcolor: chipStyle.bg,
            color: chipStyle.color,
            flexShrink: 0,
            lineHeight: 1.2,
          }}
        >
          {chipStyle.label}
        </Typography>

        <Box
          sx={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            bgcolor: tokens.surface2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <IconChevronDown size={12} color={tokens.textMuted} />
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box
          sx={{
            bgcolor: tokens.bg,
            borderTop: `0.5px solid ${tokens.border}`,
            px: 1.5,
            py: 1,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#EFEEEC' },
          }}
          onClick={() => onVerDetalle(proximo)}
        >
          <ExpandedRow icon={<IconBusStop size={13} color={tokens.textMuted} />} label="Destino">
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                fontSize: 11,
                color: tokens.textPrimary,
                lineHeight: 1.3,
              }}
            >
              {proximo.descripcionBandera || proximo.descripcionCortaBandera}
            </Typography>
          </ExpandedRow>

          <ExpandedRow icon={<IconIdBadge2 size={13} color={tokens.textMuted} />} label="Interno">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                sx={{
                  fontFamily: '"DM Mono", monospace',
                  fontWeight: 500,
                  fontSize: 11,
                  color: tokens.textPrimary,
                  lineHeight: 1.3,
                }}
              >
                {proximo.identificadorCoche}
              </Typography>
              {proximo.esAdaptado && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.375,
                    bgcolor: tokens.blueBg,
                    color: tokens.blue,
                    fontFamily: '"DM Sans", sans-serif',
                    fontWeight: 500,
                    fontSize: 10,
                    borderRadius: '5px',
                    px: 0.75,
                    py: 0.25,
                    lineHeight: 1.2,
                  }}
                >
                  <IconAccessible size={9} />
                  Adaptado
                </Box>
              )}
            </Box>
          </ExpandedRow>

          <ExpandedRow icon={<IconSatellite size={13} color={tokens.textMuted} />} label="GPS">
            <Box
              sx={{
                display: 'inline-flex',
                fontSize: 10,
                fontWeight: 600,
                px: 0.75,
                py: 0.125,
                borderRadius: '5px',
                bgcolor: getGpsBadge(proximo.minutosDesdeUltimaGPS).bg,
                color: getGpsBadge(proximo.minutosDesdeUltimaGPS).color,
                lineHeight: 1.3,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              {getGpsBadge(proximo.minutosDesdeUltimaGPS).label}
            </Box>
          </ExpandedRow>

          <ExpandedRow icon={<IconRoute size={13} color={tokens.textMuted} />} label="Distancia">
            <Typography
              sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 500,
                fontSize: 11,
                color: tokens.textPrimary,
                lineHeight: 1.3,
              }}
            >
              {proximo.distanciaKm < 1
                ? `${(proximo.distanciaKm * 1000).toFixed(0)} m`
                : `${proximo.distanciaKm.toFixed(2)} km`}
            </Typography>
          </ExpandedRow>
        </Box>
      </Collapse>
    </Card>
  );
}
