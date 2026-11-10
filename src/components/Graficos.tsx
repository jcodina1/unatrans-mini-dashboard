import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Grupo, PuntoMensual } from '../lib/metricas';
import { formatoCOP, formatoCOPCorto, formatoEntero, formatoMes, formatoPct } from '../lib/formato';

const C = {
  ingresos: '#1f3a5f',
  costos: '#c9a227',
  margen: '#1f7a5c',
  perdida: '#c2412d',
  rejilla: '#e3ddd0',
  texto: '#5b5f66',
};

const COLOR_ESTADO: Record<string, string> = {
  Completado: '#1f7a5c',
  'Con novedad': '#c9a227',
  Cancelado: '#c2412d',
};
const COLOR_ESTADO_DEFECTO = ['#1f3a5f', '#7a6f9b', '#5b5f66'];

const ejeCOP = (v: number) => formatoCOPCorto(v).replace(' mil', 'k');
const tooltipCOP = (v: number | string) => formatoCOP(Number(v));
const estiloTooltip = { borderRadius: 8, border: '1px solid #d8d1c2', fontFamily: 'Archivo, sans-serif', fontSize: 13 };

export function GraficoMensual({ datos }: { datos: PuntoMensual[] }) {
  return (
    <figure className="panel grafico grafico--ancho">
      <figcaption>
        <h3>Ingresos, costos y margen por mes</h3>
        <p>Barras = ingresos y costos · línea = margen</p>
      </figcaption>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={datos} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={C.rejilla} vertical={false} />
          <XAxis dataKey="mes" tickFormatter={formatoMes} tick={{ fill: C.texto, fontSize: 12 }} tickLine={false} axisLine={false} minTickGap={12} />
          <YAxis tickFormatter={ejeCOP} tick={{ fill: C.texto, fontSize: 12 }} tickLine={false} axisLine={false} width={64} />
          <Tooltip formatter={tooltipCOP} labelFormatter={(l) => formatoMes(String(l))} contentStyle={estiloTooltip} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
          <Bar dataKey="ingresos" name="Ingresos" fill={C.ingresos} radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="costos" name="Costos" fill={C.costos} radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Line dataKey="margen" name="Margen" stroke={C.margen} strokeWidth={2.5} dot={{ r: 2.5 }} type="linear" />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  );
}

interface GraficoZonasProps {
  datos: Grupo[];
  seleccion: readonly string[];
  onSeleccionar: (zona: string) => void;
}

export function GraficoZonas({ datos, seleccion, onSeleccionar }: GraficoZonasProps) {
  return (
    <figure className="panel grafico">
      <figcaption>
        <h3>Margen por zona</h3>
        <p>Haz clic en una barra para filtrar por esa zona</p>
      </figcaption>
      <ResponsiveContainer width="100%" height={Math.max(220, datos.length * 42)}>
        <BarChart data={datos} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid stroke={C.rejilla} horizontal={false} />
          <XAxis type="number" tickFormatter={ejeCOP} tick={{ fill: C.texto, fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="nombre" width={112} tick={{ fill: C.texto, fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={estiloTooltip}
            formatter={(v, nombre, item) =>
              nombre === 'Margen' ? [`${formatoCOP(Number(v))} (${formatoPct(item.payload.margenPct)})`, nombre] : [formatoCOP(Number(v)), nombre]
            }
          />
          <Bar dataKey="margen" name="Margen" radius={[0, 3, 3, 0]} cursor="pointer" onClick={(d: { nombre?: string }) => d.nombre && onSeleccionar(d.nombre)}>
            {datos.map((g) => (
              <Cell
                key={g.nombre}
                fill={g.margen < 0 ? C.perdida : C.margen}
                fillOpacity={seleccion.length === 0 || seleccion.includes(g.nombre) ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function GraficoEstados({ datos }: { datos: Grupo[] }) {
  const total = datos.reduce((a, g) => a + g.operaciones, 0);
  return (
    <figure className="panel grafico">
      <figcaption>
        <h3>Operaciones por estado</h3>
        <p>Proporción y cumplimiento de SLA en cada estado</p>
      </figcaption>
      <div className="dona">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={datos} dataKey="operaciones" nameKey="nombre" innerRadius={58} outerRadius={88} paddingAngle={2} stroke="none">
              {datos.map((g, i) => (
                <Cell key={g.nombre} fill={COLOR_ESTADO[g.nombre] ?? COLOR_ESTADO_DEFECTO[i % COLOR_ESTADO_DEFECTO.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={estiloTooltip} formatter={(v) => `${formatoEntero(Number(v))} operaciones`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="dona__centro" aria-hidden="true">
          <strong>{formatoEntero(total)}</strong>
          <span>ops.</span>
        </div>
      </div>
      <ul className="leyenda">
        {datos.map((g, i) => (
          <li key={g.nombre}>
            <span className="leyenda__punto" style={{ background: COLOR_ESTADO[g.nombre] ?? COLOR_ESTADO_DEFECTO[i % COLOR_ESTADO_DEFECTO.length] }} />
            <span className="leyenda__nombre">{g.nombre}</span>
            <span className="num">{formatoPct(total ? g.operaciones / total : NaN)}</span>
            <span className="leyenda__sla">SLA {formatoPct(g.slaPct)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
