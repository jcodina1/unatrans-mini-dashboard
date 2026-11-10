const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const entero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const decimal1 = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const formatoCOP = (n: number): string => cop.format(n);
export const formatoEntero = (n: number): string => entero.format(n);

/** $134,4 M · $850 mil · $1.234 */
export function formatoCOPCorto(n: number): string {
  const abs = Math.abs(n);
  const signo = n < 0 ? '−' : '';
  if (abs >= 1e9) return `${signo}$${decimal1.format(abs / 1e9)} mil M`;
  if (abs >= 1e6) return `${signo}$${decimal1.format(abs / 1e6)} M`;
  if (abs >= 1e3) return `${signo}$${entero.format(abs / 1e3)} mil`;
  return `${signo}$${entero.format(abs)}`;
}

export const formatoPct = (r: number): string => (Number.isFinite(r) ? `${decimal1.format(r * 100)} %` : '—');
export const formatoDecimal = (n: number): string => (Number.isFinite(n) ? decimal1.format(n) : '—');

export const formatoFecha = (d: Date): string =>
  `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`;

/** "2025-03" → "mar 25" */
export const formatoMes = (clave: string): string => {
  const [a, m] = clave.split('-');
  return `${MESES[Number(m) - 1]} ${a.slice(2)}`;
};
