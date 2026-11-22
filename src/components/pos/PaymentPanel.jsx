import { Banknote, LoaderCircle, Receipt, TriangleAlert } from 'lucide-react';
import { formatMXN } from '../../utils/formatters.js';

const BILLETES = [100, 200, 500];

/**
 * Cobro en efectivo (MXN). `alerta`: { tipo: 'error' | 'incierto', mensaje }.
 * 'incierto' = fallo de red/5xx: el ticket pudo registrarse y no hay GET para comprobarlo.
 */
export default function PaymentPanel({ total, monto, onMontoChange, onSubmit, submitting, motivo, alerta }) {
  const recibido = Number(monto);
  const montoValido = monto !== '' && Number.isFinite(recibido) && recibido >= 0;
  const insuficiente = montoValido && recibido < total;
  const cambio = montoValido && !insuficiente ? recibido - total : null;

  const bloqueo =
    motivo ??
    (!montoValido ? 'Captura el efectivo recibido.' : insuficiente ? 'El efectivo recibido no cubre el total.' : null);

  return (
    <section aria-labelledby="pos-cobro" className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="bg-slate-900 px-5 py-4 text-white">
        <h2 id="pos-cobro" className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <span className="flex size-6 items-center justify-center rounded-full bg-sky-500 text-xs text-white">3</span>
          Total a cobrar
        </h2>
        <p className="mt-1 text-4xl font-bold tabular-nums" aria-live="polite">
          {formatMXN(total)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
          <Banknote className="size-4" aria-hidden="true" />
          Pago en efectivo, pesos mexicanos
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <label htmlFor="pos_monto" className="mb-1 block text-sm font-semibold text-slate-700">
            Efectivo recibido
          </label>
          <input
            id="pos_monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => onMontoChange(e.target.value)}
            disabled={submitting}
            placeholder="0.00"
            className="min-h-12 w-full rounded-md border border-slate-300 px-3 text-2xl font-semibold tabular-nums text-slate-900"
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onMontoChange(total.toFixed(2))}
              disabled={submitting || total <= 0}
              className="min-h-11 rounded-md border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Exacto
            </button>
            {BILLETES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onMontoChange(String(b))}
                disabled={submitting || b < total}
                className="min-h-11 rounded-md border border-slate-300 bg-white text-sm font-semibold tabular-nums text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                ${b}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-3">
          <span className="font-semibold text-emerald-900">Cambio</span>
          <span className="text-3xl font-bold tabular-nums text-emerald-800" aria-live="polite">
            {cambio === null ? '—' : formatMXN(cambio)}
          </span>
        </div>

        {alerta && (
          <div
            role="alert"
            className={`rounded-md border p-3 text-sm ${
              alerta.tipo === 'incierto'
                ? 'border-amber-400 bg-amber-50 text-amber-900'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {alerta.tipo === 'incierto' ? (
              <>
                <p className="flex items-center gap-2 font-bold">
                  <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
                  El ticket pudo no haberse registrado
                </p>
                <p className="mt-1">
                  Confirma con el administrador antes de reintentar para no cobrar dos veces.
                  {alerta.mensaje && <span className="block text-amber-800">Detalle: {alerta.mensaje}</span>}
                </p>
              </>
            ) : (
              alerta.mensaje
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || Boolean(bloqueo)}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-lg font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-600"
        >
          {submitting ? (
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Receipt className="size-5" aria-hidden="true" />
          )}
          {submitting ? 'Generando ticket…' : 'Generar ticket y cobrar'}
        </button>
        {bloqueo && !submitting && <p className="text-center text-sm text-slate-500">{bloqueo}</p>}
      </div>
    </section>
  );
}
