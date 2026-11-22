import { useEffect, useState } from 'react';
import { Calculator, LoaderCircle, Zap } from 'lucide-react';
import { cotizarKilo, cotizarPrenda, cotizarUso } from '../../api/servicios.api.js';
import Badge from '../ui/Badge.jsx';
import { defaultTimeRange, formatMXN, labelTipoServicio, toIsoSeconds } from '../../utils/formatters.js';

export default function QuickQuotePanel({ servicios, selectedServiceId, onSelectService }) {
  const [kilos, setKilos] = useState('3');
  const [piezas, setPiezas] = useState('1');
  const [rango, setRango] = useState(defaultTimeRange);
  const [express, setExpress] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  const servicio = servicios.find((s) => s.id === Number(selectedServiceId)) ?? servicios[0] ?? null;

  useEffect(() => {
    setResultado(null);
    setError('');
  }, [servicio?.id]);

  const handleCotizar = async (e) => {
    e.preventDefault();
    if (!servicio) return;

    setError('');
    setResultado(null);

    try {
      let data;
      if (servicio.tipo_servicio === 'SERVICIO_POR_KILO') {
        const cant = Number(kilos);
        if (!Number.isFinite(cant) || cant <= 0) {
          setError('Ingresa una cantidad de kilos mayor a 0.');
          return;
        }
        setLoading(true);
        data = await cotizarKilo({
          servicio_id: servicio.id,
          cantidad_kilos: cant,
          express,
        });
      } else if (servicio.tipo_servicio === 'SERVICIO_POR_USO') {
        if (!rango.inicio || !rango.fin) {
          setError('Selecciona fecha y hora de inicio y fin.');
          return;
        }
        if (new Date(rango.fin) <= new Date(rango.inicio)) {
          setError('La hora final debe ser posterior a la hora de inicio.');
          return;
        }
        setLoading(true);
        data = await cotizarUso({
          servicio_id: servicio.id,
          t_inicio: toIsoSeconds(rango.inicio),
          t_final: toIsoSeconds(rango.fin),
          express,
        });
      } else {
        const cant = Number(piezas);
        if (!Number.isInteger(cant) || cant < 1) {
          setError('Ingresa una cantidad entera de al menos 1 prenda.');
          return;
        }
        setLoading(true);
        data = await cotizarPrenda({
          servicio_id: servicio.id,
          cantidad_prendas_especiales: cant,
          express,
        });
      }

      setResultado({ tipo: servicio.tipo_servicio, servicio, data });
    } catch (err) {
      setError(
        err.serviceUnavailable
          ? 'El microservicio de Servicios no está disponible en este momento.'
          : err.message || 'No se pudo calcular la cotización.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-label="Cotizador rápido"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:sticky lg:top-6"
    >
      <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <Calculator className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Cotizador rápido</h2>
          <p className="text-sm text-slate-600">Simula precios oficiales sin registrar cobro.</p>
        </div>
      </div>

      {servicios.length === 0 ? (
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          Registra al menos un servicio en el catálogo para poder cotizar.
        </p>
      ) : (
        <form onSubmit={handleCotizar} className="mt-4 space-y-4">
          <div>
            <label htmlFor="quote_servicio" className="mb-1 block text-sm font-semibold text-slate-700">
              Servicio del catálogo
            </label>
            <select
              id="quote_servicio"
              value={servicio?.id ?? ''}
              onChange={(e) => onSelectService(Number(e.target.value))}
              className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900"
            >
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} · {labelTipoServicio(s.tipo_servicio)} ({formatMXN(s.costo_referencia)})
                </option>
              ))}
            </select>
          </div>

          {servicio?.tipo_servicio === 'SERVICIO_POR_KILO' && (
            <div>
              <label htmlFor="quote_kilos" className="mb-1 block text-sm font-semibold text-slate-700">
                Peso aproximado (kg)
              </label>
              <input
                id="quote_kilos"
                type="number"
                step="0.5"
                min="0.5"
                required
                value={kilos}
                onChange={(e) => {
                  setKilos(e.target.value);
                  setResultado(null);
                }}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
                placeholder="Ej. 5.5"
              />
              <p className="mt-1 text-xs text-slate-500">
                Regla: hasta 2 kg cobra {formatMXN(servicio.costo_referencia)} + $25.00 MXN por kilo extra.
              </p>
            </div>
          )}

          {servicio?.tipo_servicio === 'SERVICIO_POR_USO' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="quote_inicio" className="mb-1 block text-sm font-semibold text-slate-700">
                  Inicio de uso
                </label>
                <input
                  id="quote_inicio"
                  type="datetime-local"
                  required
                  value={rango.inicio}
                  onChange={(e) => {
                    setRango((r) => ({ ...r, inicio: e.target.value }));
                    setResultado(null);
                  }}
                  className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
                />
              </div>
              <div>
                <label htmlFor="quote_fin" className="mb-1 block text-sm font-semibold text-slate-700">
                  Fin de uso
                </label>
                <input
                  id="quote_fin"
                  type="datetime-local"
                  required
                  value={rango.fin}
                  onChange={(e) => {
                    setRango((r) => ({ ...r, fin: e.target.value }));
                    setResultado(null);
                  }}
                  className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
                />
              </div>
              <p className="text-xs text-slate-500">
                Regla: ciclos fijos de 40 min redondeados hacia arriba (mín. 1) × {formatMXN(servicio.costo_referencia)}.
              </p>
            </div>
          )}

          {servicio?.tipo_servicio === 'SERVICIO_POR_PRENDA_ESPECIAL' && (
            <div>
              <label htmlFor="quote_piezas" className="mb-1 block text-sm font-semibold text-slate-700">
                Cantidad de prendas especiales
              </label>
              <input
                id="quote_piezas"
                type="number"
                step="1"
                min="1"
                required
                value={piezas}
                onChange={(e) => {
                  setPiezas(e.target.value);
                  setResultado(null);
                }}
                className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
                placeholder="Ej. 2"
              />
              <p className="mt-1 text-xs text-slate-500">
                Regla: {formatMXN(servicio.costo_referencia)} por pieza.
              </p>
            </div>
          )}

          <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 hover:bg-slate-100">
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={express}
                onChange={(e) => {
                  setExpress(e.target.checked);
                  setResultado(null);
                }}
                className="size-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-semibold text-slate-800">Servicio Express</span>
            </span>
            <Badge tone="indigo">
              <Zap className="mr-1 size-3.5" aria-hidden="true" />
              +$50 MXN
            </Badge>
          </label>

          {error && (
            <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !servicio}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Calculator className="size-4" aria-hidden="true" />
            )}
            Calcular cotización
          </button>

          {resultado && (
            <div
              aria-live="polite"
              className="rounded-xl border border-sky-200 bg-sky-50/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-sky-800">
                  Subtotal oficial
                </span>
                {resultado.data.es_express && <Badge tone="indigo">Express +$50 MXN</Badge>}
              </div>

              <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">
                {formatMXN(resultado.data.subtotal_calculado)}
                <span className="ml-1.5 text-sm font-semibold text-slate-500">MXN</span>
              </p>

              <dl className="mt-3 space-y-1 border-t border-sky-200/80 pt-3 text-sm text-slate-700">
                {resultado.tipo === 'SERVICIO_POR_KILO' && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">Peso cotizado</dt>
                      <dd className="font-semibold tabular-nums">{resultado.data.cantidad_procesada} kg</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">Regla aplicada</dt>
                      <dd className="text-right font-medium">
                        2 kg base ({formatMXN(resultado.servicio.costo_referencia)}) + $25/kg extra
                      </dd>
                    </div>
                  </>
                )}

                {resultado.tipo === 'SERVICIO_POR_USO' && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">Duración total</dt>
                      <dd className="font-semibold tabular-nums">{resultado.data.minutos_totales} min</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">Ciclos (40 min)</dt>
                      <dd className="font-semibold tabular-nums">
                        {resultado.data.numero_ciclos} {resultado.data.numero_ciclos === 1 ? 'ciclo' : 'ciclos'}
                      </dd>
                    </div>
                  </>
                )}

                {resultado.tipo === 'SERVICIO_POR_PRENDA_ESPECIAL' && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">Prendas cotizadas</dt>
                      <dd className="font-semibold tabular-nums">
                        {resultado.data.cantidad_piezas} {resultado.data.cantidad_piezas === 1 ? 'pieza' : 'piezas'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-600">Tarifa unitaria</dt>
                      <dd className="font-semibold tabular-nums">{formatMXN(resultado.servicio.costo_referencia)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
