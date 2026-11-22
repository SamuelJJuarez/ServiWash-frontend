import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, RefreshCw, WashingMachine, Wind } from 'lucide-react';
import { listarClientes } from '../api/clientes.api.js';
import { listarMaquinas } from '../api/maquinas.api.js';
import { listarTurnos } from '../api/turnos.api.js';
import BoardHeader from '../components/turnos/BoardHeader.jsx';
import BoardQueuePanel from '../components/turnos/BoardQueuePanel.jsx';
import BoardStationCard from '../components/turnos/BoardStationCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTurnosSocket } from '../hooks/useTurnosSocket.js';
import { buildActiveTurnsMap } from '../utils/turnos.js';

const POLL_FALLBACK_MS = 5_000;
const POLL_LIVE_SYNC_MS = 10_000;
const BOARD_TURNS_LIMIT = 100;
const RECENT_TURNS_VISIBLE = 8;

function StationBlock({ titulo, icon: Icon, maquinas, activeTurnsMap, clientsMap }) {
  const disponibles = maquinas.filter((m) => m.estado === 'DISPONIBLE').length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/80 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
          <Icon className="size-6 text-sky-600" aria-hidden="true" />
          {titulo}
        </h2>
        <p className="text-base font-semibold tabular-nums text-slate-600">
          <span className="text-emerald-700">{disponibles}</span> disponibles de {maquinas.length}
        </p>
      </div>

      {maquinas.length === 0 ? (
        <div className="mt-4">
          <EmptyState>No hay {titulo.toLowerCase()} registradas.</EmptyState>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {maquinas.map((m) => {
            const activeTurn = activeTurnsMap[m.id] ?? null;
            const clientName = activeTurn?.client_id
              ? clientsMap.get(Number(activeTurn.client_id))?.name
              : null;
            return (
              <BoardStationCard
                key={m.id}
                maquina={m}
                activeTurn={activeTurn}
                clientName={clientName}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function TurnosBoardPage() {
  const { isAuthenticated } = useAuth();

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [maquinas, setMaquinas] = useState(null);
  const [turnos, setTurnos] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [fallos, setFallos] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const inFlightRef = useRef(false);

  const cargar = useCallback(async ({ silent = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!silent) setRefreshing(true);

    try {
      // shortcut: GET /turnos/ no tiene filtro de abiertos ni orden desc; 100 registros cubre la operación del día hasta que backend agregue filtros.
      const fuentes = [
        ['Máquinas', listarMaquinas()],
        ['Turnos', listarTurnos({ page: 0, perPage: BOARD_TURNS_LIMIT })],
        ['Clientes', listarClientes({ page: 0, perPage: 100 })],
      ];
      const resultados = await Promise.allSettled(fuentes.map(([, p]) => p));

      const hay401 = resultados.some(
        (r) => r.status === 'rejected' && r.reason?.status === 401,
      );
      if (hay401) {
        setAuthRequired(true);
        setFallos([]);
        return;
      }

      setAuthRequired(false);

      if (resultados[0].status === 'fulfilled' && Array.isArray(resultados[0].value)) {
        setMaquinas(resultados[0].value);
      }
      if (resultados[1].status === 'fulfilled' && Array.isArray(resultados[1].value)) {
        setTurnos(resultados[1].value);
      }
      if (resultados[2].status === 'fulfilled' && Array.isArray(resultados[2].value)) {
        setClientes(resultados[2].value);
      }

      setFallos(
        resultados
          .map((r, i) => (r.status === 'rejected' ? { servicio: fuentes[i][0], error: r.reason } : null))
          .filter(Boolean),
      );

      if (resultados.some((r) => r.status === 'fulfilled')) {
        setLastUpdated(new Date());
      }
    } finally {
      inFlightRef.current = false;
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleWsSync = useCallback(() => {
    cargar({ silent: true });
  }, [cargar]);

  const { wsStatus, queue, liveAssignments, feed } = useTurnosSocket({
    enabled: !authRequired,
    onSync: handleWsSync,
  });

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (authRequired) return undefined;
    const intervalMs = wsStatus === 'live' ? POLL_LIVE_SYNC_MS : POLL_FALLBACK_MS;
    const id = setInterval(() => {
      if (!document.hidden) cargar({ silent: true });
    }, intervalMs);

    const onVisibility = () => {
      if (!document.hidden) cargar({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authRequired, wsStatus, cargar]);

  // Si un operador inicia sesión en otra pestaña del mismo navegador, recarga el tablero automáticamente.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'serviwash_token' && e.newValue) {
        setAuthRequired(false);
        cargar();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [cargar]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Algunos navegadores o políticas kiosk bloquean Fullscreen API sin gesto válido.
    }
  };

  const machinesMap = useMemo(() => {
    const map = new Map();
    for (const m of maquinas ?? []) map.set(Number(m.id), m);
    return map;
  }, [maquinas]);

  const clientsMap = useMemo(() => {
    const map = new Map();
    for (const c of clientes) map.set(Number(c.id), c);
    return map;
  }, [clientes]);

  const activeTurnsMap = useMemo(
    () => buildActiveTurnsMap(turnos ?? [], liveAssignments),
    [turnos, liveAssignments],
  );

  const lavadoras = useMemo(
    () => (maquinas ?? []).filter((m) => m.tipo_maquina === 'LAVADORA'),
    [maquinas],
  );
  const secadoras = useMemo(
    () => (maquinas ?? []).filter((m) => m.tipo_maquina === 'SECADORA'),
    [maquinas],
  );
  const recentTurns = useMemo(
    () =>
      [...(turnos ?? [])]
        .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
        .slice(0, RECENT_TURNS_VISIBLE),
    [turnos],
  );

  const turnosFallo = fallos.some((f) => f.servicio === 'Turnos') && !turnos;
  const canFullscreen = typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <BoardHeader
        wsStatus={wsStatus}
        lastUpdated={lastUpdated}
        authRequired={authRequired}
        refreshing={refreshing}
        onRefresh={() => cargar()}
        isFullscreen={isFullscreen}
        canFullscreen={canFullscreen}
        onToggleFullscreen={toggleFullscreen}
        isAuthenticated={isAuthenticated}
      />

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 p-4 sm:p-6">
        {initialLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner label="Cargando tablero de turnos…" />
          </div>
        ) : authRequired ? (
          <div className="flex flex-1 items-center justify-center">
            <section
              role="alert"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center"
            >
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-sky-100 text-sky-700">
                <LogIn className="size-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Inicia sesión para activar el tablero
              </h2>
              <p className="mt-2 text-slate-600">
                El servidor requiere una sesión activa en este navegador para consultar el estado de
                lavadoras, secadoras y turnos.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  to="/login"
                  state={{ from: '/tablero' }}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-sky-600 px-5 font-semibold text-white hover:bg-sky-700"
                >
                  <LogIn className="size-5" aria-hidden="true" />
                  Iniciar sesión en este monitor
                </Link>
                <button
                  type="button"
                  onClick={() => cargar()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reintentar
                </button>
              </div>
            </section>
          </div>
        ) : (
          <>
            <ServiceUnavailableBanner fallos={fallos} />

            <div className="grid flex-1 gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                {maquinas ? (
                  <>
                    <StationBlock
                      titulo="Lavadoras"
                      icon={WashingMachine}
                      maquinas={lavadoras}
                      activeTurnsMap={activeTurnsMap}
                      clientsMap={clientsMap}
                    />
                    <StationBlock
                      titulo="Secadoras"
                      icon={Wind}
                      maquinas={secadoras}
                      activeTurnsMap={activeTurnsMap}
                      clientsMap={clientsMap}
                    />
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <EmptyState>
                      El estado de lavadoras y secadoras no está disponible por el momento.
                    </EmptyState>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4">
                <BoardQueuePanel
                  queue={queue}
                  feed={feed}
                  recentTurns={recentTurns}
                  machinesMap={machinesMap}
                  clientsMap={clientsMap}
                  turnosUnavailable={turnosFallo}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
