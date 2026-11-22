import { ArrowLeftRight, Clock, Trash2, WashingMachine, Weight, Wind } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { labelEstadoMaquina } from '../../utils/formatters.js';

const ESTADO_TONE = {
  DISPONIBLE: 'emerald',
  OCUPADA: 'amber',
  EN_MANTENIMIENTO: 'rose',
};

const ESTADOS = [
  { value: 'DISPONIBLE', label: 'Disponible', active: 'bg-emerald-600 text-white border-emerald-600' },
  { value: 'OCUPADA', label: 'Ocupada', active: 'bg-amber-600 text-white border-amber-600' },
  { value: 'EN_MANTENIMIENTO', label: 'Mantenimiento', active: 'bg-rose-600 text-white border-rose-600' },
];

export default function MachineCard({
  maquina,
  isAdmin,
  busy,
  onChangeEstado,
  onChangeTipo,
  onDelete,
}) {
  const esLavadora = maquina.tipo_maquina === 'LAVADORA';
  const Icono = esLavadora ? WashingMachine : Wind;
  const otroTipo = esLavadora ? 'SECADORA' : 'LAVADORA';
  const otroTipoLabel = esLavadora ? 'Secadora' : 'Lavadora';

  return (
    <article className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Icono className="size-6" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 tabular-nums">
                {esLavadora ? 'Lavadora' : 'Secadora'} #{maquina.id}
              </h3>
              <div className="mt-1">
                <Badge tone={ESTADO_TONE[maquina.estado] ?? 'slate'}>
                  {labelEstadoMaquina(maquina.estado)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Weight className="size-4 text-slate-500" aria-hidden="true" />
            <div>
              <dt className="text-xs text-slate-500">Capacidad</dt>
              <dd className="font-semibold tabular-nums">{maquina.capacidad} kg</dd>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Clock className="size-4 text-slate-500" aria-hidden="true" />
            <div>
              <dt className="text-xs text-slate-500">Ciclo</dt>
              <dd className="font-semibold tabular-nums">{maquina.tiempo_ciclo} min</dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cambiar estado
          </p>
          <div className="grid grid-cols-3 gap-1.5" role="group" aria-label={`Estado de máquina ${maquina.id}`}>
            {ESTADOS.map((e) => {
              const isCurrent = maquina.estado === e.value;
              return (
                <button
                  key={e.value}
                  type="button"
                  disabled={busy || isCurrent}
                  onClick={() => onChangeEstado(maquina, e.value)}
                  className={`min-h-10 rounded-md border px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed ${
                    isCurrent
                      ? e.active
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-60'
                  }`}
                >
                  {e.label}
                </button>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => onChangeTipo(maquina, otroTipo)}
              className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <ArrowLeftRight className="size-4" aria-hidden="true" />
              Cambiar a {otroTipoLabel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDelete(maquina)}
              aria-label={`Eliminar máquina ${maquina.id}`}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
