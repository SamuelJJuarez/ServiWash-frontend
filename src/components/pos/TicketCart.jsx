import { Trash2, Zap } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { formatMXN } from '../../utils/formatters.js';

export default function TicketCart({ lineas, onRemove, disabled = false }) {
  const expressCount = lineas.filter((l) => l.express).length;

  return (
    <section aria-labelledby="pos-carrito" className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="pos-carrito" className="text-lg font-bold text-slate-900">
          Servicios del ticket
        </h2>
        <span className="text-sm font-semibold text-slate-500 tabular-nums">
          {lineas.length} {lineas.length === 1 ? 'servicio' : 'servicios'}
        </span>
      </div>

      {lineas.length === 0 ? (
        <div className="mt-4">
          <EmptyState>Cotiza un servicio para agregarlo al ticket.</EmptyState>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {lineas.map((l) => (
            <li key={l.key} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {l.servicio_label}{' '}
                  <span className="font-medium text-slate-500 tabular-nums">#{l.servicios_id}</span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <span className="tabular-nums">{l.detalle}</span>
                  {l.express && (
                    <Badge tone="indigo">
                      <Zap className="mr-1 size-3.5" aria-hidden="true" />
                      Express
                    </Badge>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-bold text-slate-900 tabular-nums">{formatMXN(l.subtotal)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(l.key)}
                  disabled={disabled}
                  aria-label={`Quitar ${l.servicio_label} (${l.detalle})`}
                  className="inline-flex size-10 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
                >
                  <Trash2 className="size-4.5" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {expressCount > 0 && (
        <p className="mt-2 rounded-md bg-indigo-50 px-3 py-2 text-sm text-indigo-900">
          Incluye {expressCount} {expressCount === 1 ? 'cargo Express' : 'cargos Express'} de $50 (
          {formatMXN(expressCount * 50)}).
        </p>
      )}
    </section>
  );
}
