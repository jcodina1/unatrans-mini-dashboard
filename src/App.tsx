import { useMemo, useState } from 'react';
import { CargaArchivo } from './components/CargaArchivo';
import { TarjetasKpi } from './components/TarjetasKpi';
import { PanelFiltros } from './components/PanelFiltros';
import { GraficoEstados, GraficoMensual, GraficoZonas } from './components/Graficos';
import { TablaOperaciones } from './components/TablaOperaciones';
import { PanelCalidad } from './components/PanelCalidad';
import { leerExcel } from './lib/leerExcel';
import { ErrorEstructura } from './lib/normalizar';
import { agruparPor, calcularKpis, serieMensual } from './lib/metricas';
import { FILTROS_VACIOS, alternar, aplicarFiltros, rangoFechas, valoresUnicos, type Filtros } from './lib/filtros';
import type { ResultadoCarga } from './lib/types';

type Datos = ResultadoCarga & { hoja: string; archivo: string };

const URL_MUESTRA = `${import.meta.env.BASE_URL}datos-muestra.xlsx`;

const mensajeError = (e: unknown): string =>
  e instanceof ErrorEstructura ? e.message : 'Ocurrió un error inesperado leyendo el archivo.';

export default function App() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async (fuente: () => Promise<{ blob: Blob; nombre: string }>) => {
    setCargando(true);
    setError(null);
    try {
      const { blob, nombre } = await fuente();
      const resultado = await leerExcel(blob);
      setDatos({ ...resultado, archivo: nombre });
      setFiltros(FILTROS_VACIOS);
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  };

  const cargarArchivo = (archivo: File) => cargar(async () => ({ blob: archivo, nombre: archivo.name }));
  const cargarMuestra = () =>
    cargar(async () => {
      const r = await fetch(URL_MUESTRA);
      if (!r.ok) throw new ErrorEstructura('No se encontró el Excel de muestra.');
      return { blob: await r.blob(), nombre: 'Datos_Sinteticos_Prueba_Tecnica_Unatrans.xlsx' };
    });

  const todas = datos?.operaciones ?? [];
  const opciones = useMemo(() => {
    const { min, max } = rangoFechas(todas);
    return {
      zonas: valoresUnicos(todas, 'zona'),
      tipos: valoresUnicos(todas, 'tipoServicio'),
      estados: valoresUnicos(todas, 'estado'),
      fechaMin: min,
      fechaMax: max,
    };
  }, [todas]);

  const filtradas = useMemo(() => aplicarFiltros(todas, filtros), [todas, filtros]);
  const kpis = useMemo(() => calcularKpis(filtradas), [filtradas]);
  const mensual = useMemo(() => serieMensual(filtradas), [filtradas]);
  const porZona = useMemo(() => [...agruparPor(filtradas, 'zona')].sort((a, b) => b.margen - a.margen), [filtradas]);
  const porEstado = useMemo(() => agruparPor(filtradas, 'estado'), [filtradas]);

  if (!datos) {
    return (
      <main className="pagina pagina--inicio">
        <CargaArchivo cargando={cargando} error={error} onArchivo={cargarArchivo} onMuestra={cargarMuestra} />
      </main>
    );
  }

  return (
    <div className="pagina">
      <header className="barra">
        <div className="barra__marca">
          <span className="logo" aria-hidden="true">UAT</span>
          <div>
            <h1>Tablero de operaciones</h1>
            <p className="barra__archivo" title={datos.archivo}>{datos.archivo}</p>
          </div>
        </div>
        <label className="btn btn--fantasma">
          {cargando ? 'Leyendo…' : 'Cargar otro Excel'}
          <input
            type="file"
            accept=".xlsx"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) cargarArchivo(f);
              e.target.value = '';
            }}
          />
        </label>
      </header>

      {error && <p className="alerta alerta--error" role="alert"><strong>No se pudo cargar:</strong> {error}</p>}

      <div className="layout">
        <PanelFiltros filtros={filtros} opciones={opciones} onCambio={setFiltros} />

        <main className="contenido">
          <PanelCalidad incidencias={datos.incidencias} filasLeidas={datos.filasLeidas} validas={todas.length} hoja={datos.hoja} />
          <TarjetasKpi kpis={kpis} total={todas.length} />
          {filtradas.length === 0 ? (
            <p className="alerta">Ninguna operación coincide con los filtros. Prueba a limpiarlos.</p>
          ) : (
            <div className="graficos">
              <GraficoMensual datos={mensual} />
              <GraficoZonas datos={porZona} seleccion={filtros.zonas} onSeleccionar={(z) => setFiltros((f) => ({ ...f, zonas: alternar(f.zonas, z) }))} />
              <GraficoEstados datos={porEstado} />
            </div>
          )}
          <TablaOperaciones operaciones={filtradas} />
        </main>
      </div>

      <footer className="pie">Datos sintéticos de la prueba técnica · procesado 100 % en el navegador</footer>
    </div>
  );
}
