import { LoaderCircle } from 'lucide-react';
import Modal from './Modal.jsx';

export default function ConfirmDialog({
  open,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700'
      : 'bg-sky-600 text-white hover:bg-sky-700';

  return (
    <Modal open={open} onClose={loading ? undefined : onCancel} title={title} maxWidth="max-w-md">
      <p className="text-slate-700">{message}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 font-semibold disabled:opacity-60 ${confirmClasses}`}
        >
          {loading && <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
