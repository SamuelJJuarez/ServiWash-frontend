import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  actualizarCliente,
  crearCliente,
  eliminarCliente,
  listarClientes,
  obtenerCliente,
} from '../api/clientes.api.js';
import ClientFormModal from '../components/clientes/ClientFormModal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';

const PER_PAGE = 15;

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [idLookup, setIdLookup] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cargar = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarClientes({ page: targetPage, perPage: PER_PAGE });
      setClientes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    cargar(page);
  }, [cargar, page]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        String(c.id).includes(q) ||
        (c.name ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q),
    );
  }, [clientes, query]);

  const listaVisible = lookupResult ? [lookupResult] : filtrados;
  const esUltimaPagina = clientes.length < PER_PAGE;

  const handleLookupById = async (e) => {
    e.preventDefault();
    const num = Number(idLookup.trim());
    if (!Number.isInteger(num) || num <= 0) {
      toast.error('Ingresa un ID numérico válido mayor a 0.');
      return;
    }
    setLookupLoading(true);
    try {
      const cliente = await obtenerCliente(num);
      setLookupResult(cliente);
    } catch (err) {
      if (err.status === 404) {
        toast.error(`No se encontró ningún cliente con el ID #${num}.`);
      } else {
        toast.error(err.message || 'No se pudo consultar el cliente.');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const clearLookup = () => {
    setLookupResult(null);
    setIdLookup('');
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (cliente) => {
    setEditing(cliente);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        await actualizarCliente(editing.id, payload);
        const actualizado = { ...editing, ...payload };
        setClientes((prev) => prev.map((c) => (c.id === editing.id ? actualizado : c)));
        if (lookupResult?.id === editing.id) setLookupResult(actualizado);
        toast.success(`Cliente #${editing.id} actualizado.`);
      } else {
        const res = await crearCliente(payload);
        const yaExistia = (res?.msg ?? '').toLowerCase().includes('already exists');
        if (yaExistia) {
          toast.info(`El cliente ya estaba registrado (#${res.id}).`);
        } else {
          toast.success(`Cliente #${res?.id ?? ''} registrado.`);
        }
        clearLookup();
        await cargar(page);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar el cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eliminarCliente(deleteTarget.id);
      toast.success(`Cliente #${deleteTarget.id} eliminado.`);
      if (lookupResult?.id === deleteTarget.id) clearLookup();
      setDeleteTarget(null);

      const restantes = clientes.filter((c) => c.id !== deleteTarget.id);
      if (restantes.length === 0 && page > 0) {
        setPage((p) => p - 1);
      } else {
        setClientes(restantes);
      }
    } catch (err) {
      const msg =
        err.status === 500
          ? 'No se puede eliminar el cliente porque tiene tickets o turnos registrados.'
          : err.message || 'No se pudo eliminar el cliente.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-600">
            Directorio de clientes registrados para emisión de tickets y asignación de turnos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => cargar(page)}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`}
              aria-hidden="true"
            />
            Actualizar
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700"
          >
            <Plus className="size-5" aria-hidden="true" />
            Nuevo cliente
          </button>
        </div>
      </div>

      {error && <ServiceUnavailableBanner fallos={[{ servicio: 'Clientes', error }]} />}

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-12">
        <div className="relative md:col-span-7">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={Boolean(lookupResult)}
            placeholder="Filtrar en esta página por nombre, correo o ID…"
            aria-label="Filtrar clientes en esta página"
            className="min-h-11 w-full rounded-md border border-slate-300 pl-9 pr-3 text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </div>

        <form onSubmit={handleLookupById} className="flex gap-2 md:col-span-5">
          <input
            type="number"
            min="1"
            step="1"
            value={idLookup}
            onChange={(e) => setIdLookup(e.target.value)}
            placeholder="Buscar por ID exacto"
            aria-label="Buscar cliente por ID"
            className="min-h-11 w-full rounded-md border border-slate-300 px-3 tabular-nums text-slate-900"
          />
          <button
            type="submit"
            disabled={lookupLoading || !idLookup.trim()}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            {lookupLoading ? 'Buscando…' : 'Buscar ID'}
          </button>
          {lookupResult && (
            <button
              type="button"
              onClick={clearLookup}
              aria-label="Limpiar búsqueda por ID"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-slate-600 hover:bg-slate-50"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </form>
      </div>

      {lookupResult && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-900">
          <span>
            Mostrando resultado exacto para el cliente <strong>#{lookupResult.id}</strong>.
          </span>
          <button
            type="button"
            onClick={clearLookup}
            className="font-semibold text-sky-700 underline hover:text-sky-900"
          >
            Volver al listado paginado
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Cargando directorio de clientes…" />
      ) : error ? null : listaVisible.length === 0 ? (
        <EmptyState>
          {query.trim()
            ? 'Ningún cliente en esta página coincide con tu búsqueda.'
            : 'No hay clientes registrados en esta página.'}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo electrónico</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listaVisible.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-slate-600">
                      #{c.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                          <UserRound className="size-4" aria-hidden="true" />
                        </span>
                        <span className="font-semibold text-slate-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="size-3.5 text-slate-400" aria-hidden="true" />
                          {c.email}
                        </span>
                      ) : (
                        <span className="text-slate-400">Sin correo</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(c)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!lookupResult && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="tabular-nums">
                Página <strong>{page + 1}</strong> · {clientes.length}{' '}
                {clientes.length === 1 ? 'cliente' : 'clientes'} en esta página
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || loading}
                  className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={esUltimaPagina || loading}
                  className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 bg-white px-3 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ClientFormModal
        open={formOpen}
        cliente={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        submitting={saving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar cliente"
        message={
          deleteTarget
            ? `¿Seguro que deseas eliminar a "${deleteTarget.name}" (#${deleteTarget.id})? Si tiene tickets o turnos asociados, el sistema impedirá el borrado.`
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
