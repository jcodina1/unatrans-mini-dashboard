import type { Kpis } from '../lib/metricas';
import { formatoCOP, formatoCOPCorto, formatoDecimal, formatoEntero, formatoPct } from '../lib/formato';

interface Props {
  kpis: Kpis;
  total: number;
}

export function TarjetasKpi({ kpis, total }: Props) {
  const margenNegativo = kpis.margen < 0;
  return (
    <section className="kpis" aria-label="Indicadores principales">
      <article className="kpi kpi--destacado">
        <h3>Ingresos</h3>
        <p className="kpi__valor" title={formatoCOP(kpis.ingresos)}>{formatoCOPCorto(kpis.ingresos)}</p>
        <p className="kpi__nota">{Number.isFinite(kpis.ingresoPorKm) ? formatoCOP(kpis.ingresoPorKm) : '—'} por km · {formatoEntero(kpis.km)} km</p>
      </article>

      <article className="kpi">
        <h3>Costos</h3>
        <p className="kpi__valor" title={formatoCOP(kpis.costos)}>{formatoCOPCorto(kpis.costos)}</p>
        <p className="kpi__nota">{formatoPct(kpis.ingresos ? kpis.costos / kpis.ingresos : NaN)} de los ingresos</p>
      </article>

      <article className={`kpi ${margenNegativo ? 'kpi--negativo' : 'kpi--positivo'}`}>
        <h3>Margen</h3>
        <p className="kpi__valor" title={formatoCOP(kpis.margen)}>{formatoCOPCorto(kpis.margen)}</p>
        <p className="kpi__nota">
          <strong>{formatoPct(kpis.margenPct)}</strong> margen · {kpis.operacionesConPerdida} ops. con pérdida
        </p>
      </article>

      <article className="kpi">
        <h3>Operaciones</h3>
        <p className="kpi__valor">{formatoEntero(kpis.operaciones)}</p>
        <p className="kpi__nota">
          de {formatoEntero(total)} · {formatoPct(kpis.completadasPct)} completadas
        </p>
      </article>

      <article className="kpi">
        <h3>Cumplimiento SLA</h3>
        <p className="kpi__valor">{formatoPct(kpis.slaPct)}</p>
        <div className="medidor" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((kpis.slaPct || 0) * 100)} aria-label="Cumplimiento SLA">
          <span style={{ transform: `scaleX(${Number.isFinite(kpis.slaPct) ? kpis.slaPct : 0})` }} />
        </div>
        <p className="kpi__nota">
          Calificación {formatoDecimal(kpis.calificacionPromedio)}/5 · horas {kpis.desviacionHorasPct >= 0 ? '+' : ''}
          {formatoPct(kpis.desviacionHorasPct)} vs plan
        </p>
      </article>
    </section>
  );
}
