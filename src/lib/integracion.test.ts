import { describe, expect, it } from 'vitest';
import path from 'node:path';
import readXlsxFile, { readSheetNames } from 'read-excel-file/node';
import { normalizarFilas } from './normalizar';
import { calcularKpis, serieMensual } from './metricas';
import type { FilaExcel } from './types';

const ARCHIVO = path.resolve(__dirname, '../../public/datos-muestra.xlsx');

/** Valores de control calculados de forma independiente con pandas sobre el Excel original. */
describe('Excel suministrado (datos-muestra.xlsx)', () => {
  it('se lee completo y los totales cuadran con el cálculo de referencia', async () => {
    expect(await readSheetNames(ARCHIVO)).toContain('Datos');
    const filas = (await readXlsxFile(ARCHIVO, { sheet: 'Datos' })) as FilaExcel[];
    const r = normalizarFilas(filas);

    expect(r.filasLeidas).toBe(160);
    expect(r.operaciones).toHaveLength(160);
    expect(r.incidencias).toHaveLength(0);

    const k = calcularKpis(r.operaciones);
    expect(k.ingresos).toBe(134_350_665);
    expect(k.costos).toBe(104_646_676);
    expect(k.margen).toBe(29_703_989);
    expect(k.slaPct).toBeCloseTo(89 / 160);
    expect(k.operacionesConPerdida).toBe(27);

    const primera = r.operaciones[0];
    expect([primera.fecha.getFullYear(), primera.fecha.getMonth(), primera.fecha.getDate()]).toEqual([2025, 0, 6]);
    const serie = serieMensual(r.operaciones);
    expect(serie[0].mes).toBe('2025-01');
    expect(serie[serie.length - 1].mes).toBe('2026-10');
  });
});
