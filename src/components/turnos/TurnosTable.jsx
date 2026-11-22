import { ChevronLeft, ChevronRight, Trash2, UserRound, WashingMachine, Wind } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import { formatFecha } from '../../utils/formatters.js';
import { isTurnOpen } from '../../utils/turnos.js';

/** Tabla paginada de turnos para la vista administrativa (/turnos). */
export default function TurnosTable({
  turnos,
  maquinasMap,
  clientesMap,
  isAdmin,
  page,
  perPage,
  loading,
  onPrevPage,
  onNextPage,
  onDelete,
}) {
  const esUltimaPagina = turnos.length < perPage;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Turno</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Máquina</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Apertura</th>
              <th className="px-4 py-3">Cierre</th>
              {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {turnos.map((t) => {
              const abierto = isTurnOpen(t);
              const maquina = maquinasMap.get(Number(t.machine_id));
              const cliente = clientesMap.get(Number(t.client_id));
              const MachineIcon = maquina?.tipo_maquina === 'SECADORA' ? Wind : WashingMachine;

              return (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums text-slate-900">
                    #{t.id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge tone={abierto ? 'amber' : 'slate'}>
                      {abierto ? 'Abierto' : 'Finalizado'}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                      <MachineIcon className="size-4 text-sky-600" aria-hidden="true" />
                      {maquina
                        ? `${maquina.tipo_maquina === 'LAVADORA' ? 'Lavadora' : 'Secadora'} #${maquina.id}`
                        : `Máquina #${t.machine_id}`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                        <UserRound className="size-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {cliente ? cliente.name : `Cliente #${t.client_id}`}
                        </p>
                        {cliente && (
                          <p className="text-xs tabular-nums text-slate-500">ID #{t.client_id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                    {formatFecha(t.start_hour)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                    {abierto ? (
                      <span className="font-medium text-amber-800">En curso</span>
                    ) : (
                      formatFecha(t.close_hour)
                    )}
                  </td>
                  {isAdmin && (
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(t)}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <span className="tabular-nums">
          Página <strong>{page + 1}</strong> · {turnos.length}{' '}
          {turnos.length === 1 ? 'turno' : 'turnos'} en esta página
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevPage}
            disabled={page === 0 || loading}
            className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Anterior
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={esUltimaPagina || loading}
            className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Siguiente
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
