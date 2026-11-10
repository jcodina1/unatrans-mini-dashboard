import type { CeldaExcel, FilaExcel, Incidencia, Operacion, ResultadoCarga } from './types';

/** Columnas que el Excel debe traer, en cualquier orden. */
export const COLUMNAS_REQUERIDAS = [
  'ID_Operacion',
  'Fecha',
  'Zona',
  'Ruta',
  'Tipo_Servicio',
  'Cliente_Anonimizado',
  'Vehiculo_Codigo',
  'Kilometros',
  'Horas_Planeadas',
  'Horas_Reales',
  'Estado',
  'Cumplimiento_SLA',
  'Ingresos_COP',
  'Costos_COP',
  'Margen_COP',
  'Calificacion_Servicio_1a5',
] as const;

type Columna = (typeof COLUMNAS_REQUERIDAS)[number];
type IndiceColumnas = Record<Columna, number>;

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_POR_DIA = 86_400_000;

export class ErrorEstructura extends Error {}

const sinAcentos = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

/** Ubica cada columna requerida en el encabezado. Lanza si falta alguna. */
export function indexarEncabezado(encabezado: FilaExcel): IndiceColumnas {
  const nombres = encabezado.map((c) => sinAcentos(String(c ?? '')));
  const faltantes: string[] = [];
  const indice = {} as IndiceColumnas;
  for (const col of COLUMNAS_REQUERIDAS) {
    const pos = nombres.indexOf(sinAcentos(col));
    if (pos === -1) faltantes.push(col);
    indice[col] = pos;
  }
  if (faltantes.length > 0) {
    throw new ErrorEstructura(`Al archivo le faltan columnas requeridas: ${faltantes.join(', ')}`);
  }
  return indice;
}

/** Convierte Date / serial de Excel / texto ISO o dd/mm/aaaa a una fecha local sin hora. */
export function aFecha(valor: CeldaExcel): Date | null {
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    // Las librerías de Excel devuelven las fechas como medianoche UTC.
    return new Date(valor.getUTCFullYear(), valor.getUTCMonth(), valor.getUTCDate());
  }
  if (typeof valor === 'number' && Number.isFinite(valor)) {
    const utc = new Date(EXCEL_EPOCH_MS + Math.round(valor) * MS_POR_DIA);
    return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
  }
  if (typeof valor === 'string') {
    const iso = valor.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return fechaValida(+iso[1], +iso[2], +iso[3]);
    const latam = valor.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (latam) return fechaValida(+latam[3], +latam[2], +latam[1]);
  }
  return null;
}

function fechaValida(anio: number, mes: number, dia: number): Date | null {
  const d = new Date(anio, mes - 1, dia);
  return d.getMonth() === mes - 1 && d.getDate() === dia ? d : null;
}

/** Acepta números o textos tipo "1.234.567" / "1,234,567" / "$ 1.234". */
export function aNumero(valor: CeldaExcel): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const limpio = valor.replace(/[$\s]/g, '');
  // Si hay coma decimal estilo es-CO ("1.234,5") se normaliza; si no, se quitan separadores de miles.
  const normalizado = /,\d{1,2}$/.test(limpio)
    ? limpio.replace(/\./g, '').replace(',', '.')
    : limpio.replace(/[.,](?=\d{3}(\D|$))/g, '');
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

export function aBooleanoSla(valor: CeldaExcel): boolean | null {
  if (typeof valor === 'boolean') return valor;
  const t = sinAcentos(String(valor ?? ''));
  if (['si', 's', 'yes', 'true', '1', 'cumple'].includes(t)) return true;
  if (['no', 'n', 'false', '0', 'no cumple'].includes(t)) return false;
  return null;
}

const texto = (v: CeldaExcel): string => (v === null || v === undefined ? '' : String(v).trim());

interface FilaProcesada {
  operacion: Operacion | null;
  incidencias: Incidencia[];
}

