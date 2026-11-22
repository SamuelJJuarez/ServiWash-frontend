import { useCallback, useEffect, useMemo, useState } from 'react';
import { LoaderCircle, RefreshCw, Search, UserPlus, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { crearCliente, listarClientes, obtenerCliente } from '../../api/clientes.api.js';
import ClientFormModal from '../clientes/ClientFormModal.jsx';

// shortcut: solo se cargan los primeros 100 clientes (no hay búsqueda en servidor); el resto se busca por ID.
const LIMITE = 100;
const MAX_RESULTADOS = 8;

export default function ClientSelector({ cliente, onChange, disabled = false }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [buscandoId, setBuscandoId] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarClientes({ page: 0, perPage: LIMITE });
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const q = query.trim().toLowerCase();
  const idBuscado = /^\d+$/.test(q) ? Number(q) : null;

  const resultados = useMemo(() => {
    if (!q) return clientes.slice(0, MAX_RESULTADOS);
    return clientes
      .filter(
        (c) =>
          String(c.id) === q ||
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q),
      )
      .slice(0, MAX_RESULTADOS);
  }, [clientes, q]);

  const idEnLista = idBuscado !== null && clientes.some((c) => c.id === idBuscado);

  const elegir = (c) => {
    onChange(c);
    setQuery('');
  };

  const buscarPorId = async () => {
    if (!idBuscado) return;
    setBuscandoId(true);
    try {
      elegir(await obtenerCliente(idBuscado));
    } catch (err) {
      toast.error(
        err.status === 404
          ? `No existe un cliente con el ID #${idBuscado}.`
          : err.message || 'No se pudo consultar el cliente.',
      );
    } finally {
      setBuscandoId(false);
    }
  };

  const crearRapido = async (payload) => {
    setSaving(true);
    try {
      const res = await crearCliente(payload);
      const id = Number(res?.id);
      if (!Number.isInteger(id) || id <= 0) throw new Error('El servidor no devolvió el ID del cliente.');
      let nuevo = { id, ...payload };
      if ((res?.msg ?? '').toLowerCase().includes('already exists')) {
        nuevo = await obtenerCliente(id).catch(() => nuevo);
        toast.info(`El cliente ya estaba registrado (#${id}) y quedó seleccionado.`);
      } else {
        toast.success(`Cliente #${id} registrado y seleccionado.`);
      }
      setClientes((prev) => (prev.some((c) => c.id === id) ? prev : [nuevo, ...prev]));
      elegir(nuevo);
      setFormOpen(false);
    } catch (err) {
      toast.error(err.message || 'No se pudo registrar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="pos-cliente" className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="pos-cliente" className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
          <span className="flex size-7 items-center justify-center rounded-full bg-sky-600 text-sm text-white">1</span>
          Cliente
        </h2>
        {!cliente && (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            disabled={disabled}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3.5 font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-60"
          >
            <UserPlus className="size-4" aria-hidden="true" />
            Cliente rápido
          </button>
        )}
      </div>

      {cliente ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <UserRound className="size-6 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <p className="font-bold text-slate-900">
                {cliente.name} <span className="font-semibold text-slate-500 tabular-nums">#{cliente.id}</span>
              </p>
              <p className="text-sm text-slate-600">{cliente.email || 'Sin correo registrado'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="inline-flex min-h-11 items-center rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cambiar cliente
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <label htmlFor="pos_cliente_q" className="sr-only">
              Buscar cliente por nombre, correo o ID
            </label>
            <input
              id="pos_cliente_q"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
              placeholder="Buscar por nombre, correo o ID"
              className="min-h-11 w-full rounded-md border border-slate-300 pr-3 pl-9 text-slate-900"
              autoComplete="off"
            />
          </div>

          {loading ? (
            <p role="status" className="flex items-center gap-2 text-sm text-slate-600">
              <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Cargando clientes…
            </p>
          ) : error ? (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <span>
                {error.status === 503
                  ? 'El servicio de Clientes está desconectado (503).'
                  : `No se pudo cargar la lista de clientes: ${error.message}`}
              </span>
              <button
                type="button"
                onClick={cargar}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-amber-400 bg-white px-3 font-medium hover:bg-amber-100"
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : clientes.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-600">
              Aún no hay clientes registrados. Usa “Cliente rápido” para dar de alta al primero.
            </p>
          ) : (
            <>
              {resultados.length > 0 ? (
                <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
                  {resultados.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => elegir(c)}
                        disabled={disabled}
                        className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-sky-50 disabled:opacity-60"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">{c.name}</span>
                          {c.email && <span className="block truncate text-sm text-slate-500">{c.email}</span>}
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-slate-500 tabular-nums">#{c.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">Ningún cliente cargado coincide con “{query.trim()}”.</p>
              )}
              {clientes.length >= LIMITE && (
                <p className="text-xs text-slate-500">
                  Se muestran los primeros {LIMITE} clientes. Para otros, escribe su ID exacto.
                </p>
              )}
            </>
          )}

          {idBuscado !== null && !idEnLista && (
            <button
              type="button"
              onClick={buscarPorId}
              disabled={buscandoId || disabled}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {buscandoId ? (
                <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              ) : (
                <Search className="size-4" aria-hidden="true" />
              )}
              Buscar cliente #{idBuscado} en el servidor
            </button>
          )}
        </div>
      )}

      <ClientFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={crearRapido}
        submitting={saving}
      />
    </section>
  );
}
