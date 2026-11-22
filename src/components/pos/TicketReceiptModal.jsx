import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { formatFecha, formatMXN } from '../../utils/formatters.js';

function Fila({ label, valor, fuerte = false }) {
  return (
    <div className={`flex justify-between gap-3 ${fuerte ? 'text-base font-bold' : ''}`}>
      <span>{label}</span>
      <span className="tabular-nums">{valor}</span>
    </div>
  );
}

const Separador = () => <hr className="my-2 border-t border-dashed border-slate-400" />;

/** Contenido del comprobante (pantalla e impresión térmica 80 mm). Tolera entradas incompletas del historial. */
function ReceiptBody({ ticket }) {
  const detalles = Array.isArray(ticket.detalles) ? ticket.detalles : [];
  return (
    <div className="font-mono text-[13px] leading-snug text-black">
      <div className="text-center">
        <p className="text-lg font-bold">ServiWash</p>
        <p>Lavandería y autolavado</p>
      </div>
      <Separador />
      <Fila label="Folio" valor={`#${ticket.id ?? '—'}`} fuerte />
      <Fila label="Fecha" valor={formatFecha(ticket.guardado_en)} />
      <Fila label="Cliente" valor={`${ticket.cliente_nombre ?? 'Cliente'} #${ticket.clientes_id ?? '—'}`} />
      <Fila label="Atendió" valor={ticket.cajero_nombre ?? `Usuario ${ticket.usuarios_id ?? '—'}`} />
      <Separador />
      {detalles.map((d, i) => (
        <div key={i} className="py-0.5">
          <p className="font-semibold">{d.servicio_label ?? `Servicio #${d.servicios_id}`}</p>
          <div className="flex justify-between gap-3">
            <span>
              {d.detalle ?? `Cantidad: ${Number(d.cantidad) || 0}`}
              {d.express ? ' + Express' : ''}
            </span>
            <span className="tabular-nums">{formatMXN(d.subtotal)}</span>
          </div>
        </div>
      ))}
      <Separador />
      <Fila label="TOTAL" valor={formatMXN(ticket.cobro_total)} fuerte />
      <Fila label="Efectivo" valor={formatMXN(ticket.monto_recibido)} />
      <Fila label="Cambio" valor={formatMXN(ticket.cambio_entregado)} />
      <Separador />
      <div className="text-center">
        <p>Gracias por su preferencia</p>
        <p className="text-[11px]">Comprobante sin validez fiscal</p>
      </div>
    </div>
  );
}

/**
 * Comprobante del ticket con impresión limpia: el recibo se duplica en un portal (#ticket-print)
 * que es lo único visible en @media print (ver index.css).
 */
export default function TicketReceiptModal({ ticket, onClose, closeLabel = 'Cerrar' }) {
  if (!ticket) return null;

  return (
    <>
      <Modal open onClose={onClose} title={`Ticket #${ticket.id}`} maxWidth="max-w-md">
        <div className="mx-auto max-h-[60vh] max-w-[340px] overflow-y-auto rounded-md border border-dashed border-slate-300 bg-white p-4 shadow-inner">
          <ReceiptBody ticket={ticket} />
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            autoFocus
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sky-600 px-5 font-semibold text-white hover:bg-sky-700"
          >
            <Printer className="size-4" aria-hidden="true" />
            Imprimir comprobante
          </button>
        </div>
      </Modal>
      {createPortal(
        <div id="ticket-print" className="hidden print:block">
          <ReceiptBody ticket={ticket} />
        </div>,
        document.body,
      )}
    </>
  );
}
