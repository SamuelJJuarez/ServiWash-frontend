import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Monitor, RefreshCw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { listarClientes, obtenerCliente } from '../api/clientes.api.js';
import { listarMaquinas } from '../api/maquinas.api.js';
import { eliminarTurno, listarTurnos } from '../api/turnos.api.js';
import TurnosTable from '../components/turnos/TurnosTable.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PER_PAGE = 15;
const CLIENTS_PRELOAD = 100;

export default function TurnosAdminPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [turnos, setTurnos] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [turnosError, setTurnosError] = useState(null);

  const [clientIdFilter, setClientIdFilter] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');

  const [maquinas, setMaquinas] = useState([]);
  const [clientesMap, setClientesMap] = useState(() => new Map());
  const [hasMoreClients, setHasMoreClients] = useState(false);
  const [catalogFallos, setCatalogFallos] = useState([]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const attemptedClientsRef = useRef(new Set());

  const cargarCatalogos = useCallback(async () => {
    const fuentes = [
      ['Máquinas', listarMaquinas()],
      ['Clientes', listarClientes({ page: 0, perPage: CLIENTS_PRELOAD })],
    ];
    const resultados = await Promise.allSettled(fuentes.map(([, p]) => p));

    if (resultados[0].status === 'fulfilled' && Array.isArray(resultados[0].value)) {
      setMaquinas(resultados[0].value);
    }
    if (resultados[1].status === 'fulfilled' && Array.isArray(resultados[1].value)) {
      const lista = resultados[1].value;
      setHasMoreClients(lista.length >= CLIENTS_PRELOAD);
      setClientesMap((prev) => {
        const next = new Map(prev);
        for (const c of lista) next.set(Number(c.id), c);
        return next;
      });
    }

    setCatalogFallos(
      resultados
        .map((r, i) => (r.status === 'rejected' ? { servicio: fuentes[i][0], error: r.reason } : null))
        .filter(Boolean),
    );
  }, []);

  const cargarTurnos = useCallback(
    async (targetPage = page, targetClientId = clientIdFilter) => {
      setLoading(true);
      setTurnosError(null);
      try {
        const data = await listarTurnos({
          page: targetPage,
          perPage: PER_PAGE,
          clientId: targetClientId || undefined,
        });
        setTurnos(Array.isArray(data) ? data : []);
      } catch (err) {
        setTurnosError(err);
      } finally {
        setLoading(false);
      }
    },
    [page, clientIdFilter],
  );

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarTurnos(page, clientIdFilter);
  }, [cargarTurnos, page, clientIdFilter]);

  // Si existen >100 clientes en BD, resuelve nombres faltantes de la página actual una sola vez.
  useEffect(() => {
    if (!hasMoreClients || turnos.length === 0) return undefined;
    const faltantes = [
      ...new Set(
        turnos
          .map((t) => Number(t.client_id))
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0 &&
              !clientesMap.has(id) &&
              !attemptedClientsRef.current.has(id),
          ),
      ),
    ];
    if (faltantes.length === 0) return undefined;
    for (const id of faltantes) attemptedClientsRef.current.add(id);

    let cancelled = false;
    Promise.allSettled(faltantes.map((id) => obtenerCliente(id))).then((res) => {
      if (cancelled) return;
      const resueltos = res
        .filter((r) => r.status === 'fulfilled' && r.value?.id)
        .map((r) => r.value);
      if (resueltos.length === 0) return;
      setClientesMap((prev) => {
        const next = new Map(prev);
        for (const c of resueltos) next.set(Number(c.id), c);
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [turnos, hasMoreClients, clientesMap]);

  const maquinasMap = useMemo(() => {
    const map = new Map();
    for (const m of maquinas) map.set(Number(m.id), m);
    return map;
  }, [maquinas]);

  const clientesOrdenados = useMemo(
    () =>
      [...clientesMap.values()].sort((a, b) =>
        (a.name ?? '').localeCompare(b.name ?? '', 'es-MX'),
      ),
    [clientesMap],
  );

  const fallos = useMemo(() => {
    const lista = [...catalogFallos];
    if (turnosError) lista.unshift({ servicio: 'Turnos', error: turnosError });
    return lista;
  }, [turnosError, catalogFallos]);

  const handleRefreshAll = () => {
    cargarCatalogos();
    cargarTurnos(page, clientIdFilter);
  };

  const handleApplyClientFilter = (e) => {
    e.preventDefault();
    const raw = clientIdInput.trim();
    if (!raw) {
      setClientIdFilter('');
      setPage(0);
      return;
    }
    const num = Number(raw);
    if (!Number.isInteger(num) || num <= 0) {
      toast.error('Ingresa un ID de cliente numérico mayor a 0.');
      return;
    }
    setClientIdFilter(String(num));
    setPage(0);
  };

  const handleSelectClient = (value) => {
    setClientIdInput(value);
    setClientIdFilter(value);
    setPage(0);
  };

  const clearFilter = () => {
    setClientIdInput('');
    setClientIdFilter('');
    setPage(0);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eliminarTurno(deleteTarget.id);
      toast.success(`Turno #${deleteTarget.id} eliminado.`);
      const restantes = turnos.filter((t) => t.id !== deleteTarget.id);
      setDeleteTarget(null);
      if (restantes.length === 0 && page > 0) {
        setPage((p) => p - 1);
      } else {
        setTurnos(restantes);
      }
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el turno.');
    } finally {
      setDeleting(false);
    }
  };

  const activeFilterClient = clientIdFilter ? clientesMap.get(Number(clientIdFilter)) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turnos</h1>
          <p className="text-sm text-slate-600">
            Registro histórico y turnos activos de autolavado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`}
              aria-hidden="true"
            />
            Actualizar
          </button>

          <a
            href="/tablero"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700"
          >
            <Monitor className="size-5" aria-hidden="true" />
            Abrir tablero Kiosk
          </a>
        </div>
      </div>

      <ServiceUnavailableBanner fallos={fallos} />

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-12">
        <div className="md:col-span-7">
          <label htmlFor="turno-cliente-select" className="mb-1 block text-sm font-medium text-slate-700">
            Filtrar por cliente
          </label>
          <select
            id="turno-cliente-select"
            value={clientesMap.has(Number(clientIdFilter)) ? clientIdFilter : ''}
            onChange={(e) => handleSelectClient(e.target.value)}
            disabled={clientesOrdenados.length === 0}
            className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
          >
            <option value="">
              {clientesOrdenados.length > 0
                ? 'Todos los clientes'
                : 'Catálogo de clientes no disponible (usa ID exacto)'}
            </option>
            {clientesOrdenados.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name} (#{c.id})
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleApplyClientFilter} className="md:col-span-5">
          <label htmlFor="turno-cliente-id" className="mb-1 block text-sm font-medium text-slate-700">
            O filtrar por ID de cliente
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="turno-cliente-id"
                type="number"
                min="1"
                step="1"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="Ej. 12"
                className="min-h-11 w-full rounded-md border border-slate-300 pl-9 pr-3 tabular-nums text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              Filtrar
            </button>
            {clientIdFilter && (
              <button
                type="button"
                onClick={clearFilter}
                aria-label="Limpiar filtro de cliente"
                className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-slate-600 hover:bg-slate-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      </div>

      {clientIdFilter && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
          <span>
            Mostrando turnos del cliente{' '}
            <strong>
              {activeFilterClient ? `${activeFilterClient.name} (#${clientIdFilter})` : `#${clientIdFilter}`}
            </strong>
            .
          </span>
          <button
            type="button"
            onClick={clearFilter}
            className="font-semibold text-sky-700 underline hover:text-sky-900"
          >
            Mostrar todos los turnos
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Cargando turnos…" />
      ) : turnosError ? null : turnos.length === 0 ? (
        <EmptyState>
          {clientIdFilter
            ? `No se encontraron turnos para el cliente #${clientIdFilter} en esta página.`
            : 'No hay turnos registrados en esta página.'}
        </EmptyState>
      ) : (
        <TurnosTable
          turnos={turnos}
          maquinasMap={maquinasMap}
          clientesMap={clientesMap}
          isAdmin={isAdmin}
          page={page}
          perPage={PER_PAGE}
          loading={loading}
          onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
          onDelete={setDeleteTarget}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar turno"
        message={
          deleteTarget
            ? `¿Seguro que deseas eliminar el turno #${deleteTarget.id} (Máquina #${deleteTarget.machine_id})? Esta acción es permanente.`
            : ''
        }
        confirmLabel="Sí, eliminar"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
