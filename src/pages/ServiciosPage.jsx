import { useCallback, useEffect, useState } from 'react';
import { Calculator, Clock, Pencil, Plus, RefreshCw, Scale, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  listarServicios,
} from '../api/servicios.api.js';
import QuickQuotePanel from '../components/servicios/QuickQuotePanel.jsx';
import ServiceFormModal from '../components/servicios/ServiceFormModal.jsx';
import Badge from '../components/ui/Badge.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatMXN, labelMetricaCobro, labelTipoServicio } from '../utils/formatters.js';

const ICONO_TIPO = {
  SERVICIO_POR_KILO: Scale,
  SERVICIO_POR_USO: Clock,
  SERVICIO_POR_PRENDA_ESPECIAL: Sparkles,
};

const REGLA_CORTA = {
  SERVICIO_POR_KILO: 'Base 2 kg + $25 MXN por kg extra',
  SERVICIO_POR_USO: 'Ciclos fijos de 40 min (mín. 1)',
  SERVICIO_POR_PRENDA_ESPECIAL: 'Tarifa unitaria por prenda',
};

export default function ServiciosPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarServicios();
      const lista = Array.isArray(data) ? data : [];
      setServicios(lista);
      setSelectedQuoteId((prev) =>
        lista.some((s) => s.id === prev) ? prev : (lista[0]?.id ?? null),
      );
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (servicio) => {
    setEditing(servicio);
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        const actualizado = await actualizarServicio(editing.id, payload);
        setServicios((prev) => prev.map((s) => (s.id === actualizado.id ? actualizado : s)));
        toast.success(`Servicio #${actualizado.id} actualizado.`);
      } else {
        const creado = await crearServicio(payload);
        setServicios((prev) => [...prev, creado]);
        setSelectedQuoteId((prev) => prev ?? creado.id);
        toast.success(`Servicio #${creado.id} creado.`);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar el servicio.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eliminarServicio(deleteTarget.id);
      setServicios((prev) => {
        const next = prev.filter((s) => s.id !== deleteTarget.id);
        setSelectedQuoteId((curr) => (curr === deleteTarget.id ? (next[0]?.id ?? null) : curr));
        return next;
      });
      toast.success(`Servicio #${deleteTarget.id} eliminado.`);
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err.status === 500
          ? 'No se puede eliminar el servicio porque está asociado a tickets registrados.'
          : err.message || 'No se pudo eliminar el servicio.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Servicios</h1>
          <p className="text-sm text-slate-600">
            Tarifas de referencia en MXN y simulador oficial de cotizaciones.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={cargar}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`}
              aria-hidden="true"
            />
            Actualizar
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nuevo servicio
            </button>
          )}
        </div>
      </div>

      {error && <ServiceUnavailableBanner fallos={[{ servicio: 'Servicios', error }]} />}

      {loading ? (
        <LoadingSpinner label="Cargando catálogo de servicios…" />
      ) : error ? null : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-7">
            {servicios.length === 0 ? (
              <EmptyState>
                {isAdmin
                  ? 'Aún no hay servicios configurados. Crea el primero con el botón "Nuevo servicio".'
                  : 'Aún no hay servicios configurados en el catálogo.'}
              </EmptyState>
            ) : (
              servicios.map((s) => {
                const Icono = ICONO_TIPO[s.tipo_servicio] ?? Sparkles;
                const isSelected = selectedQuoteId === s.id;

                return (
                  <article
                    key={s.id}
                    className={`rounded-xl border bg-white p-5 transition-colors ${
                      isSelected ? 'border-sky-400 ring-1 ring-sky-200' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sky-700">
                          <Icono className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">
                              {labelTipoServicio(s.tipo_servicio)}
                            </h2>
                            <span className="text-xs font-semibold text-slate-500">#{s.id}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge tone="slate">{labelMetricaCobro(s.metrica_cobro)}</Badge>
                            <span className="text-sm text-slate-600">
                              {REGLA_CORTA[s.tipo_servicio] ?? ''}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-xs font-medium text-slate-500">Referencia</span>
                        <span className="text-2xl font-bold tabular-nums text-slate-900">
                          {formatMXN(s.costo_referencia)}
                        </span>
                        <span className="ml-1 text-xs font-semibold text-slate-500">MXN</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setSelectedQuoteId(s.id)}
                        className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-colors ${
                          isSelected
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <Calculator className="size-4" aria-hidden="true" />
                        {isSelected ? 'En cotizador' : 'Cotizar'}
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(s)}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(s)}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="lg:col-span-5">
            <QuickQuotePanel
              servicios={servicios}
              selectedServiceId={selectedQuoteId}
              onSelectService={setSelectedQuoteId}
            />
          </div>
        </div>
      )}

      <ServiceFormModal
        open={formOpen}
        servicio={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        submitting={saving}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar servicio"
        message={
          deleteTarget
            ? `¿Seguro que deseas eliminar "${labelTipoServicio(deleteTarget.tipo_servicio)}" (#${deleteTarget.id})? Esta acción es permanente.`
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
