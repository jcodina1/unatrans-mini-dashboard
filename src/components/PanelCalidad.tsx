import type { Incidencia } from '../lib/types';

interface Props {
  incidencias: Incidencia[];
  filasLeidas: number;
  validas: number;
  hoja: string;
}

/** Resume la validación del archivo: cuántas filas se usaron y por qué se descartó o corrigió alguna. */
export function PanelCalidad({ incidencias, filasLeidas, validas, hoja }: Props) {
  const errores = incidencias.filter((i) => i.severidad === 'error').length;
  const avisos = incidencias.length - errores;
  const ok = incidencias.length === 0;

  return (
    <details className={`calidad ${ok ? 'calidad--ok' : 'calidad--alerta'}`}>
      <summary>
        <span className="calidad__icono" aria-hidden="true">{ok ? '✓' : '!'}</span>
        Hoja «{hoja}»: {validas} de {filasLeidas} filas válidas
        {ok ? ' · sin inconsistencias' : ` · ${errores} descartadas, ${avisos} avisos`}
      </summary>
      <div className="calidad__cuerpo">
        <p>
          Validaciones aplicadas: columnas requeridas, fechas y números legibles, SLA Sí/No, IDs únicos, calificación
          1–5 y <em>margen = ingresos − costos</em> (se recalcula siempre).
        </p>
        {!ok && (
          <ul>
            {incidencias.slice(0, 50).map((i) => (
              <li key={`${i.fila}-${i.mensaje}`} className={`calidad__item calidad__item--${i.severidad}`}>
                <span className="mono">Fila {i.fila}</span> {i.mensaje}
              </li>
            ))}
            {incidencias.length > 50 && <li>… y {incidencias.length - 50} más</li>}
          </ul>
        )}
      </div>
    </details>
  );
}
