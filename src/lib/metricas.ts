import type { Operacion } from './types';

export interface Kpis {
  operaciones: number;
  ingresos: number;
  costos: number;
  margen: number;
  /** margen / ingresos (0–1). NaN si no hay ingresos. */
  margenPct: number;
  /** operaciones con SLA cumplido / total (0–1). */
  slaPct: number;
  completadasPct: number;
  operacionesConPerdida: number;
  km: number;
  ingresoPorKm: number;
  calificacionPromedio: number;
  /** (horas reales − planeadas) / planeadas. Positivo = más lento de lo planeado. */
  desviacionHorasPct: number;
}

const suma = (ops: readonly Operacion[], f: (o: Operacion) => number): number =>
  ops.reduce((acc, o) => acc + f(o), 0);

const razon = (a: number, b: number): number => (b === 0 ? NaN : a / b);

export const ESTADO_COMPLETADO = 'completado';

export function calcularKpis(ops: readonly Operacion[]): Kpis {
  const ingresos = suma(ops, (o) => o.ingresos);
  const costos = suma(ops, (o) => o.costos);
  const margen = ingresos - costos;
  const km = suma(ops, (o) => o.km);
  const horasPlan = suma(ops, (o) => o.horasPlaneadas);
  const horasReal = suma(ops, (o) => o.horasReales);
  const calificadas = ops.filter((o) => Number.isFinite(o.calificacion));

  return {
    operaciones: ops.length,
    ingresos,
    costos,
    margen,
    margenPct: razon(margen, ingresos),
    slaPct: razon(ops.filter((o) => o.slaCumplido).length, ops.length),
    completadasPct: razon(ops.filter((o) => o.estado.toLowerCase() === ESTADO_COMPLETADO).length, ops.length),
    operacionesConPerdida: ops.filter((o) => o.margen < 0).length,
    km,
    ingresoPorKm: razon(ingresos, km),
    calificacionPromedio: razon(suma(calificadas, (o) => o.calificacion), calificadas.length),
    desviacionHorasPct: razon(horasReal - horasPlan, horasPlan),
  };
}

export interface PuntoMensual {
  mes: string; // YYYY-MM
  ingresos: number;
  costos: number;
  margen: number;
  operaciones: number;
}

export const claveMes = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Serie mensual continua (incluye meses sin operaciones con valor 0). */
export function serieMensual(ops: readonly Operacion[]): PuntoMensual[] {
  if (ops.length === 0) return [];
  const porMes = new Map<string, PuntoMensual>();
  for (const o of ops) {
    const k = claveMes(o.fecha);
    const prev = porMes.get(k) ?? { mes: k, ingresos: 0, costos: 0, margen: 0, operaciones: 0 };
    porMes.set(k, {
      mes: k,
      ingresos: prev.ingresos + o.ingresos,
      costos: prev.costos + o.costos,
      margen: prev.margen + o.margen,
      operaciones: prev.operaciones + 1,
    });
  }
  const tiempos = ops.map((o) => o.fecha.getTime());
  const inicio = new Date(Math.min(...tiempos));
  const fin = new Date(Math.max(...tiempos));
  const serie: PuntoMensual[] = [];
  for (let d = new Date(inicio.getFullYear(), inicio.getMonth(), 1); d <= fin; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const k = claveMes(d);
    serie.push(porMes.get(k) ?? { mes: k, ingresos: 0, costos: 0, margen: 0, operaciones: 0 });
  }
  return serie;
}

export interface Grupo {
  nombre: string;
  operaciones: number;
  ingresos: number;
  costos: number;
  margen: number;
  margenPct: number;
  slaPct: number;
}

export type CampoAgrupable = 'zona' | 'tipoServicio' | 'estado' | 'cliente' | 'ruta';

/** Agrupa por un campo de texto, ordenado por ingresos descendente. */
export function agruparPor(ops: readonly Operacion[], campo: CampoAgrupable): Grupo[] {
  const grupos = new Map<string, Operacion[]>();
  for (const o of ops) grupos.set(o[campo], [...(grupos.get(o[campo]) ?? []), o]);
  return [...grupos.entries()]
    .map(([nombre, lista]) => {
      const k = calcularKpis(lista);
      return {
        nombre,
        operaciones: k.operaciones,
        ingresos: k.ingresos,
        costos: k.costos,
        margen: k.margen,
        margenPct: k.margenPct,
        slaPct: k.slaPct,
      };
    })
    .sort((a, b) => b.ingresos - a.ingresos);
}
