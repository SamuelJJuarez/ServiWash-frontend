import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { listarServicios } from '../api/servicios.api.js';
import { crearTicket } from '../api/tickets.api.js';
import ClientSelector from '../components/pos/ClientSelector.jsx';
import PaymentPanel from '../components/pos/PaymentPanel.jsx';
import ServiceLineForm from '../components/pos/ServiceLineForm.jsx';
import TicketCart from '../components/pos/TicketCart.jsx';
import TicketReceiptModal from '../components/pos/TicketReceiptModal.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import LoadingSpinner from '../components/ui/LoadingSpinner.jsx';
import ServiceUnavailableBanner from '../components/ui/ServiceUnavailableBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useLocalTickets } from '../hooks/useLocalTickets.js';
import { formatMXN } from '../utils/formatters.js';

const redondear = (n) => Math.round(n * 100) / 100;

export default function PosTicketPage() {
  const { user } = useAuth();
  const { guardar } = useLocalTickets();

  const [servicios, setServicios] = useState([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [errorServicios, setErrorServicios] = useState(null);

  const [cliente, setCliente] = useState(null);
  const [lineas, setLineas] = useState([]);
  const [monto, setMonto] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [recibo, setRecibo] = useState(null);

  const cargarServicios = useCallback(async () => {
    setLoadingServicios(true);
    setErrorServicios(null);
    try {
      const data = await listarServicios();
      setServicios(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorServicios(err);
    } finally {
      setLoadingServicios(false);
    }
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  // Aviso del navegador al recargar/cerrar con un pedido a medias (el carrito no se persiste).
  useEffect(() => {
    if (lineas.length === 0) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [lineas.length]);

  const total = useMemo(() => redondear(lineas.reduce((s, l) => s + l.subtotal, 0)), [lineas]);

  const motivo = !cliente
    ? 'Selecciona un cliente.'
    : lineas.length === 0
      ? 'Agrega al menos un servicio.'
      : null;

  const agregarLinea = (linea) => {
    setLineas((prev) => [...prev, linea]);
    setAlerta(null);
  };

  const quitarLinea = (key) => {
    setLineas((prev) => prev.filter((l) => l.key !== key));
    setAlerta(null);
  };

  const cobrar = async () => {
    if (submitting || motivo) return;
    const recibido = Number(monto);
    if (!Number.isFinite(recibido) || recibido < total) {
      setAlerta({ tipo: 'error', mensaje: 'El efectivo recibido debe cubrir el total.' });
      return;
    }

    setSubmitting(true);
    setAlerta(null);
    try {
      const t = await crearTicket({
        clientes_id: cliente.id,
        monto_recibido: recibido,
        servicios: lineas.map((l) => ({
          servicios_id: l.servicios_id,
          metrica_cobro: l.metrica_cobro,
          datos: l.datos,
        })),
      });

      // La respuesta solo trae servicios_id/cantidad/subtotal; se enriquece con lo capturado (mismo orden).
      const registro = {
        ...t,
        guardado_en: new Date().toISOString(),
        cliente_nombre: cliente.name,
        cajero_nombre: user?.nombre_usuario ?? `Usuario ${t.usuarios_id}`,
        detalles: t.detalles.map((d, i) => {
          const l = lineas[i];
          return l && l.servicios_id === d.servicios_id
            ? { ...d, servicio_label: l.servicio_label, detalle: l.detalle, express: l.express }
            : d;
        }),
      };

      if (!guardar(registro)) {
        toast.warning('El ticket se generó, pero no se pudo guardar en el historial local.');
      }
      if (Math.abs(t.cobro_total - total) >= 0.01) {
        toast.warning(
          `El total oficial (${formatMXN(t.cobro_total)}) difiere de la cotización (${formatMXN(total)}). Se cobró el total oficial.`,
        );
      }
      toast.success(`Ticket #${t.id} generado.`);

      // Se limpia al instante para que el mismo pedido no pueda cobrarse dos veces.
      setCliente(null);
      setLineas([]);
      setMonto('');
      setRecibo(registro);
    } catch (err) {
      if (err.status === 503) {
        setAlerta({
          tipo: 'error',
          mensaje: 'El servicio de tickets está desconectado (503). El ticket no se registró; intenta de nuevo cuando vuelva.',
        });
      } else if (err.status === 0 || err.status >= 500) {
        setAlerta({ tipo: 'incierto', mensaje: err.message });
      } else {
        setAlerta({ tipo: 'error', mensaje: err.message || 'No se pudo generar el ticket.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo ticket</h1>
          <p className="text-sm text-slate-600">Elige al cliente, cotiza cada servicio y cobra en efectivo.</p>
        </div>
        <Link
          to="/tickets/historial"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium text-slate-700 hover:bg-slate-50"
        >
          <History className="size-4" aria-hidden="true" />
          Historial de tickets
        </Link>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <ClientSelector cliente={cliente} onChange={setCliente} disabled={submitting} />

          {loadingServicios ? (
            <div className="rounded-xl border border-slate-200 bg-white">
              <LoadingSpinner label="Cargando catálogo de servicios…" />
            </div>
          ) : errorServicios ? (
            <div className="space-y-3">
              <ServiceUnavailableBanner fallos={[{ servicio: 'Servicios', error: errorServicios }]} />
              <button
                type="button"
                onClick={cargarServicios}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Reintentar
              </button>
            </div>
          ) : servicios.length === 0 ? (
            <EmptyState>
              No hay servicios en el catálogo. Un administrador debe registrarlos en Servicios antes de cobrar.
            </EmptyState>
          ) : (
            <ServiceLineForm servicios={servicios} onAdd={agregarLinea} disabled={submitting} />
          )}
        </div>

        <div className="space-y-5 lg:sticky lg:top-20 lg:col-span-5">
          <TicketCart lineas={lineas} onRemove={quitarLinea} disabled={submitting} />
          <PaymentPanel
            total={total}
            monto={monto}
            onMontoChange={(v) => {
              setMonto(v);
              if (alerta?.tipo === 'error') setAlerta(null);
            }}
            onSubmit={cobrar}
            submitting={submitting}
            motivo={motivo}
            alerta={alerta}
          />
        </div>
      </div>

      <TicketReceiptModal ticket={recibo} onClose={() => setRecibo(null)} closeLabel="Nuevo cobro" />
    </div>
  );
}
