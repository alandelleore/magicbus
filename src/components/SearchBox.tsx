import { Box } from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';
import { tokens } from '../theme';

interface SearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: () => void;
}

export default function SearchBox({ value, onChange, onSearch }: SearchBoxProps) {
  return (
    <Box
      sx={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: `1px solid ${tokens.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        height: 48,
      }}
    >
      <IconSearch size={18} color={tokens.brand} onClick={onSearch} style={{ cursor: 'pointer' }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        placeholder="Parada o dirección..."
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: 14,
          color: tokens.textPrimary,
          background: 'transparent',
        }}
      />
      {value.length > 0 && (
        <Box onClick={() => onChange('')} sx={{ cursor: 'pointer', display: 'flex' }}>
          <IconX size={16} color={tokens.textMuted} />
        </Box>
      )}
    </Box>
  );
}
