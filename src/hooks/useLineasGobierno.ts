import { useState, useEffect, useMemo, useCallback } from 'react';
import { getLineasGobierno, type LineaGobierno } from '../services/apiGobierno';

let cacheLineas: LineaGobierno[] | null = null;

export function useLineasGobierno() {
  const [lineas, setLineas] = useState<LineaGobierno[]>(cacheLineas || []);
  const [loading, setLoading] = useState(!cacheLineas);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cacheLineas) return;
    
    const fetchLineas = async () => {
      try {
        const data = await getLineasGobierno();
        cacheLineas = data;
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
      map.set(linea.codigoEMR, linea);
      if (linea.nombreCorto) map.set(linea.nombreCorto, linea);
      if (linea.nombre) map.set(linea.nombre, linea);
      if (linea.id) map.set(linea.id, linea);
    });
    return map;
  }, [lineas]);

  const buscarLineaId = useCallback((descripcionLinea: string): string | null => {
    if (lineas.length === 0) return null;
    
    const limpia = descripcionLinea.trim();
    
    let linea = mapaLineas.get(limpia);
    if (linea) return linea.id;
    
    const match = limpia.match(/^(\d+)/);
    if (match) {
      linea = mapaLineas.get(match[1]);
      if (linea) return linea.id;
    }

    return null;
  }, [mapaLineas, lineas.length]);

  return { lineas, loading, error, buscarLineaId };
}