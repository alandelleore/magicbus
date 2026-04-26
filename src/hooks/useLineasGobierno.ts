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
      const nombreLimpio = linea.nombre.replace(/\s+/g, ' ').trim();
      map.set(nombreLimpio, linea);
      map.set(linea.nombreCorto.trim(), linea);
      map.set(linea.codigoEMR, linea);
      
      const matchSolo = linea.nombre.match(/^(\d+)/);
      if (matchSolo) {
        map.set(matchSolo[1], linea);
      }
      
      // Agregar variaciones comunes
      if (linea.nombre.includes('NEGRO')) map.set(linea.codigoEMR + ' N', linea);
      if (linea.nombre.includes('ROJO')) map.set(linea.codigoEMR + ' R', linea);
      if (linea.nombre.includes('VERDE')) map.set(linea.codigoEMR + ' VERDE', linea);
    });
    return map;
  }, [lineas]);

  const buscarLineaId = useCallback((descripcionLinea: string): string | null => {
    if (lineas.length === 0) return null;
    
    const limpia = descripcionLinea.trim();
    
    // Buscar directa
    let linea = mapaLineas.get(limpia);
    if (linea) return linea.id;
    
    // Extraer número
    const match = limpia.match(/^(\d+)/);
    if (match) {
      linea = mapaLineas.get(match[1]);
      if (linea) return linea.id;
    }

    return null;
  }, [mapaLineas, lineas.length]);

  return { lineas, loading, error, buscarLineaId };
}