function procesarFila(fila: FilaExcel, idx: IndiceColumnas, numFila: number): FilaProcesada {
  const get = (c: Columna): CeldaExcel => fila[idx[c]] ?? null;
  const errores: string[] = [];

  const id = texto(get('ID_Operacion'));
  if (!id) errores.push('sin ID_Operacion');

  const fecha = aFecha(get('Fecha'));
  if (!fecha) errores.push(`fecha inválida (${texto(get('Fecha')) || 'vacía'})`);

  const numeros = {
    km: aNumero(get('Kilometros')),
    horasPlaneadas: aNumero(get('Horas_Planeadas')),
    horasReales: aNumero(get('Horas_Reales')),
    ingresos: aNumero(get('Ingresos_COP')),
    costos: aNumero(get('Costos_COP')),
  };
  for (const [campo, valor] of Object.entries(numeros)) {
    if (valor === null) errores.push(`${campo} no es numérico`);
  }

  const sla = aBooleanoSla(get('Cumplimiento_SLA'));
  if (sla === null) errores.push(`Cumplimiento_SLA no reconocido (${texto(get('Cumplimiento_SLA'))})`);

  if (errores.length > 0 || !fecha || sla === null) {
    return {
      operacion: null,
      incidencias: [{ fila: numFila, severidad: 'error', mensaje: `Fila descartada: ${errores.join('; ')}` }],
    };
  }

  const avisos: Incidencia[] = [];
  const ingresos = numeros.ingresos as number;
  const costos = numeros.costos as number;
  const margenCalculado = ingresos - costos;
  const margenArchivo = aNumero(get('Margen_COP'));
  if (margenArchivo !== null && Math.abs(margenArchivo - margenCalculado) > 1) {
    avisos.push({
      fila: numFila,
      severidad: 'aviso',
      mensaje: `${id}: Margen_COP del archivo (${margenArchivo}) ≠ ingresos − costos (${margenCalculado}); se usa el calculado`,
    });
  }

  const calificacion = aNumero(get('Calificacion_Servicio_1a5'));
  const calificacionValida = calificacion !== null && calificacion >= 1 && calificacion <= 5;
  if (!calificacionValida) {
    avisos.push({ fila: numFila, severidad: 'aviso', mensaje: `${id}: calificación fuera de 1–5, se ignora en el promedio` });
  }

  return {
    operacion: {
      id,
      fecha,
      zona: texto(get('Zona')) || 'Sin zona',
      ruta: texto(get('Ruta')) || 'Sin ruta',
      tipoServicio: texto(get('Tipo_Servicio')) || 'Sin tipo',
      cliente: texto(get('Cliente_Anonimizado')) || 'Sin cliente',
      vehiculo: texto(get('Vehiculo_Codigo')) || '—',
      km: numeros.km as number,
      horasPlaneadas: numeros.horasPlaneadas as number,
      horasReales: numeros.horasReales as number,
      estado: texto(get('Estado')) || 'Sin estado',
      slaCumplido: sla,
      ingresos,
      costos,
      margen: margenCalculado,
      calificacion: calificacionValida ? (calificacion as number) : NaN,
    },
    incidencias: avisos,
  };
}

const filaVacia = (fila: FilaExcel): boolean => fila.every((c) => c === null || texto(c) === '');

/**
 * Valida y convierte las filas crudas del Excel (primera fila = encabezado).
 * Nunca muta la entrada; descarta filas inválidas y reporta por qué.
 */
export function normalizarFilas(filas: readonly FilaExcel[]): ResultadoCarga {
  if (filas.length === 0) throw new ErrorEstructura('La hoja está vacía.');
  const idx = indexarEncabezado(filas[0]);

  const operaciones: Operacion[] = [];
  const incidencias: Incidencia[] = [];
  const idsVistos = new Set<string>();
  let filasLeidas = 0;

  filas.slice(1).forEach((fila, i) => {
    const numFila = i + 2;
    if (filaVacia(fila)) return;
    filasLeidas += 1;
    const resultado = procesarFila(fila, idx, numFila);
    incidencias.push(...resultado.incidencias);
    if (!resultado.operacion) return;
    if (idsVistos.has(resultado.operacion.id)) {
      incidencias.push({ fila: numFila, severidad: 'error', mensaje: `Fila descartada: ID duplicado ${resultado.operacion.id}` });
      return;
    }
    idsVistos.add(resultado.operacion.id);
    operaciones.push(resultado.operacion);
  });

  if (operaciones.length === 0) throw new ErrorEstructura('No se encontró ninguna operación válida en el archivo.');
  return { operaciones, incidencias, filasLeidas };
}
