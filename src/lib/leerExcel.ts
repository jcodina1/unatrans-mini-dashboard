import readXlsxFile, { readSheetNames } from 'read-excel-file';
import { ErrorEstructura, normalizarFilas } from './normalizar';
import type { FilaExcel, ResultadoCarga } from './types';

const HOJA_PREFERIDA = 'datos';
const MAX_BYTES = 10 * 1024 * 1024;

/** Lee un .xlsx en el navegador. Usa la hoja "Datos" si existe; si no, la primera. */
export async function leerExcel(archivo: File | Blob): Promise<ResultadoCarga & { hoja: string }> {
  if (archivo.size > MAX_BYTES) throw new ErrorEstructura('El archivo supera 10 MB.');
  if (archivo instanceof File && !/\.xlsx$/i.test(archivo.name)) {
    throw new ErrorEstructura('Solo se admiten archivos .xlsx');
  }

  let hojas: string[];
  try {
    hojas = await readSheetNames(archivo);
  } catch {
    throw new ErrorEstructura('No se pudo leer el archivo. ¿Es un Excel (.xlsx) válido?');
  }
  const hoja = hojas.find((h) => h.trim().toLowerCase() === HOJA_PREFERIDA) ?? hojas[0];
  const filas = (await readXlsxFile(archivo, { sheet: hoja })) as FilaExcel[];
  return { ...normalizarFilas(filas), hoja };
}
