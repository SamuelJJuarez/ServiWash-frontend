import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';

const INITIAL = {
  tipo_maquina: 'LAVADORA',
  capacidad: '12',
  tiempo_ciclo: '40',
  estado: 'DISPONIBLE',
};

export default function MachineFormModal({ open, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');

  const handleClose = () => {
    if (submitting) return;
    setError('');
    setForm(INITIAL);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const capacidad = Number(form.capacidad);
    const tiempoCiclo = Number(form.tiempo_ciclo);

    if (!Number.isFinite(capacidad) || capacidad <= 0 || capacidad > 999.99) {
      setError('La capacidad debe ser un número mayor a 0 y menor o igual a 999.99 kg.');
      return;
    }
    if (!Number.isInteger(tiempoCiclo) || tiempoCiclo <= 0) {
      setError('El tiempo de ciclo debe ser un número entero mayor a 0 minutos.');
      return;
    }

    const ok = await onSubmit({
      tipo_maquina: form.tipo_maquina,
      capacidad,
      tiempo_ciclo: tiempoCiclo,
      estado: form.estado,
    });
    if (ok) {
      setForm(INITIAL);
      setError('');
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nueva máquina">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="rounded-md bg-sky-50 p-3 text-sm text-sky-900">
          La capacidad y el tiempo de ciclo no se pueden editar después de crear la máquina.
        </p>

        {error && (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="tipo_maquina" className="mb-1 block text-sm font-semibold text-slate-700">
            Tipo de máquina
          </label>
          <select
            id="tipo_maquina"
            value={form.tipo_maquina}
            onChange={(e) => setForm((f) => ({ ...f, tipo_maquina: e.target.value }))}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900"
          >
            <option value="LAVADORA">Lavadora</option>
            <option value="SECADORA">Secadora</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="capacidad" className="mb-1 block text-sm font-semibold text-slate-700">
              Capacidad (kg)
            </label>
            <input
              id="capacidad"
              type="number"
              step="0.5"
              min="0.5"
              max="999.99"
              required
              value={form.capacidad}
              onChange={(e) => setForm((f) => ({ ...f, capacidad: e.target.value }))}
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
              placeholder="Ej. 12"
            />
          </div>

          <div>
            <label htmlFor="tiempo_ciclo" className="mb-1 block text-sm font-semibold text-slate-700">
              Tiempo de ciclo (min)
            </label>
            <input
              id="tiempo_ciclo"
              type="number"
              step="1"
              min="1"
              required
              value={form.tiempo_ciclo}
              onChange={(e) => setForm((f) => ({ ...f, tiempo_ciclo: e.target.value }))}
              className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
              placeholder="Ej. 40"
            />
          </div>
        </div>

        <div>
          <label htmlFor="estado" className="mb-1 block text-sm font-semibold text-slate-700">
            Estado inicial
          </label>
          <select
            id="estado"
            value={form.estado}
            onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900"
          >
            <option value="DISPONIBLE">Disponible</option>
            <option value="OCUPADA">Ocupada</option>
            <option value="EN_MANTENIMIENTO">En mantenimiento</option>
          </select>
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
            Registrar máquina
          </button>
        </div>
      </form>
    </Modal>
  );
}
