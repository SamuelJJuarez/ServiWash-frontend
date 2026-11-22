import { useCallback, useEffect, useState } from 'react';
import { Info, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  cambiarEstadoMaquina,
  cambiarTipoMaquina,
  crearMaquina,
  eliminarMaquina,
  listarMaquinas,
} from '../api/maquinas.api.js';
import MachineCard from '../components/maquinas/MachineCard.jsx';
import MachineFormModal from '../components/maquinas/MachineFormModal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { labelEstadoMaquina } from '../utils/formatters.js';

const FILTROS_ESTADO = [
  { value: '', label: 'Todas' },
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'OCUPADA', label: 'Ocupada' },
  { value: 'EN_MANTENIMIENTO', label: 'En mantenimiento' },
];

const FILTROS_TIPO = [
  { value: '', label: 'Todos los tipos' },
  { value: 'LAVADORA', label: 'Lavadoras' },
  { value: 'SECADORA', label: 'Secadoras' },
];

export default function MaquinasPage() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'ADMIN';

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [maquinas, setMaquinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busyId, setBusyId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarMaquinas(filtroEstado || undefined);
      setMaquinas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleCrear = async (payload) => {
    setCreating(true);
    try {
      const creada = await crearMaquina(payload);
      toast.success(`Máquina #${creada.id} registrada.`);
      setShowCreate(false);
      await cargar();
      return true;
    } catch (err) {
      toast.error(err.message || 'No se pudo registrar la máquina.');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleChangeEstado = async (maquina, nuevoEstado) => {
    setBusyId(maquina.id);
    try {
      const actualizada = await cambiarEstadoMaquina(maquina.id, nuevoEstado);
      setMaquinas((prev) => {
        if (filtroEstado && actualizada.estado !== filtroEstado) {
          return prev.filter((m) => m.id !== actualizada.id);
        }
        return prev.map((m) => (m.id === actualizada.id ? actualizada : m));
      });
      toast.success(`Máquina #${maquina.id} ahora está ${labelEstadoMaquina(nuevoEstado).toLowerCase()}.`);
    } catch (err) {
      toast.error(err.message || 'No se pudo cambiar el estado.');
    } finally {
      setBusyId(null);
    }
  };

  const handleChangeTipo = async (maquina, nuevoTipo) => {
    setBusyId(maquina.id);
    try {
      const actualizada = await cambiarTipoMaquina(maquina.id, nuevoTipo);
      setMaquinas((prev) => prev.map((m) => (m.id === actualizada.id ? actualizada : m)));
      toast.success(
        `Máquina #${maquina.id} cambiada a ${nuevoTipo === 'LAVADORA' ? 'Lavadora' : 'Secadora'}.`,
      );
    } catch (err) {
      toast.error(err.message || 'No se pudo cambiar el tipo de máquina.');
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await eliminarMaquina(deleteTarget.id);
      setMaquinas((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success(`Máquina #${deleteTarget.id} eliminada.`);
      setDeleteTarget(null);
    } catch (err) {
      const msg =
        err.status === 500
          ? 'No se puede eliminar la máquina porque tiene turnos asociados.'
          : err.message || 'No se pudo eliminar la máquina.';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const visibles = filtroTipo
    ? maquinas.filter((m) => m.tipo_maquina === filtroTipo)
    : maquinas;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Máquinas</h1>
          <p className="text-sm text-slate-600">
            Control de lavadoras y secadoras en tiempo real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={cargar}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
            Actualizar
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700"
            >
              <Plus className="size-5" aria-hidden="true" />
              Nueva máquina
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          La capacidad y la duración del ciclo no son editables tras la creación. Para cambiarlos,
          elimina la máquina y regístrala nuevamente.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por estado">
          {FILTROS_ESTADO.map((f) => (
            <button
              key={f.value || 'ALL'}
              type="button"
              onClick={() => setFiltroEstado(f.value)}
              className={`min-h-10 rounded-md px-3 text-sm font-semibold transition-colors ${
                filtroEstado === f.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo">
          {FILTROS_TIPO.map((f) => (
            <button
              key={f.value || 'ALL_TYPES'}
              type="button"
              onClick={() => setFiltroTipo(f.value)}
              className={`min-h-10 rounded-md border px-3 text-sm font-medium transition-colors ${
                filtroTipo === f.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ServiceUnavailableBanner fallos={[{ servicio: 'Máquinas', error }]} />}

      {loading ? (
        <LoadingSpinner label="Cargando máquinas…" />
      ) : error ? null : visibles.length === 0 ? (
        <EmptyState>
          {filtroEstado || filtroTipo
            ? 'No hay máquinas que coincidan con los filtros seleccionados.'
            : 'Aún no hay máquinas registradas.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((m) => (
            <MachineCard
              key={m.id}
              maquina={m}
              isAdmin={isAdmin}
              busy={busyId === m.id}
              onChangeEstado={handleChangeEstado}
              onChangeTipo={handleChangeTipo}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <MachineFormModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCrear}
        submitting={creating}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar máquina"
        message={
          deleteTarget
            ? `¿Seguro que deseas eliminar la ${deleteTarget.tipo_maquina === 'LAVADORA' ? 'lavadora' : 'secadora'} #${deleteTarget.id}? Esta acción es permanente.`
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
