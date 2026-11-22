import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Printer, Receipt, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import TicketReceiptModal from '../components/pos/TicketReceiptModal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalTickets } from '../hooks/useLocalTickets.js';
import { formatFecha, formatMXN, localDateKey } from '../utils/formatters.js';

export default function TicketsHistoryPage() {
  const { user } = useAuth();
  const { tickets, vaciar } = useLocalTickets();
  const [folio, setFolio] = useState('');
  const [fecha, setFecha] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [confirmarVaciar, setConfirmarVaciar] = useState(false);

  const esAdmin = user?.rol === 'ADMIN';

  const filtrados = useMemo(() => {
    const f = folio.trim().replace(/^#/, '');
    return tickets.filter(
      (t) =>
        t &&
        (!f || String(t.id ?? '').includes(f)) &&
        (!fecha || localDateKey(t.guardado_en) === fecha),
    );
  }, [tickets, folio, fecha]);

  const totalFiltrado = filtrados.reduce((s, t) => s + (Number(t.cobro_total) || 0), 0);
  const hayFiltros = Boolean(folio.trim() || fecha);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Historial de tickets</h1>
          <p className="text-sm text-slate-600">Consulta y reimprime los tickets cobrados en este equipo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {esAdmin && tickets.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmarVaciar(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-rose-300 bg-white px-4 font-medium text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Vaciar historial
            </button>
          )}
          <Link
            to="/tickets/nuevo"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700"
          >
            <Receipt className="size-4" aria-hidden="true" />
            Nuevo ticket
          </Link>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Este historial se guarda solo en este navegador (últimos 200 tickets). El servidor todavía no permite
        consultar tickets emitidos, así que otros equipos no verán estos registros.
      </p>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="min-w-48 flex-1">
          <label htmlFor="hist_folio" className="mb-1 block text-sm font-semibold text-slate-700">
            Folio
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="hist_folio"
              type="search"
              inputMode="numeric"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ej. 42"
              className="min-h-11 w-full rounded-md border border-slate-300 pr-3 pl-9 tabular-nums text-slate-900"
            />
          </div>
        </div>
        <div>
          <label htmlFor="hist_fecha" className="mb-1 block text-sm font-semibold text-slate-700">
            Fecha
          </label>
          <input
            id="hist_fecha"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="min-h-11 rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
          />
        </div>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setFolio('');
              setFecha('');
            }}
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50"
          >
            Quitar filtros
          </button>
        )}
        <p className="ml-auto text-sm text-slate-600">
          <span className="font-semibold text-slate-900 tabular-nums">{filtrados.length}</span>{' '}
          {filtrados.length === 1 ? 'ticket' : 'tickets'} por{' '}
          <span className="font-semibold text-slate-900 tabular-nums">{formatMXN(totalFiltrado)}</span>
        </p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState>
          Aún no se han cobrado tickets en este equipo.{' '}
          <Link to="/tickets/nuevo" className="font-semibold text-sky-700 underline">
            Generar el primero
          </Link>
        </EmptyState>
      ) : filtrados.length === 0 ? (
        <EmptyState>Ningún ticket coincide con los filtros.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50 text-sm text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Folio</th>
                <th scope="col" className="px-4 py-3 font-semibold">Fecha y hora</th>
                <th scope="col" className="px-4 py-3 font-semibold">Cliente</th>
                <th scope="col" className="px-4 py-3 font-semibold">Atendió</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Servicios</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtrados.map((t, i) => (
                <tr key={`${t.id}-${t.guardado_en ?? i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold tabular-nums">#{t.id ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{formatFecha(t.guardado_en)}</td>
                  <td className="px-4 py-3">
                    {t.cliente_nombre ?? 'Cliente'}{' '}
                    <span className="text-sm text-slate-500 tabular-nums">#{t.clientes_id ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{t.cajero_nombre ?? `Usuario ${t.usuarios_id ?? '—'}`}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{Array.isArray(t.detalles) ? t.detalles.length : 0}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMXN(t.cobro_total)}</td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setSeleccionado(t)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Printer className="size-4" aria-hidden="true" />
                      Ver y reimprimir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TicketReceiptModal ticket={seleccionado} onClose={() => setSeleccionado(null)} />

      <ConfirmDialog
        open={confirmarVaciar}
        title="Vaciar historial local"
        message={`Se borrarán los ${tickets.length} tickets guardados en este navegador. Los tickets siguen registrados en el servidor, pero ya no podrás reimprimirlos desde aquí.`}
        confirmLabel="Vaciar historial"
        onCancel={() => setConfirmarVaciar(false)}
        onConfirm={() => {
          vaciar();
          setConfirmarVaciar(false);
          toast.success('Historial local vaciado.');
        }}
      />
    </div>
  );
}
