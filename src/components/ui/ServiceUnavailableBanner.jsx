import { TriangleAlert } from 'lucide-react';

/** Aviso discreto de servicios caídos. `fallos`: [{ servicio, error }] */
export default function ServiceUnavailableBanner({ fallos }) {
  if (!fallos?.length) return null;
  return (
    <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-center gap-2 font-semibold">
        <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
        Algunos datos no se pudieron cargar
      </div>
      <ul className="mt-2 space-y-1 text-sm">
        {fallos.map((f) => (
          <li key={f.servicio}>
            <strong>{f.servicio}:</strong>{' '}
            {f.error?.status === 503
              ? 'servicio desconectado (503).'
              : f.error?.status === 401
                ? 'sesión no autorizada, vuelve a iniciar sesión.'
                : f.error?.status === 403
                  ? 'sin permiso para consultar este recurso.'
                  : (f.error?.message ?? 'error desconocido.')}
          </li>
        ))}
      </ul>
    </div>
  );
}
