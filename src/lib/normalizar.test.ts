import { describe, expect, it } from 'vitest';
import { COLUMNAS_REQUERIDAS, ErrorEstructura, aBooleanoSla, aFecha, aNumero, normalizarFilas } from './normalizar';
import type { FilaExcel } from './types';

const ENCABEZADO: FilaExcel = [...COLUMNAS_REQUERIDAS];

const fila = (over: Partial<Record<(typeof COLUMNAS_REQUERIDAS)[number], FilaExcel[number]>> = {}): FilaExcel => {
  const base: Record<string, FilaExcel[number]> = {
    ID_Operacion: 'OP-1',
    Fecha: new Date(Date.UTC(2025, 0, 6)),
    Zona: 'Bogotá',
    Ruta: 'Bogotá–Ibagué',
    Tipo_Servicio: 'Carga general',
    Cliente_Anonimizado: 'Cliente A',
    Vehiculo_Codigo: 'VEH-001',
    Kilometros: 100,
    Horas_Planeadas: 2,
    Horas_Reales: 2.5,
    Estado: 'Completado',
    Cumplimiento_SLA: 'Sí',
    Ingresos_COP: 1000,
    Costos_COP: 600,
    Margen_COP: 400,
    Calificacion_Servicio_1a5: 4,
    ...over,
  };
  return COLUMNAS_REQUERIDAS.map((c) => base[c]);
};

describe('conversores', () => {
  it('convierte Date UTC a fecha local sin desfase de día', () => {
    const d = aFecha(new Date(Date.UTC(2025, 0, 6)));
    expect([d?.getFullYear(), d?.getMonth(), d?.getDate()]).toEqual([2025, 0, 6]);
  });

  it('convierte serial de Excel, ISO y dd/mm/aaaa', () => {
    expect(aFecha(45663)?.getDate()).toBe(6); // 2025-01-06
    expect(aFecha('2025-02-28')?.getMonth()).toBe(1);
    expect(aFecha('31/12/2025')?.getFullYear()).toBe(2025);
    expect(aFecha('31/02/2025')).toBeNull();
    expect(aFecha('hola')).toBeNull();
  });

  it('interpreta números con separadores colombianos', () => {
    expect(aNumero('1.234.567')).toBe(1234567);
    expect(aNumero('$ 1.234,5')).toBe(1234.5);
    expect(aNumero('3.5')).toBe(3.5);
    expect(aNumero('')).toBeNull();
    expect(aNumero('abc')).toBeNull();
  });

  it('reconoce variantes de Sí/No en el SLA', () => {
    expect(aBooleanoSla('Sí')).toBe(true);
    expect(aBooleanoSla('si')).toBe(true);
    expect(aBooleanoSla('No')).toBe(false);
    expect(aBooleanoSla('quizá')).toBeNull();
  });
});

describe('normalizarFilas', () => {
  it('convierte una fila válida', () => {
    const r = normalizarFilas([ENCABEZADO, fila()]);
    expect(r.operaciones).toHaveLength(1);
    expect(r.incidencias).toHaveLength(0);
    expect(r.operaciones[0]).toMatchObject({ id: 'OP-1', slaCumplido: true, margen: 400, km: 100 });
  });

  it('acepta columnas en otro orden y sin tildes', () => {
    const enc = [...ENCABEZADO].reverse();
    const r = normalizarFilas([enc, [...fila()].reverse()]);
    expect(r.operaciones[0].ingresos).toBe(1000);
  });

  it('lanza error claro si faltan columnas', () => {
    expect(() => normalizarFilas([['ID_Operacion', 'Fecha']])).toThrow(ErrorEstructura);
    expect(() => normalizarFilas([['ID_Operacion', 'Fecha']])).toThrow(/Zona/);
  });

  it('recalcula el margen y avisa si el archivo no cuadra', () => {
    const r = normalizarFilas([ENCABEZADO, fila({ Margen_COP: 999 })]);
    expect(r.operaciones[0].margen).toBe(400);
    expect(r.incidencias[0]).toMatchObject({ severidad: 'aviso', fila: 2 });
  });

  it('descarta filas inválidas y duplicadas, e ignora filas vacías', () => {
    const r = normalizarFilas([
      ENCABEZADO,
      fila(),
      fila({ ID_Operacion: 'OP-2', Ingresos_COP: 'n/a' }),
      fila(), // duplicado de OP-1
      COLUMNAS_REQUERIDAS.map(() => null),
    ]);
    expect(r.operaciones).toHaveLength(1);
    expect(r.filasLeidas).toBe(3);
    expect(r.incidencias.filter((i) => i.severidad === 'error')).toHaveLength(2);
  });

  it('marca calificaciones fuera de rango como NaN', () => {
    const r = normalizarFilas([ENCABEZADO, fila({ Calificacion_Servicio_1a5: 9 })]);
    expect(r.operaciones[0].calificacion).toBeNaN();
  });

  it('falla si no hay ninguna operación válida', () => {
    expect(() => normalizarFilas([ENCABEZADO])).toThrow(/ninguna operación/);
    expect(() => normalizarFilas([])).toThrow(/vacía/);
  });
});
