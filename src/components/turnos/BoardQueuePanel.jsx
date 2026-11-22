import { Clock, ListChecks, Users } from 'lucide-react';
import { formatFecha } from '../../utils/formatters.js';
import { isTurnOpen } from '../../utils/turnos.js';

function labelMachine(machineId, machinesMap) {
  const m = machinesMap.get(Number(machineId));
  if (!m) return `Máquina #${machineId}`;
  return `${m.tipo_maquina === 'LAVADORA' ? 'Lavadora' : 'Secadora'} #${m.id}`;
}

function labelClient(clientId, clientsMap) {
  if (clientId === null || clientId === undefined) return 'Cliente sin identificar';
  const c = clientsMap.get(Number(clientId));
  return c?.name || `Cliente #${clientId}`;
}

function FeedBadge({ kind }) {
  if (kind === 'asign') {
    return (
      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
        Asignado
      </span>
    );
  }
  if (kind === 'release') {
    return (
      <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
        Liberada
      </span>
    );
  }
  return (
    <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-bold text-sky-900">
      En espera
    </span>
  );
}

/**
 * Columna lateral del tablero Kiosk: cola de espera en vivo (WS) + últimas asignaciones (WS + REST).
 */
export default function BoardQueuePanel({
  queue,
  feed,
  recentTurns,
  machinesMap,
  clientsMap,
  turnosUnavailable,
}) {
  return (
    <aside aria-label="Cola de espera y últimas asignaciones" className="flex flex-col gap-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Users className="size-5 text-sky-600" aria-hidden="true" />
            Cola de espera
          </h2>
          <span className="rounded-full bg-sky-100 px-3 py-0.5 text-sm font-bold tabular-nums text-sky-900">
            {queue.length}
          </span>
        </div>

        {queue.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
            Sin clientes esperando en este momento.
          </p>
        ) : (
          <ol className="mt-4 space-y-2.5">
            {queue.map((item, idx) => (
              <li
                key={`${item.turn ?? idx}-${item.client_id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">
                    {labelClient(item.client_id, clientsMap)}
                  </p>
                  <p className="text-xs text-slate-600 tabular-nums">
                    Cliente #{item.client_id}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-sky-600 px-3 py-1 text-base font-extrabold tabular-nums text-white">
                  {item.turn !== null ? `Turno ${item.turn}` : `#${idx + 1}`}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ListChecks className="size-5 text-sky-600" aria-hidden="true" />
            Últimas asignaciones
          </h2>
          {feed.length > 0 && (
            <span className="text-xs font-semibold text-emerald-700">Eventos en vivo</span>
          )}
        </div>

        {feed.length > 0 && (
          <ul className="mt-3 space-y-2 border-b border-slate-200 pb-4">
            {feed.slice(0, 5).map((ev) => (
              <li
                key={ev.key}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FeedBadge kind={ev.kind} />
                    <span className="truncate font-semibold text-slate-900">
                      {ev.kind === 'release'
                        ? labelMachine(ev.machine_id, machinesMap)
                        : ev.kind === 'asign'
                          ? `${labelMachine(ev.machine_id, machinesMap)} — ${labelClient(ev.client_id, clientsMap)}`
                          : `${labelClient(ev.client_id, clientsMap)}${ev.turn ? ` (Turno ${ev.turn})` : ''}`}
                    </span>
                  </div>
                </div>
                <span className="text-xs tabular-nums text-slate-500">
                  {formatFecha(ev.at)}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {turnosUnavailable ? (
            <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              Historial de turnos temporalmente no disponible.
            </p>
          ) : recentTurns.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
              Aún no hay turnos registrados.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentTurns.map((t) => {
                const abierto = isTurnOpen(t);
                return (
                  <li key={t.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold tabular-nums text-slate-900">Turno #{t.id}</span>
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            abierto
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {abierto ? 'En curso' : 'Finalizado'}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-slate-800">
                        {labelMachine(t.machine_id, machinesMap)} · {labelClient(t.client_id, clientsMap)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs tabular-nums text-slate-500">
                        <Clock className="size-3.5 shrink-0" aria-hidden="true" />
                        {formatFecha(t.start_hour)}
                        {t.close_hour ? ` → ${formatFecha(t.close_hour)}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </aside>
  );
}
