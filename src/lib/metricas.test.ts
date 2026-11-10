import { describe, expect, it } from 'vitest';
import { agruparPor, calcularKpis, serieMensual } from './metricas';
import { FILTROS_VACIOS, alternar, aplicarFiltros, contarFiltrosActivos, rangoFechas, valoresUnicos } from './filtros';
import { formatoCOPCorto, formatoMes, formatoPct } from './formato';
import type { Operacion } from './types';

const op = (over: Partial<Operacion>): Operacion => ({
  id: 'OP',
  fecha: new Date(2025, 0, 10),
  zona: 'Bogotá',
  ruta: 'Bogotá–Tunja',
  tipoServicio: 'Carga general',
  cliente: 'Cliente A',
  vehiculo: 'VEH-001',
  km: 100,
  horasPlaneadas: 2,
  horasReales: 2,
  estado: 'Completado',
  slaCumplido: true,
  ingresos: 1000,
  costos: 600,
  margen: 400,
  calificacion: 4,
  ...over,
});

const OPS: Operacion[] = [
  op({ id: 'A' }),
  op({ id: 'B', zona: 'Santander', fecha: new Date(2025, 2, 5), ingresos: 500, costos: 700, margen: -200, slaCumplido: false, estado: 'Cancelado', calificacion: 2, horasReales: 3 }),
  op({ id: 'C', tipoServicio: 'Recolección', fecha: new Date(2025, 2, 20), calificacion: NaN }),
];

describe('calcularKpis', () => {
  it('suma y calcula razones correctamente', () => {
    const k = calcularKpis(OPS);
    expect(k.operaciones).toBe(3);
    expect(k.ingresos).toBe(2500);
    expect(k.costos).toBe(1900);
    expect(k.margen).toBe(600);
    expect(k.margenPct).toBeCloseTo(0.24);
    expect(k.slaPct).toBeCloseTo(2 / 3);
    expect(k.completadasPct).toBeCloseTo(2 / 3);
    expect(k.operacionesConPerdida).toBe(1);
    expect(k.ingresoPorKm).toBeCloseTo(2500 / 300);
    expect(k.calificacionPromedio).toBe(3); // ignora NaN
    expect(k.desviacionHorasPct).toBeCloseTo(1 / 6);
  });

  it('devuelve NaN en razones cuando no hay datos', () => {
    const k = calcularKpis([]);
    expect(k.operaciones).toBe(0);
    expect(k.margenPct).toBeNaN();
    expect(k.slaPct).toBeNaN();
  });
});

describe('serieMensual', () => {
  it('rellena meses vacíos y respeta el orden', () => {
    const s = serieMensual(OPS);
    expect(s.map((p) => p.mes)).toEqual(['2025-01', '2025-02', '2025-03']);
    expect(s[1].operaciones).toBe(0);
    expect(s[2]).toMatchObject({ ingresos: 1500, operaciones: 2 });
  });
  it('vacía con lista vacía', () => expect(serieMensual([])).toEqual([]));
});

describe('agruparPor', () => {
  it('agrupa y ordena por ingresos', () => {
    const g = agruparPor(OPS, 'zona');
    expect(g.map((x) => x.nombre)).toEqual(['Bogotá', 'Santander']);
    expect(g[0]).toMatchObject({ operaciones: 2, ingresos: 2000, margen: 800 });
  });
});

describe('filtros', () => {
  it('sin filtros devuelve todo', () => expect(aplicarFiltros(OPS, FILTROS_VACIOS)).toHaveLength(3));

  it('combina zona, estado, fechas y búsqueda', () => {
    expect(aplicarFiltros(OPS, { ...FILTROS_VACIOS, zonas: ['Santander'] }).map((o) => o.id)).toEqual(['B']);
    expect(aplicarFiltros(OPS, { ...FILTROS_VACIOS, estados: ['Completado'], tipos: ['Recolección'] }).map((o) => o.id)).toEqual(['C']);
    expect(aplicarFiltros(OPS, { ...FILTROS_VACIOS, desde: '2025-03-01', hasta: '2025-03-10' }).map((o) => o.id)).toEqual(['B']);
    expect(aplicarFiltros(OPS, { ...FILTROS_VACIOS, busqueda: 'bogota' })).toHaveLength(3);
    expect(aplicarFiltros(OPS, { ...FILTROS_VACIOS, busqueda: 'zzz' })).toHaveLength(0);
  });

  it('utilidades de filtros', () => {
    const lista = ['a'];
    expect(alternar(lista, 'b')).toEqual(['a', 'b']);
    expect(alternar(lista, 'a')).toEqual([]);
    expect(lista).toEqual(['a']); // no muta
    expect(valoresUnicos(OPS, 'zona')).toEqual(['Bogotá', 'Santander']);
    expect(contarFiltrosActivos({ ...FILTROS_VACIOS, zonas: ['x'], desde: '2025-01-01' })).toBe(2);
    expect(rangoFechas(OPS)).toEqual({ min: '2025-01-10', max: '2025-03-20' });
    expect(rangoFechas([])).toEqual({ min: '', max: '' });
  });
});

describe('formato', () => {
  it('abrevia montos en pesos', () => {
    expect(formatoCOPCorto(134_350_665)).toBe('$134,4 M');
    expect(formatoCOPCorto(-250_326)).toBe('−$250 mil');
    expect(formatoCOPCorto(2_500_000_000)).toBe('$2,5 mil M');
    expect(formatoCOPCorto(999)).toBe('$999');
  });
  it('porcentajes y meses', () => {
    expect(formatoPct(0.5563)).toBe('55,6 %');
    expect(formatoPct(NaN)).toBe('—');
    expect(formatoMes('2025-03')).toBe('mar 25');
  });
});
