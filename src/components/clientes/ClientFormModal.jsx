import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import Modal from '../ui/Modal.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_RE = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/;

export default function ClientFormModal({
  open,
  cliente = null,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const isEdit = Boolean(cliente);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (cliente) {
      setName(cliente.name ?? '');
      setEmail(cliente.email ?? '');
    } else {
      setName('');
      setEmail('');
    }
  }, [open, cliente]);

  const handleClose = () => {
    if (submitting) return;
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }

    if (cleanName.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres.');
      return;
    }

    if (!NAME_RE.test(cleanName)) {
      setError('El nombre solo puede contener letras y acentos.');
      return;
    }

    if (cleanName.length > 100) {
      setError('El nombre no puede exceder 100 caracteres.');
      return;
    }

    if (cleanEmail) {
      if (cleanEmail.length > 100) {
        setError('El correo electrónico no puede exceder 100 caracteres.');
        return;
      }
      if (!EMAIL_RE.test(cleanEmail)) {
        setError('Ingresa un correo electrónico con formato válido.');
        return;
      }
    }

    await onSubmit({
      name: cleanName,
      email: cleanEmail || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? `Editar cliente #${cliente.id}` : 'Nuevo cliente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="client_name" className="mb-1 block text-sm font-semibold text-slate-700">
            Nombre completo
          </label>
          <input
            id="client_name"
            type="text"
            required
            minLength={3}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-slate-900"
            placeholder="Ej. María López"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="client_email" className="mb-1 block text-sm font-semibold text-slate-700">
            Correo electrónico <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <input
            id="client_email"
            type="email"
            maxLength={100}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-h-11 w-full rounded-md border border-slate-300 px-3 text-slate-900"
            placeholder="Ej. maria@ejemplo.com"
          />
          <p className="mt-1 text-xs text-slate-500">
            Se utiliza como referencia para comprobantes de servicios por encargo.
          </p>
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
            {submitting && (
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            )}
            {isEdit ? 'Guardar cambios' : 'Registrar cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
