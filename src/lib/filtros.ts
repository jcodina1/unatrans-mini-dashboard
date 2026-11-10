import type { Operacion } from './types';

export interface Filtros {
  zonas: readonly string[];
  tipos: readonly string[];
  estados: readonly string[];
  /** YYYY-MM-DD inclusive, o '' para sin límite. */
  desde: string;
  hasta: string;
  busqueda: string;
}

export const FILTROS_VACIOS: Filtros = { zonas: [], tipos: [], estados: [], desde: '', hasta: '', busqueda: '' };

const aIso = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const coincide = (lista: readonly string[], valor: string): boolean => lista.length === 0 || lista.includes(valor);

const normal = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lista vacía en una dimensión = "todos". La búsqueda mira ID, ruta, cliente y vehículo. */
export function aplicarFiltros(ops: readonly Operacion[], f: Filtros): Operacion[] {
  const q = normal(f.busqueda.trim());
  return ops.filter((o) => {
    if (!coincide(f.zonas, o.zona) || !coincide(f.tipos, o.tipoServicio) || !coincide(f.estados, o.estado)) return false;
    const iso = aIso(o.fecha);
    if (f.desde && iso < f.desde) return false;
    if (f.hasta && iso > f.hasta) return false;
    if (q && !normal(`${o.id} ${o.ruta} ${o.cliente} ${o.vehiculo}`).includes(q)) return false;
    return true;
  });
}

export function valoresUnicos(ops: readonly Operacion[], campo: 'zona' | 'tipoServicio' | 'estado'): string[] {
  return [...new Set(ops.map((o) => o[campo]))].sort((a, b) => a.localeCompare(b, 'es'));
}

/** Agrega o quita un valor sin mutar la lista original. */
export const alternar = (lista: readonly string[], valor: string): string[] =>
  lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];

export const contarFiltrosActivos = (f: Filtros): number =>
  f.zonas.length + f.tipos.length + f.estados.length + (f.desde ? 1 : 0) + (f.hasta ? 1 : 0) + (f.busqueda.trim() ? 1 : 0);

export const rangoFechas = (ops: readonly Operacion[]): { min: string; max: string } => {
  if (ops.length === 0) return { min: '', max: '' };
  const isos = ops.map((o) => aIso(o.fecha)).sort();
  return { min: isos[0], max: isos[isos.length - 1] };
};

export { aIso };
