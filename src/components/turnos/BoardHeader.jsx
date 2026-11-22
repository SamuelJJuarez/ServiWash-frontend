import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, LogIn, Maximize2, Minimize2, RefreshCw, Wifi } from 'lucide-react';

const timeFmt = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <p className="text-2xl font-extrabold leading-none tabular-nums text-white sm:text-3xl">
        {timeFmt.format(now)}
      </p>
      <p className="mt-1 hidden text-xs capitalize text-slate-300 sm:block">
        {dateFmt.format(now)}
      </p>
    </div>
  );
}

/** Cabecera Kiosk del tablero (/tablero): marca, estado WS/polling, reloj en vivo y controles discretos. */
export default function BoardHeader({
  wsStatus,
  lastUpdated,
  authRequired,
  refreshing,
  onRefresh,
  isFullscreen,
  canFullscreen,
  onToggleFullscreen,
  isAuthenticated,
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900 px-4 py-3 text-white sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <span className="text-lg font-extrabold text-sky-400">ServiWash</span>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Tablero de turnos
            </h1>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span
              role="status"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold ${
                wsStatus === 'live'
                  ? 'bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40'
                  : 'bg-sky-500/20 text-sky-200 ring-1 ring-sky-400/40'
              }`}
            >
              {wsStatus === 'live' ? (
                <>
                  <Wifi className="size-3.5" aria-hidden="true" />
                  En vivo WS
                </>
              ) : (
                <>
                  <Clock className="size-3.5" aria-hidden="true" />
                  Actualización automática cada 5s
                </>
              )}
            </span>
            {lastUpdated && !authRequired && (
              <span className="tabular-nums text-slate-400">
                Sincronizado {timeFmt.format(lastUpdated)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <LiveClock />

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3 sm:pl-4">
            {!authRequired && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Actualizar tablero ahora"
                title="Actualizar ahora"
                className="grid size-11 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-60"
              >
                <RefreshCw
                  className={`size-5 ${refreshing ? 'animate-spin motion-reduce:animate-none' : ''}`}
                  aria-hidden="true"
                />
              </button>
            )}

            {canFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                className="grid size-11 place-items-center rounded-lg border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                {isFullscreen ? (
                  <Minimize2 className="size-5" aria-hidden="true" />
                ) : (
                  <Maximize2 className="size-5" aria-hidden="true" />
                )}
              </button>
            )}

            <Link
              to={isAuthenticated ? '/' : '/login'}
              state={isAuthenticated ? undefined : { from: '/tablero' }}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 text-sm font-semibold text-slate-100 hover:bg-slate-700"
            >
              {isAuthenticated ? (
                <>
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  <span className="hidden md:inline">Panel</span>
                </>
              ) : (
                <>
                  <LogIn className="size-4" aria-hidden="true" />
                  <span className="hidden md:inline">Iniciar sesión</span>
                </>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
