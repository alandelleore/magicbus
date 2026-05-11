import { useState } from 'react';

const STORAGE_KEY = 'magicbus_favoritos';

export interface Favorito {
  cod_sms: string;
  calle1Nombre: string;
  calle2Nombre: string;
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  const toggleFavorito = (parada: Favorito) => {
    setFavoritos(prev => {
      const existe = prev.some(f => f.cod_sms === parada.cod_sms);
      const next = existe
        ? prev.filter(f => f.cod_sms !== parada.cod_sms)
        : [...prev, parada];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const esFavorito = (cod_sms: string) =>
    favoritos.some(f => f.cod_sms === cod_sms);

  return { favoritos, toggleFavorito, esFavorito };
}
