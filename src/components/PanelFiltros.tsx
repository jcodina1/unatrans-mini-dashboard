import { FILTROS_VACIOS, alternar, contarFiltrosActivos, type Filtros } from '../lib/filtros';

interface Opciones {
  zonas: string[];
  tipos: string[];
  estados: string[];
  fechaMin: string;
  fechaMax: string;
}

interface Props {
  filtros: Filtros;
  opciones: Opciones;
  onCambio: (f: Filtros) => void;
}

interface GrupoChipsProps {
  titulo: string;
  valores: string[];
  seleccion: readonly string[];
  onToggle: (v: string) => void;
}

function GrupoChips({ titulo, valores, seleccion, onToggle }: GrupoChipsProps) {
  return (
    <fieldset className="filtro">
      <legend>
        {titulo}
        <span className="filtro__estado">{seleccion.length === 0 ? 'Todas' : `${seleccion.length} sel.`}</span>
      </legend>
      <div className="chips">
        {valores.map((v) => (
          <button
            key={v}
            type="button"
            className="chip"
            aria-pressed={seleccion.includes(v)}
            onClick={() => onToggle(v)}
          >
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PanelFiltros({ filtros, opciones, onCambio }: Props) {
  const activos = contarFiltrosActivos(filtros);
  const set = (parcial: Partial<Filtros>) => onCambio({ ...filtros, ...parcial });

  return (
    <aside className="filtros" aria-label="Filtros">
      <div className="filtros__cabecera">
        <h2>Filtros</h2>
        <button type="button" className="btn btn--texto" disabled={activos === 0} onClick={() => onCambio(FILTROS_VACIOS)}>
          Limpiar{activos > 0 ? ` (${activos})` : ''}
        </button>
      </div>

      <label className="filtro filtro--busqueda">
        <span>Buscar</span>
        <input
          type="search"
          placeholder="ID, ruta, cliente o vehículo"
          value={filtros.busqueda}
          onChange={(e) => set({ busqueda: e.target.value })}
        />
      </label>

      <GrupoChips titulo="Zona" valores={opciones.zonas} seleccion={filtros.zonas} onToggle={(v) => set({ zonas: alternar(filtros.zonas, v) })} />
      <GrupoChips titulo="Tipo de servicio" valores={opciones.tipos} seleccion={filtros.tipos} onToggle={(v) => set({ tipos: alternar(filtros.tipos, v) })} />
      <GrupoChips titulo="Estado" valores={opciones.estados} seleccion={filtros.estados} onToggle={(v) => set({ estados: alternar(filtros.estados, v) })} />

      <fieldset className="filtro">
        <legend>Rango de fechas</legend>
        <div className="fechas">
          <label>
            <span>Desde</span>
            <input type="date" min={opciones.fechaMin} max={filtros.hasta || opciones.fechaMax} value={filtros.desde} onChange={(e) => set({ desde: e.target.value })} />
          </label>
          <label>
            <span>Hasta</span>
            <input type="date" min={filtros.desde || opciones.fechaMin} max={opciones.fechaMax} value={filtros.hasta} onChange={(e) => set({ hasta: e.target.value })} />
          </label>
        </div>
      </fieldset>
    </aside>
  );
}
