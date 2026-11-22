import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Badge from '../ui/Badge.jsx';
import { labelMetricaCobro, labelTipoServicio } from '../../utils/formatters.js';
import { metricaDeTipo } from '../../utils/mappers.js';

const TIPOS_SERVICIO = [
  'SERVICIO_POR_KILO',
  'SERVICIO_POR_USO',
  'SERVICIO_POR_PRENDA_ESPECIAL',
];

const REGLA_TIPO = {
  SERVICIO_POR_KILO: 'Hasta 2 kg cobra el precio de referencia; cada kilo adicional suma $25.00 MXN.',
  SERVICIO_POR_USO: 'Se cobran ciclos fijos de 40 minutos redondeados hacia arriba (mínimo 1 ciclo).',
  SERVICIO_POR_PRENDA_ESPECIAL: 'Se multiplica el precio de referencia por la cantidad de prendas.',
};

const INITIAL = {
  tipo_servicio: 'SERVICIO_POR_KILO',
  costo_referencia: '',
};

export default function ServiceFormModal({
  open,
  servicio = null,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const isEdit = Boolean(servicio);
  const [tipoServicio, setTipoServicio] = useState(INITIAL.tipo_servicio);
  const [costoReferencia, setCostoReferencia] = useState(INITIAL.costo_referencia);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (servicio) {
      setTipoServicio(servicio.tipo_servicio || INITIAL.tipo_servicio);
      setCostoReferencia(
        servicio.costo_referencia !== undefined && servicio.costo_referencia !== null
          ? String(servicio.costo_referencia)
          : '',
      );
    } else {
      setTipoServicio(INITIAL.tipo_servicio);
      setCostoReferencia('');
    }
  }, [open, servicio]);

  const metricaCobro = metricaDeTipo(tipoServicio);

  const handleClose = () => {
    if (submitting) return;
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (costoReferencia === '' || costoReferencia === null) {
      setError('Ingresa un costo de referencia.');
      return;
    }

    const costo = Number(costoReferencia);
    if (!Number.isFinite(costo) || costo < 0) {
      setError('El costo de referencia debe ser un número mayor o igual a 0.');
      return;
    }

    await onSubmit({
      tipo_servicio: tipoServicio,
      metrica_cobro: metricaCobro,
      costo_referencia: costo,
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? `Editar servicio #${servicio.id}` : 'Nuevo servicio'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="tipo_servicio" className="mb-1 block text-sm font-semibold text-slate-700">
            Tipo de servicio
          </label>
          <select
            id="tipo_servicio"
            value={tipoServicio}
            onChange={(e) => setTipoServicio(e.target.value)}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900"
          >
            {TIPOS_SERVICIO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {labelTipoServicio(tipo)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-700">Métrica de cobro sincronizada</span>
            <Badge tone="sky">{labelMetricaCobro(metricaCobro)}</Badge>
          </div>
          <p className="mt-1.5 text-slate-600">{REGLA_TIPO[tipoServicio]}</p>
        </div>

        <div>
          <label htmlFor="costo_referencia" className="mb-1 block text-sm font-semibold text-slate-700">
            Costo de referencia (MXN)
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              $
            </span>
            <input
              id="costo_referencia"
              type="number"
              step="0.5"
              min="0"
              required
              value={costoReferencia}
              onChange={(e) => setCostoReferencia(e.target.value)}
              className="min-h-11 w-full rounded-md border border-slate-300 pl-7 pr-14 tabular-nums text-slate-900"
              placeholder="Ej. 35.00"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">
              MXN
            </span>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-sky-600 px-5 font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {submitting && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {isEdit ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
