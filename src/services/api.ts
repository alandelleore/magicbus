import { SearchResponse } from '../types';

const API_BASE = '/api/proxy';

export const buscarParadas = async (query: string, lat?: number, lon?: number): Promise<SearchResponse> => {
  const params = new URLSearchParams({
    query: query || '',
    lat: lat?.toString() ?? '',
    lon: lon?.toString() ?? ''
  });
  console.log('search params:', params.toString());
  const response = await fetch(`${API_BASE}/search?${params}`);
  return response.json();
};

export const getParadaInfo = async (paradaId: string): Promise<any> => {
  const response = await fetch(`${API_BASE}/parada/${paradaId}/arribos?multiparada=true&_t=${Date.now()}`);
  return response.json();
};