import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

/** El gateway no valida roles: este guard es la única barrera para vistas administrativas. */
export default function RoleGuard({ allowedRoles, children }) {
  const { user } = useAuth();
  if (user && allowedRoles.includes(user.rol)) return children;

  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center">
      <ShieldAlert className="mx-auto size-10 text-rose-600" aria-hidden="true" />
      <h1 className="mt-4 text-xl font-semibold">No tienes permiso para ver esta pantalla</h1>
      <p className="mt-2 text-slate-600">Esta sección es solo para administradores.</p>
      <Link
        to="/"
        className="mt-6 inline-flex h-11 items-center rounded-lg bg-sky-600 px-5 font-semibold text-white hover:bg-sky-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
