import { Box, Typography } from '@mui/material';

function getPlacaStyle(ramal: string): { borderColor: string; stripeColor: string } {
  const r = ramal.toUpperCase();
  if (r.includes('NEGR')) return { borderColor: '#1A1917', stripeColor: '#1A1917' };
  if (r.includes('ROJ')) return { borderColor: '#C0392B', stripeColor: '#C0392B' };
  if (r.includes('VERD')) return { borderColor: '#1A7A4A', stripeColor: '#1A7A4A' };
  return { borderColor: '#1A5CAF', stripeColor: '#1A5CAF' };
}

function getStripeLabel(ramal: string): string | null {
  const r = ramal.toUpperCase();
  if (r.includes('AEROP')) return 'AEROP';
  return null;
}

function getNumFontSize(numero: string): number {
  if (numero.length > 9) return 9;
  if (numero.length > 5) return 11;
  return 14;
}

export function PlacaLinea({ numero, ramal }: { numero: string; ramal: string }) {
  const { borderColor, stripeColor } = getPlacaStyle(ramal);
  const stripeLabel = getStripeLabel(ramal);
  const fontSize = getNumFontSize(numero);

  return (
    <Box sx={{
      width: 42,
      flexShrink: 0,
      borderRadius: '6px',
      overflow: 'hidden',
      border: `1.5px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Box sx={{
        height: 10,
        background: stripeColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {stripeLabel && (
          <Typography sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: 6,
            color: '#fff',
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}>
            {stripeLabel}
          </Typography>
        )}
      </Box>
      <Box sx={{
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: '2px',
        px: '2px',
        minHeight: 22,
      }}>
        <Typography sx={{
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 700,
          fontSize,
          color: '#1A1917',
          lineHeight: 1,
          textAlign: 'center',
        }}>
          {numero}
        </Typography>
      </Box>
    </Box>
  );
}
