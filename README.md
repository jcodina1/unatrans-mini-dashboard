# Mini Dashboard de Operaciones · Unión Andina de Transportes

Aplicación web que carga el Excel de operaciones y muestra indicadores, gráficos, una tabla y filtros.
Todo se procesa en el navegador; no hay backend.

**Demo en vivo:** https://unatrans-mini-dashboard.vercel.app — pulsa «Usar Excel de la prueba» para cargar los datos.

## Ejecutar

Requisitos: Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Comando            | Qué hace |
|--------------------|----------|
| `npm test`         | Pruebas unitarias e integración con el Excel de muestra |
| `npm run coverage` | Cobertura de `src/lib` |
| `npm run build`    | Sitio estático en `dist/` |

En la pantalla inicial se arrastra o selecciona un `.xlsx`, o se pulsa «Usar Excel de la prueba»
(`public/datos-muestra.xlsx`).

## Funcionalidad

- **Carga**: lee la hoja «Datos» (o la primera). Valida columnas, fechas, números, SLA, IDs únicos y calificación;
  las filas inválidas se descartan y se listan en el panel de calidad.
- **Indicadores**: ingresos, costos, margen y % margen, operaciones, cumplimiento SLA.
- **Gráficos**: tendencia mensual, margen por zona (clic filtra la zona), operaciones por estado con su SLA.
- **Tabla**: ordenable por columna, paginada.
- **Filtros**: zona, tipo de servicio, estado, rango de fechas y búsqueda. Afectan a KPIs, gráficos y tabla.

## Definición de indicadores

| Indicador          | Cálculo |
|--------------------|---------|
| Margen             | ingresos − costos (se recalcula; se avisa si el archivo trae otro valor) |
| % margen           | margen total / ingresos totales |
| Cumplimiento SLA   | operaciones con SLA «Sí» / operaciones filtradas |
| Desviación de horas| (horas reales − planeadas) / planeadas |

## Estructura

```
src/
  lib/            lógica pura y probada
    normalizar.ts   validación y conversión de filas
    leerExcel.ts    lectura del .xlsx en el navegador
    metricas.ts     KPIs, serie mensual, agrupaciones
    filtros.ts      filtros
    formato.ts      formato es-CO (pesos, %, fechas)
  components/     CargaArchivo, TarjetasKpi, PanelFiltros, Graficos, TablaOperaciones, PanelCalidad
  App.tsx         estado y composición
public/datos-muestra.xlsx   Excel de la prueba (datos sintéticos)
```

## Tecnologías

React 18, TypeScript, Vite, `read-excel-file`, Recharts, Vitest.

## Herramienta de Vibe Coding

Construido con **Claude Code** (Anthropic): análisis del enunciado y los datos, generación de la lógica con pruebas,
de la interfaz, y revisión de la app en navegador para iterar ajustes.
