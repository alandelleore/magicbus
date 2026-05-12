import { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { IconDownload, IconX } from '@tabler/icons-react';
import { tokens } from '../theme';

const CTA_DISMISSED_KEY = 'magicbus_cta_dismissed';
const APK_URL = 'https://magicbus-apk.web.app/magicbus.apk';

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    navigator.userAgent,
  );
}

export default function DownloadCTA() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(CTA_DISMISSED_KEY) === 'true';
  });

  if (dismissed || !isMobile()) return null;

  const handleDismiss = () => {
    localStorage.setItem(CTA_DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 72,
        left: 14,
        right: 14,
        bgcolor: tokens.surface,
        borderRadius: '14px',
        border: `1px solid ${tokens.border}`,
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        zIndex: 1200,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          bgcolor: tokens.brandLight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconDownload size={18} color={tokens.brand} />
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 600,
            fontSize: 13,
            color: tokens.textPrimary,
            lineHeight: 1.3,
          }}
        >
          Descargar app
        </Typography>
        <Typography
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 400,
            fontSize: 11,
            color: tokens.textSecondary,
            lineHeight: 1.3,
            mt: 0.125,
          }}
        >
          Obtené la versión nativa
        </Typography>
      </Box>
      <Box
        component="a"
        href={APK_URL}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          bgcolor: tokens.brand,
          color: '#FFFFFF',
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 600,
          fontSize: 12,
          px: 1.5,
          py: 0.75,
          borderRadius: '8px',
          textDecoration: 'none',
          flexShrink: 0,
          lineHeight: 1.2,
          '&:hover': { bgcolor: tokens.brandDark },
        }}
      >
        APK
      </Box>
      <Box
        onClick={handleDismiss}
        sx={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          '&:hover': { bgcolor: tokens.surface2 },
        }}
      >
        <IconX size={14} color={tokens.textMuted} />
      </Box>
    </Box>
  );
}
