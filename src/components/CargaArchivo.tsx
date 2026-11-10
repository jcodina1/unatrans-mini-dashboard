import { useRef, useState, type DragEvent } from 'react';

interface Props {
  cargando: boolean;
  error: string | null;
  onArchivo: (archivo: File) => void;
  onMuestra: () => void;
}

export function CargaArchivo({ cargando, error, onArchivo, onMuestra }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const soltar = (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    setArrastrando(false);
    const archivo = e.dataTransfer.files[0];
    if (archivo) onArchivo(archivo);
  };

  return (
    <section className="carga" aria-labelledby="carga-titulo">
      <div className="carga__intro">
        <p className="eyebrow">Unión Andina de Transportes · Operaciones</p>
        <h1 id="carga-titulo">
          Tablero de operaciones<span className="punto">.</span>
        </h1>
        <p className="carga__lead">
          Sube el Excel de operaciones y obtén al instante ingresos, costos, margen y cumplimiento de SLA, con
          filtros por zona, tipo de servicio, estado y fecha. Todo se procesa en tu navegador: el archivo no sale de
          tu equipo.
        </p>
      </div>

      <div
        className={`zona-drop${arrastrando ? ' zona-drop--activa' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
      >
        <div className="zona-drop__icono" aria-hidden="true">
          <svg viewBox="0 0 48 48" width="48" height="48">
            <rect x="8" y="6" width="26" height="36" rx="3" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M14 16h14M14 22h14M14 28h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="36" cy="34" r="9" fill="var(--acento)" />
            <path d="M36 29v10M31 34l5-5 5 5" stroke="var(--tinta)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
        <p className="zona-drop__titulo">{cargando ? 'Leyendo archivo…' : 'Arrastra aquí tu archivo .xlsx'}</p>
        <p className="zona-drop__sub">Se usa la hoja «Datos» (o la primera si no existe)</p>
        <div className="zona-drop__acciones">
          <button type="button" className="btn btn--primario" disabled={cargando} onClick={() => input.current?.click()}>
            Seleccionar archivo
          </button>
          <button type="button" className="btn btn--fantasma" disabled={cargando} onClick={onMuestra}>
            Usar Excel de la prueba
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          hidden
          onChange={(e) => {
            const archivo = e.target.files?.[0];
            if (archivo) onArchivo(archivo);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <p className="alerta alerta--error" role="alert">
          <strong>No se pudo cargar:</strong> {error}
        </p>
      )}
    </section>
  );
}
