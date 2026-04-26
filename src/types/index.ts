export interface Parada {
  cod_sms: string;
  nombre: string;
  distancia: number;
  lineasTXT: string;
}

export interface Arribo {
  codigoLinea: string;
  tiempoRestanteArribo: string;
  descripcionLinea: string;
  descripcionBandera: string;
  descripcionCortaBandera: string;
  descripcionCartelBandera: string;
  esAdaptado: boolean;
  latitud: number;
  longitud: number;
  identificadorCoche: string;
  identificadorChofer: string;
  desvioHorario: string;
  ultimaFechaHoraGPS: string;
  latitudParada: string;
  longitudParada: string;
  esLleno: null;
  mensaje: string;
  tiempoArriboMinutos: number;
  minutosDesdeUltimaGPS: number;
  parada: string;
  distanciaKm: number;
}

export interface ParadaInfo {
  id_parada: number;
  calle_uno: number;
  calle_dos: number;
  cod_sms: number;
  ochava: string;
  refugio: string;
  distrito: string;
  punto_x: number;
  punto_y: number;
  sen_x: number;
  cos_x: number;
  sen_y: number;
  cos_y: number;
  calle1Nombre: string;
  calle2Nombre: string;
}

export interface ApiResponse<T> {
  error: boolean;
  mensaje: string | null;
  timestamp: number;
  parades?: T;
}

export interface SearchResponse {
  error: boolean;
  mensajes: string | null;
  paradas: Parada[];
  timestamp: number;
}

export interface ArribosResponse {
  error: boolean;
  mensaje: string | null;
  arrivals: Arribo[];
  parada: ParadaInfo[];
  timestamp: number;
  multiparada: boolean;
}

export interface RecorridoLinea {
  id: string;
  idEmpresa: string;
  nombreEmpresa: string;
  nombre: string;
  nombreCorto: string;
  codigoEMR: string;
  color: string;
  paradas: ParadaRecorridoInfo[];
  geojsonIda: any;
  geojsonVuelta: any;
}

export interface ParadaRecorridoInfo {
  id: string;
  nombre: string;
  descripcion: string;
  longitud: number;
  latitud: number;
  distancia: number;
}

export interface ParadaGobierno {
  id: string;
  nombre: string;
  descripcion: string;
  longitud: number;
  latitud: number;
  lineas: LineaInfo[];
}

export interface LineaInfo {
  id: string;
  nombre: string;
  nombreCorto: string;
  color: string;
}