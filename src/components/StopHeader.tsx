import { Box, Typography } from '@mui/material';
import { IconMapPin } from '@tabler/icons-react';
import type { ParadaInfo } from '../types';
import { tokens } from '../theme';

interface StopHeaderProps {
  parada: ParadaInfo;
  secondsLeft: number;
}

const pulseKeyframes = {
  '@keyframes pulse': {
    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
    '50%': { opacity: 0.5, transform: 'scale(0.75)' },
  },
};

export default function StopHeader({ parada, secondsLeft }: StopHeaderProps) {
  return (
    <Box
      sx={{
        bgcolor: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
     <Box sx={{ maxWidth: 640, mx: 'auto', px: 2, py: 1.5 }}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          bgcolor: tokens.brandLight,
          borderRadius: 1,
          px: 1,
          py: 0.375,
          mb: 0.5,
        }}
      >
        <IconMapPin size={12} color={tokens.brand} />
        <Typography
          sx={{
            fontFamily: '"DM Mono", monospace',
            fontWeight: 600,
            fontSize: 11,
            color: tokens.brand,
            lineHeight: 1.2,
          }}
        >
          Parada {parada.cod_sms}
        </Typography>
      </Box>

      <Typography
        sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 600,
          fontSize: 15,
          color: tokens.textPrimary,
          letterSpacing: '-0.01em',
          lineHeight: 1.3,
        }}
      >
        {parada.calle1Nombre} Y {parada.calle2Nombre}
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
        ochava {parada.ochava}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.625, mt: 0.75 }}>
        <Box
          component="span"
          sx={{
            ...pulseKeyframes,
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: tokens.green,
            animation: 'pulse 2s ease infinite',
          }}
        />
        <Typography
          sx={{
            fontFamily: '"DM Mono", monospace',
            fontWeight: 400,
            fontSize: 10,
            color: tokens.textMuted,
            lineHeight: 1.2,
          }}
        >
          actualiza en {secondsLeft}s
        </Typography>
      </Box>
     </Box>
    </Box>
  );
}
