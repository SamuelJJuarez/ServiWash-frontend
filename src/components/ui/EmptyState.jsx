import { Inbox } from 'lucide-react';

export default function EmptyState({ children = 'Sin datos para mostrar.' }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-300 p-4 text-slate-600">
      <Inbox className="size-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
