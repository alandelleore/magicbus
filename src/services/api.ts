import { SearchResponse, ArribosResponse } from '../types';

const API_BASE = '/api/proxy';

export const buscarParadas = async (query: string, lat?: number, lon?: number): Promise<SearchResponse> => {
  const params = new URLSearchParams({
    query,
    lat: lat?.toString() ?? 'null',
    lon: lon?.toString() ?? 'null'
  });
  
  const response = await fetch(`${API_BASE}/search?${params}`);
  return response.json();
};

export const getLineas = async (): Promise<string[]> => {
  const response = await fetch(`${API_BASE}/lineas`);
  return response.json();
};

export const getArribos = async (paradaId: string, multiparada = false): Promise<ArribosResponse> => {
  const params = new URLSearchParams({
    multiparada: multiparada.toString(),
    _t: Date.now().toString()
  });
  
  const response = await fetch(`${API_BASE}/parada/${paradaId}/arribos?${params}`);
  return response.json();
};

export const getParadaInfo = async (paradaId: string): Promise<ArribosResponse> => {
  const response = await fetch(`${API_BASE}/parada/${paradaId}/arribos?multiparada=true&_t=${Date.now()}`);
  return response.json();
};