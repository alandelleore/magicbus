import { useState, useEffect, useMemo } from 'react';
import { getLineasGobierno, type LineaGobierno } from '../services/apiGobierno';

export function useLineasGobierno() {
  const [lineas, setLineas] = useState<LineaGobierno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLineas = async () => {
      try {
        const data = await getLineasGobierno();
        setLineas(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error cargando líneas');
      } finally {
        setLoading(false);
      }
    };
    fetchLineas();
  }, []);

  const mapaLineas = useMemo(() => {
    const map = new Map<string, LineaGobierno>();
    lineas.forEach((linea) => {
      const nombreLimpio = linea.nombre.replace(/\s+/g, ' ').trim();
      map.set(nombreLimpio, linea);
      map.set(linea.nombreCorto.trim(), linea);
      map.set(linea.codigoEMR, linea);
      
      const matchSolo = linea.nombre.match(/^(\d+|[A-Z])\s*/);
      if (matchSolo) {
        map.set(matchSolo[1], linea);
      }
    });
    return map;
  }, [lineas]);

  const buscarLineaId = (descripcionLinea: string): string | null => {
    const limpia = descripcionLinea.trim();
    
    const linea = mapaLineas.get(limpia);
    if (linea) return linea.id;

    const match = limpia.match(/^(\d+)/);
    if (match) {
      const encontrada = mapaLineas.get(match[1]);
      if (encontrada) return encontrada.id;
    }

    return null;
  };

  return { lineas, loading, error, buscarLineaId };
}