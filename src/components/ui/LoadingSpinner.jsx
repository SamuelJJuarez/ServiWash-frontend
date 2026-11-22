import { LoaderCircle } from 'lucide-react';

export default function LoadingSpinner({ label = 'Cargando…', className = '' }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-3 p-8 text-slate-600 ${className}`}>
      <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
