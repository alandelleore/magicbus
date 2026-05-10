export interface LineaGobierno {
  id: string;
  idEmpresa: string;
  nombreEmpresa: string;
  nombre: string;
  nombreCorto: string;
  codigoEMR: string;
  color: string;
}

export interface LineaDetalle {
  id: string;
  idEmpresa: string;
  nombreEmpresa: string;
  nombre: string;
  nombreCorto: string;
  codigoEMR: string;
  color: string;
  paradas: {
    id: string;
    idEmpresa: string;
    nombre: string;
    descripcion: string;
    longitud: number;
    latitud: number;
    distancia: number;
  }[];
  geojsonIda: any;
  geojsonVuelta: any;
}

const API_GOBIERNO = '/api/gobierno';

export const getLineasGobierno = async (): Promise<LineaGobierno[]> => {
  const response = await fetch(`${API_GOBIERNO}/lineas?nombre=all`);
  return response.json();
};

export const getLineaGobierno = async (empresa: string, lineaId: string): Promise<LineaDetalle> => {
  const response = await fetch(`${API_GOBIERNO}/linea/${empresa}/${lineaId}?conGeometria=true&usarCoordenadasWGS84=true&conParadas=true`);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};