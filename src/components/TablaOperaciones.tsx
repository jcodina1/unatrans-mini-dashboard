import { useEffect, useMemo, useState } from 'react';
import type { Operacion } from '../lib/types';
import { formatoCOP, formatoEntero, formatoFecha } from '../lib/formato';

type Clave = keyof Pick<Operacion, 'id' | 'fecha' | 'zona' | 'ruta' | 'tipoServicio' | 'cliente' | 'km' | 'estado' | 'slaCumplido' | 'ingresos' | 'costos' | 'margen' | 'calificacion'>;

interface Columna {
  clave: Clave;
  titulo: string;
  numerica?: boolean;
}

const COLUMNAS: Columna[] = [
  { clave: 'id', titulo: 'ID' },
  { clave: 'fecha', titulo: 'Fecha' },
  { clave: 'zona', titulo: 'Zona' },
  { clave: 'ruta', titulo: 'Ruta' },
  { clave: 'tipoServicio', titulo: 'Servicio' },
  { clave: 'cliente', titulo: 'Cliente' },
  { clave: 'km', titulo: 'Km', numerica: true },
  { clave: 'estado', titulo: 'Estado' },
  { clave: 'slaCumplido', titulo: 'SLA' },
  { clave: 'ingresos', titulo: 'Ingresos', numerica: true },
  { clave: 'costos', titulo: 'Costos', numerica: true },
  { clave: 'margen', titulo: 'Margen', numerica: true },
  { clave: 'calificacion', titulo: 'Calif.', numerica: true },
];

const POR_PAGINA = 12;

const comparar = (a: Operacion[Clave], b: Operacion[Clave]): number => {
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return (Number.isNaN(a) ? -Infinity : a) - (Number.isNaN(b) ? -Infinity : b);
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), 'es');
};

const claseEstado = (estado: string): string =>
  `estado estado--${estado.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')}`;

export function TablaOperaciones({ operaciones }: { operaciones: Operacion[] }) {
  const [orden, setOrden] = useState<{ clave: Clave; asc: boolean }>({ clave: 'fecha', asc: false });
  const [pagina, setPagina] = useState(0);

  const ordenadas = useMemo(
    () => [...operaciones].sort((a, b) => (orden.asc ? 1 : -1) * comparar(a[orden.clave], b[orden.clave])),
    [operaciones, orden],
  );
  const paginas = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));

  useEffect(() => setPagina(0), [operaciones]);

  const visibles = ordenadas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const cambiarOrden = (clave: Clave) =>
    setOrden((o) => (o.clave === clave ? { clave, asc: !o.asc } : { clave, asc: clave !== 'fecha' && !COLUMNAS.find((c) => c.clave === clave)?.numerica }));

  return (
    <section className="panel tabla" aria-labelledby="tabla-titulo">
      <header className="tabla__cabecera">
        <div>
          <h3 id="tabla-titulo">Registro de operaciones</h3>
          <p>{formatoEntero(operaciones.length)} registros · clic en un encabezado para ordenar</p>
        </div>
      </header>

      <div className="tabla__scroll">
        <table>
          <thead>
            <tr>
              {COLUMNAS.map((c) => (
                <th
                  key={c.clave}
                  scope="col"
                  className={c.numerica ? 'num' : undefined}
                  aria-sort={orden.clave === c.clave ? (orden.asc ? 'ascending' : 'descending') : 'none'}
                >
                  <button type="button" onClick={() => cambiarOrden(c.clave)}>
                    {c.titulo}
                    <span className="flecha" aria-hidden="true">{orden.clave === c.clave ? (orden.asc ? '▲' : '▼') : ''}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={COLUMNAS.length} className="tabla__vacia">Ninguna operación coincide con los filtros.</td>
              </tr>
            )}
            {visibles.map((o) => (
              <tr key={o.id}>
                <td className="mono">{o.id}</td>
                <td className="nowrap">{formatoFecha(o.fecha)}</td>
                <td>{o.zona}</td>
                <td className="nowrap">{o.ruta}</td>
                <td>{o.tipoServicio}</td>
                <td>{o.cliente}</td>
                <td className="num">{formatoEntero(o.km)}</td>
                <td><span className={claseEstado(o.estado)}>{o.estado}</span></td>
                <td><span className={o.slaCumplido ? 'sla sla--si' : 'sla sla--no'}>{o.slaCumplido ? 'Sí' : 'No'}</span></td>
                <td className="num">{formatoCOP(o.ingresos)}</td>
                <td className="num">{formatoCOP(o.costos)}</td>
                <td className={`num ${o.margen < 0 ? 'negativo' : ''}`}>{formatoCOP(o.margen)}</td>
                <td className="num">{Number.isFinite(o.calificacion) ? o.calificacion : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className="paginacion" aria-label="Paginación">
        <button type="button" className="btn btn--texto" disabled={pagina === 0} onClick={() => setPagina((p) => p - 1)}>
          ← Anterior
        </button>
        <span className="num">
          Página {pagina + 1} de {paginas}
        </span>
        <button type="button" className="btn btn--texto" disabled={pagina >= paginas - 1} onClick={() => setPagina((p) => p + 1)}>
          Siguiente →
        </button>
      </nav>
    </section>
  );
}
