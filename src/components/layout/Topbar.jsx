import { LogOut, Menu, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Badge from '../ui/Badge.jsx';

const fmt = new Intl.DateTimeFormat('es-MX', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className="hidden text-slate-600 tabular-nums sm:inline">{fmt.format(now)}</span>;
}

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menú"
        className="grid size-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>

      <Clock />

      <div className="ml-auto flex items-center gap-3">
        <a
          href="/tablero"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-100"
        >
          <Monitor className="size-5" aria-hidden="true" />
          <span className="hidden md:inline">Tablero de turnos</span>
        </a>

        <div className="flex items-center gap-2">
          <span className="hidden font-semibold sm:inline">{user?.nombre_usuario}</span>
          <Badge tone={user?.rol === 'ADMIN' ? 'dark' : 'sky'}>{user?.rol}</Badge>
        </div>

        <button
          type="button"
          onClick={logout}
          className="inline-flex h-11 items-center gap-2 rounded-lg px-3 font-medium text-slate-700 hover:bg-slate-100"
        >
          <LogOut className="size-5" aria-hidden="true" />
          <span className="hidden md:inline">Cerrar sesión</span>
          <span className="sr-only md:hidden">Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
