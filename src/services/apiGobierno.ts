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

export const getLineasGobierno = async (): Promise<LineaGobierno[]> => {
  const response = await fetch('https://comollego.rosario.gob.ar/lineas?nombre=all');
  return response.json();
};

export const getLineaGobierno = async (empresa: string, lineaId: string): Promise<LineaDetalle> => {
  const response = await fetch(`https://comollego.rosario.gob.ar/linea/${empresa}/${lineaId}`);
  return response.json();
};