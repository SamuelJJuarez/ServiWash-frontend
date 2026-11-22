import { WashingMachine, Wind, Wrench } from 'lucide-react';
import { formatFecha, labelEstadoMaquina } from '../../utils/formatters.js';

const STATE_STYLES = {
  DISPONIBLE: {
    card: 'border-emerald-300 bg-white',
    band: 'bg-emerald-600 text-white',
    ring: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    accent: 'text-emerald-700',
  },
  OCUPADA: {
    card: 'border-amber-300 bg-amber-50/40',
    band: 'bg-amber-500 text-slate-950',
    ring: 'border-amber-500 bg-amber-100 text-amber-950',
    accent: 'text-amber-800',
  },
  EN_MANTENIMIENTO: {
    card: 'border-rose-300 bg-rose-50/40',
    band: 'bg-rose-600 text-white',
    ring: 'border-rose-400 bg-rose-100 text-rose-900',
    accent: 'text-rose-700',
  },
};

const FALLBACK_STYLE = {
  card: 'border-slate-300 bg-white',
  band: 'bg-slate-600 text-white',
  ring: 'border-slate-400 bg-slate-100 text-slate-900',
  accent: 'text-slate-700',
};

/**
 * Estación individual del tablero Kiosk (/tablero).
 * Diseñada para lectura a distancia (3–5 m) con tambor numerado y bloque claro de turno activo.
 */
export default function BoardStationCard({ maquina, activeTurn, clientName }) {
  const style = STATE_STYLES[maquina.estado] ?? FALLBACK_STYLE;
  const isLavadora = maquina.tipo_maquina === 'LAVADORA';
  const Icon = maquina.estado === 'EN_MANTENIMIENTO' ? Wrench : isLavadora ? WashingMachine : Wind;
  const tipoTexto = isLavadora ? 'Lavadora' : 'Secadora';

  return (
    <article
      aria-label={`${tipoTexto} ${maquina.id}, ${labelEstadoMaquina(maquina.estado)}`}
      className={`flex flex-col overflow-hidden rounded-2xl border-2 ${style.card}`}
    >
      <div className={`flex items-center justify-between gap-2 px-4 py-2 text-sm font-bold ${style.band}`}>
        <span className="inline-flex items-center gap-1.5">
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {labelEstadoMaquina(maquina.estado)}
        </span>
        <span className="tabular-nums opacity-95">{maquina.capacidad} kg</span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-4">
          {/* Ojo de buey numerado: motivo visual de ServiWash para identificar la estación a distancia. */}
          <div
            className={`grid size-16 shrink-0 place-items-center rounded-full border-4 font-extrabold tabular-nums ${style.ring}`}
          >
            <span className="text-2xl leading-none">#{maquina.id}</span>
          </div>

          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight text-slate-900">
              {tipoTexto} {maquina.id}
            </p>
            <p className="mt-0.5 text-sm text-slate-600 tabular-nums">
              Ciclo {maquina.tiempo_ciclo} min
            </p>
          </div>
        </div>

        {activeTurn ? (
          <div className="mt-auto rounded-xl border border-amber-300 bg-amber-100/80 px-3.5 py-2.5 text-slate-900">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-base font-extrabold tabular-nums text-amber-950">
                {activeTurn.id ? `Turno #${activeTurn.id}` : 'Turno activo'}
              </span>
              {activeTurn.start_hour && (
                <span className="text-xs font-medium tabular-nums text-amber-900">
                  {formatFecha(activeTurn.start_hour)}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-base font-semibold text-slate-900">
              {clientName || (activeTurn.client_id ? `Cliente #${activeTurn.client_id}` : 'En uso')}
            </p>
          </div>
        ) : (
          <div className="mt-auto border-t border-slate-200/80 pt-2.5 text-sm font-medium">
            {maquina.estado === 'DISPONIBLE' && (
              <span className={style.accent}>Lista para usarse</span>
            )}
            {maquina.estado === 'OCUPADA' && (
              <span className={style.accent}>En uso (sin turno registrado)</span>
            )}
            {maquina.estado === 'EN_MANTENIMIENTO' && (
              <span className={style.accent}>Fuera de servicio temporal</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
