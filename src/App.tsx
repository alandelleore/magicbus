import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import BuscarParadaScreen from './screens/BuscarParadaScreen';
import CuandoLlegaScreen from './screens/CuandoLlegaScreen';
import DetalleScreen from './screens/DetalleScreen';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BuscarParadaScreen />} />
          <Route path="/cuando-llega/:id" element={<CuandoLlegaScreen />} />
          <Route path="/detalle/:id/:interno" element={<DetalleScreen />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}