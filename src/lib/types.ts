/** Una operación de transporte ya validada y normalizada. */
export interface Operacion {
  id: string;
  fecha: Date;
  zona: string;
  ruta: string;
  tipoServicio: string;
  cliente: string;
  vehiculo: string;
  km: number;
  horasPlaneadas: number;
  horasReales: number;
  estado: string;
  slaCumplido: boolean;
  ingresos: number;
  costos: number;
  margen: number;
  calificacion: number;
}

export type Severidad = 'error' | 'aviso';

/** Problema detectado en una fila del Excel. `fila` es la fila real en Excel (1 = encabezado). */
export interface Incidencia {
  fila: number;
  severidad: Severidad;
  mensaje: string;
}

export interface ResultadoCarga {
  operaciones: Operacion[];
  incidencias: Incidencia[];
  filasLeidas: number;
}

export type CeldaExcel = string | number | boolean | Date | null;
export type FilaExcel = CeldaExcel[];
