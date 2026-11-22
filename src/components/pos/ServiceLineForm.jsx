import { useState } from 'react';
import { LoaderCircle, Plus, Zap } from 'lucide-react';
import { cotizarKilo, cotizarPrenda, cotizarUso } from '../../api/servicios.api.js';
import Badge from '../ui/Badge.jsx';
import { defaultTimeRange, formatMXN, labelTipoServicio, toIsoSeconds } from '../../utils/formatters.js';
import { toTicketMetrica } from '../../utils/mappers.js';

let seq = 0;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Cotiza contra /servicios/cotizar/* y entrega una línea lista para el carrito:
 * { key, servicios_id, metrica_cobro, datos, servicio_label, detalle, express, subtotal }
 */
export default function ServiceLineForm({ servicios, onAdd, disabled = false }) {
  const [servicioId, setServicioId] = useState(servicios[0]?.id ?? '');
  const [kilos, setKilos] = useState('');
  const [piezas, setPiezas] = useState('1');
  const [rango, setRango] = useState(() => defaultTimeRange(40));
  const [express, setExpress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const servicio = servicios.find((s) => s.id === Number(servicioId)) ?? servicios[0] ?? null;
  const tipo = servicio?.tipo_servicio;

  const limpiar = () => {
    setKilos('');
    setPiezas('1');
    setRango(defaultTimeRange(40));
    setExpress(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!servicio) return;
    setError('');

    let metrica;
    try {
      metrica = toTicketMetrica(tipo);
    } catch {
      setError('Este servicio tiene un tipo desconocido; revísalo en el catálogo.');
      return;
    }

    let datos;
    if (metrica === 'KILO') {
      const cant = Number(kilos);
      if (!Number.isFinite(cant) || cant <= 0) {
        setError('Ingresa un peso mayor a 0 kg.');
        return;
      }
      datos = { cantidad_kilos: cant, express };
    } else if (metrica === 'USO') {
      if (!rango.inicio || !rango.fin) {
        setError('Selecciona fecha y hora de inicio y fin.');
        return;
      }
      if (new Date(rango.fin) <= new Date(rango.inicio)) {
        setError('La hora final debe ser posterior a la de inicio.');
        return;
      }
      datos = { t_inicio: toIsoSeconds(rango.inicio), t_final: toIsoSeconds(rango.fin), express };
    } else {
      const cant = Number(piezas);
      if (!Number.isInteger(cant) || cant < 1) {
        setError('Ingresa una cantidad entera de al menos 1 prenda.');
        return;
      }
      datos = { cantidad_prendas_especiales: cant, express };
    }

    setLoading(true);
    try {
      let detalle;
      let data;
      if (metrica === 'KILO') {
        data = await cotizarKilo({ servicio_id: servicio.id, ...datos });
        detalle = `${datos.cantidad_kilos} kg`;
      } else if (metrica === 'USO') {
        data = await cotizarUso({ servicio_id: servicio.id, ...datos });
        detalle = `${plural(Number(data.numero_ciclos), 'ciclo', 'ciclos')} (${data.minutos_totales} min)`;
      } else {
        data = await cotizarPrenda({ servicio_id: servicio.id, ...datos });
        detalle = plural(datos.cantidad_prendas_especiales, 'pieza', 'piezas');
      }

      const subtotal = Number(data?.subtotal_calculado);
      if (!Number.isFinite(subtotal)) throw new Error('La cotización no devolvió un subtotal válido.');

      onAdd({
        key: ++seq,
        servicios_id: servicio.id,
        metrica_cobro: metrica,
        datos,
        servicio_label: labelTipoServicio(tipo),
        detalle,
        express,
        subtotal,
      });
      limpiar();
    } catch (err) {
      setError(
        err.serviceUnavailable
          ? 'El servicio de Servicios está desconectado (503). No se puede cotizar.'
          : err.status === 404
            ? 'Este servicio ya no existe en el catálogo. Recarga la página.'
            : err.message || 'No se pudo cotizar el servicio.',
      );
    } finally {
      setLoading(false);
    }
  };

  const bloqueado = disabled || loading;

  return (
    <section aria-labelledby="pos-servicio" className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 id="pos-servicio" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
        <span className="flex size-7 items-center justify-center rounded-full bg-sky-600 text-sm text-white">2</span>
        Agregar servicio
      </h2>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="pos_servicio" className="mb-1 block text-sm font-semibold text-slate-700">
            Servicio del catálogo
          </label>
          <select
            id="pos_servicio"
            value={servicio?.id ?? ''}
            onChange={(e) => {
              setServicioId(Number(e.target.value));
              setError('');
            }}
            disabled={bloqueado}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900"
          >
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} {labelTipoServicio(s.tipo_servicio)} ({formatMXN(s.costo_referencia)})
              </option>
            ))}
          </select>
        </div>

        {tipo === 'SERVICIO_POR_KILO' && (
          <div>
            <label htmlFor="pos_kilos" className="mb-1 block text-sm font-semibold text-slate-700">
              Peso (kg)
            </label>
            <input
              id="pos_kilos"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0.5"
              required
              value={kilos}
              onChange={(e) => setKilos(e.target.value)}
              disabled={bloqueado}
              placeholder="Ej. 5.5"
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-lg tabular-nums text-slate-900"
            />
            <p className="mt-1 text-xs text-slate-500">
              Hasta 2 kg: {formatMXN(servicio.costo_referencia)}. Cada kilo extra: $25.00.
            </p>
          </div>
        )}

        {tipo === 'SERVICIO_POR_USO' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pos_inicio" className="mb-1 block text-sm font-semibold text-slate-700">
                Inicio de uso
              </label>
              <input
                id="pos_inicio"
                type="datetime-local"
                required
                value={rango.inicio}
                onChange={(e) => setRango((r) => ({ ...r, inicio: e.target.value }))}
                disabled={bloqueado}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
              />
            </div>
            <div>
              <label htmlFor="pos_fin" className="mb-1 block text-sm font-semibold text-slate-700">
                Fin de uso
              </label>
              <input
                id="pos_fin"
                type="datetime-local"
                required
                value={rango.fin}
                onChange={(e) => setRango((r) => ({ ...r, fin: e.target.value }))}
                disabled={bloqueado}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
              />
            </div>
            <p className="text-xs text-slate-500 sm:col-span-2">
              Ciclos de 40 min redondeados hacia arriba (mínimo 1), {formatMXN(servicio.costo_referencia)} por ciclo.
            </p>
          </div>
        )}

        {tipo === 'SERVICIO_POR_PRENDA_ESPECIAL' && (
          <div>
            <label htmlFor="pos_piezas" className="mb-1 block text-sm font-semibold text-slate-700">
              Prendas especiales
            </label>
            <input
              id="pos_piezas"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              required
              value={piezas}
              onChange={(e) => setPiezas(e.target.value)}
              disabled={bloqueado}
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-lg tabular-nums text-slate-900"
            />
            <p className="mt-1 text-xs text-slate-500">{formatMXN(servicio.costo_referencia)} por pieza.</p>
          </div>
        )}

        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 hover:bg-slate-100">
          <span className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={express}
              onChange={(e) => setExpress(e.target.checked)}
              disabled={bloqueado}
              className="size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Express para este servicio</span>
              <span className="block text-xs text-slate-500">Se cobran $50 por cada servicio marcado.</span>
            </span>
          </span>
          <Badge tone="indigo">
            <Zap className="mr-1 size-3.5" aria-hidden="true" />
            +$50
          </Badge>
        </label>

        {error && (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={bloqueado || !servicio}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          ) : (
            <Plus className="size-5" aria-hidden="true" />
          )}
          {loading ? 'Cotizando…' : 'Cotizar y agregar al ticket'}
        </button>
      </form>
    </section>
  );
}
