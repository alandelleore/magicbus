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
    const codigoMap = new Map<string, LineaGobierno[]>();
    
    lineas.forEach((linea) => {
      const codigo = linea.codigoEMR;
      const existing = codigoMap.get(codigo) || [];
      existing.push(linea);
      codigoMap.set(codigo, existing);
      
      if (linea.nombreCorto) map.set(linea.nombreCorto, linea);
      if (linea.nombre) map.set(linea.nombre, linea);
    });
    
    return { map, codigoMap };
  }, [lineas]);

  const buscarLineaId = useCallback((descripcionLinea: string, descripcionCortaBandera?: string): string | null => {
    if (lineas.length === 0) return null;
    
    const limpia = descripcionLinea.trim();
    
    // 1. Intentar coincidencia directa por nombre o nombreCorto
    let linea = mapaLineas.map.get(limpia);
    if (linea) return linea.id;
    
    // 2. Buscar por codigoEMR
    const opciones = mapaLineas.codigoMap.get(limpia);
    if (!opciones?.length) return null;
    
    // Si solo hay una opción, devolverla
    if (opciones.length === 1) return opciones[0].id;
    
    // 3. Filtrar por bandera corta
    if (descripcionCortaBandera) {
      const bandera = descripcionCortaBandera.trim().toLowerCase();
      
      // Mapeo de banderas cortas a variantes en API 2
      const banderaVariants = [bandera];
      if (bandera === 'roja') banderaVariants.push('rojo');
      if (bandera === 'negra') banderaVariants.push('negro');
      
      const conBandera = opciones.find(o => {
        const nombreLower = o.nombre.toLowerCase();
        const nombreCortoLower = o.nombreCorto.toLowerCase();
        
        return banderaVariants.some(v => 
          nombreLower.includes(v) ||
          nombreCortoLower.includes(v) ||
          nombreCortoLower.endsWith(` ${v}`) ||
          nombreLower.endsWith(` ${v}`)
        );
      });
      
      if (conBandera) return conBandera.id;
    }
    
    // 4. Lógica de respaldo: primera opción
    return opciones[0].id;
  }, [mapaLineas, lineas.length]);

  return { lineas, loading, error, buscarLineaId };
}
