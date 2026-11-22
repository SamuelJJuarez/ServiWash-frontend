import {
  History,
  House,
  ListChecks,
  Plus,
  Tags,
  UserCog,
  Users,
  WashingMachine,
  X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import logoHorizontal from '../../images/Logo_Servi_Wash_horizontal.png';

const GROUPS = [
  {
    title: 'Mostrador',
    items: [
      { to: '/', label: 'Inicio', icon: House, end: true },
      { to: '/tickets/historial', label: 'Historial de tickets', icon: History },
    ],
  },
  {
    title: 'Operación',
    items: [
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/maquinas', label: 'Máquinas', icon: WashingMachine },
      { to: '/turnos', label: 'Turnos', icon: ListChecks },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/servicios', label: 'Servicios', icon: Tags },
      { to: '/usuarios', label: 'Usuarios', icon: UserCog, roles: ['ADMIN'] },
    ],
  },
];

const linkClass = ({ isActive }) =>
  `flex h-11 items-center gap-3 rounded-lg px-3 text-base font-medium ${
    isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        aria-label="Navegación principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 p-4 transition-transform motion-reduce:transition-none lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pb-4">
          <img
            src={logoHorizontal}
            alt="ServiWash"
            className="-my-5 w-44 object-contain lg:w-52"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="grid size-10 place-items-center rounded-lg text-slate-300 hover:bg-slate-800 lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {/* La acción principal del mostrador: siempre a un clic. */}
        <NavLink
          to="/tickets/nuevo"
          onClick={onClose}
          className={({ isActive }) =>
            `mb-4 flex h-14 items-center justify-center gap-2 rounded-lg text-lg font-semibold text-white ${
              isActive ? 'bg-sky-700 ring-2 ring-white/70' : 'bg-sky-600 hover:bg-sky-700'
            }`
          }
        >
          <Plus className="size-6" aria-hidden="true" />
          Nuevo ticket
        </NavLink>

        <nav className="flex-1 space-y-5 overflow-y-auto">
          {GROUPS.map((g) => {
            const items = g.items.filter((i) => !i.roles || i.roles.includes(user?.rol));
            if (!items.length) return null;
            return (
              <div key={g.title}>
                <p className="px-3 pb-1 text-sm text-slate-400">{g.title}</p>
                <ul className="space-y-1">
                  {items.map(({ to, label, icon: Icon, end }) => (
                    <li key={to}>
                      <NavLink to={to} end={end} onClick={onClose} className={linkClass}>
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
