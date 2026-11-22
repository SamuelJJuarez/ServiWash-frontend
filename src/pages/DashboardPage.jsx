import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Receipt, RefreshCw, UserPlus, WashingMachine, Wind } from 'lucide-react';
import { listarMaquinas } from '../api/maquinas.api.js';
import { listarServicios } from '../api/servicios.api.js';
import { listarTurnos } from '../api/turnos.api.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { formatMXN, formatFecha, labelEstadoMaquina } from '../utils/formatters.js';

const TICKETS_KEY = 'serviwash_recent_tickets';

const ESTADO_STYLE = {
  DISPONIBLE: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  OCUPADA: 'bg-amber-100 text-amber-800 border-amber-300',
  EN_MANTENIMIENTO: 'bg-rose-100 text-rose-800 border-rose-300',
};

/** Ventas de hoy según el historial local (ADR-03). Tolera datos ausentes o corruptos. */
function ventasLocalesHoy() {
  try {
    const lista = JSON.parse(localStorage.getItem(TICKETS_KEY) ?? '[]');
    if (!Array.isArray(lista)) return { total: 0, cantidad: 0 };
    const hoy = new Date().toDateString();
    const deHoy = lista.filter((t) => {
      const f = new Date(t?.guardado_en ?? t?.fecha ?? '');
      return !Number.isNaN(f.getTime()) && f.toDateString() === hoy;
    });
    return { total: deHoy.reduce((s, t) => s + (Number(t.cobro_total) || 0), 0), cantidad: deHoy.length };
  } catch {
    return { total: 0, cantidad: 0 };
  }
}

function Kpi({ label, value, hint, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

function MachineGrid({ titulo, icono: Icono, maquinas }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="flex items-center gap-2 font-semibold">
        <Icono className="size-5 text-sky-600" aria-hidden="true" />
        {titulo} <span className="text-slate-500 tabular-nums">({maquinas.length})</span>
      </h3>
      {maquinas.length === 0 ? (
        <div className="mt-3"><EmptyState>No hay {titulo.toLowerCase()} registradas.</EmptyState></div>
      ) : (
        <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2">
          {maquinas.map((m) => (
            <li key={m.id} className={`rounded-md border p-2 text-sm ${ESTADO_STYLE[m.estado] ?? 'bg-slate-100 border-slate-300'}`}>
              <span className="font-bold tabular-nums">#{m.id}</span>
              <span className="block">{labelEstadoMaquina(m.estado)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const ACCESOS = [
  { to: '/tickets/nuevo', label: 'Nuevo ticket', icon: Receipt, primary: true },
  { to: '/tablero', label: 'Ver tablero de turnos', icon: Monitor, newTab: true },
  { to: '/clientes', label: 'Registrar cliente', icon: UserPlus },
  { to: '/maquinas', label: 'Gestionar máquinas', icon: WashingMachine },
];

export default function DashboardPage() {
  const [state, setState] = useState({ loading: true, maquinas: null, servicios: null, turnos: null, fallos: [] });

  const cargar = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const fuentes = [
      ['Máquinas', listarMaquinas()],
      ['Servicios', listarServicios()],
      ['Turnos', listarTurnos({ page: 0, perPage: 10 })],
    ];
    const resultados = await Promise.allSettled(fuentes.map(([, p]) => p));
    const ok = (i) => (resultados[i].status === 'fulfilled' && Array.isArray(resultados[i].value) ? resultados[i].value : null);
    setState({
      loading: false,
      maquinas: ok(0),
      servicios: ok(1),
      turnos: ok(2),
      fallos: resultados
        .map((r, i) => (r.status === 'rejected' ? { servicio: fuentes[i][0], error: r.reason } : null))
        .filter(Boolean),
    });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const { loading, maquinas, servicios, turnos, fallos } = state;
  const ventas = ventasLocalesHoy();
  const cuenta = (e) => (maquinas ?? []).filter((m) => m.estado === e).length;
  const lavadoras = (maquinas ?? []).filter((m) => m.tipo_maquina === 'LAVADORA');
  const secadoras = (maquinas ?? []).filter((m) => m.tipo_maquina === 'SECADORA');
  const NA = '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inicio</h1>
        <button
          type="button"
          onClick={cargar}
          disabled={loading}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      <nav aria-label="Accesos rápidos" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ACCESOS.map(({ to, label, icon: Icon, primary, newTab }) => (
          <Link
            key={to}
            to={to}
            {...(newTab ? { target: '_blank', rel: 'noreferrer' } : {})}
            className={`flex min-h-14 items-center gap-3 rounded-lg px-4 font-semibold ${
              primary ? 'bg-sky-600 text-white hover:bg-sky-700' : 'border border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {loading && !maquinas && !servicios && !turnos ? (
        <LoadingSpinner label="Cargando panel…" />
      ) : (
        <>
          <ServiceUnavailableBanner fallos={fallos} />

          <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <Kpi
              label="Máquinas disponibles"
              value={maquinas ? `${cuenta('DISPONIBLE')} / ${maquinas.length}` : NA}
              tone="text-emerald-700"
            />
            <Kpi label="Máquinas ocupadas" value={maquinas ? cuenta('OCUPADA') : NA} tone="text-amber-700" />
            <Kpi label="En mantenimiento" value={maquinas ? cuenta('EN_MANTENIMIENTO') : NA} tone="text-rose-700" />
            <Kpi label="Servicios configurados" value={servicios ? servicios.length : NA} />
            <Kpi
              label="Ventas de hoy (este navegador)"
              value={formatMXN(ventas.total)}
              hint={`${ventas.cantidad} ticket(s)`}
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            {maquinas ? (
              <>
                <MachineGrid titulo="Lavadoras" icono={WashingMachine} maquinas={lavadoras} />
                <MachineGrid titulo="Secadoras" icono={Wind} maquinas={secadoras} />
              </>
            ) : (
              <div className="lg:col-span-2"><EmptyState>Resumen de máquinas no disponible.</EmptyState></div>
            )}
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="font-semibold">Últimos turnos</h2>
            <div className="mt-3">
              {!turnos ? (
                <EmptyState>Turnos no disponibles por ahora.</EmptyState>
              ) : turnos.length === 0 ? (
                <EmptyState>Aún no hay turnos registrados.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {turnos.map((t) => (
                    <li key={t.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                      <span className="font-medium tabular-nums">Turno #{t.id} · Máquina {t.machine_id} · Cliente {t.client_id}</span>
                      <span className="text-slate-600 tabular-nums">
                        {formatFecha(t.start_hour)} → {t.close_hour ? formatFecha(t.close_hour) : 'abierto'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
