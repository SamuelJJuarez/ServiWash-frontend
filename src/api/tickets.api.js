import { ApiError, getToken, request } from './client.js';
import { getJwtInfo } from '../utils/jwt.js';

/** El backend devuelve importes y cantidades como strings ("610.00", "5.0"); aquí se pasan a Number. */
export function normalizarTicket(t) {
  return {
    ...t,
    id: Number(t.id),
    clientes_id: Number(t.clientes_id),
    usuarios_id: Number(t.usuarios_id),
    cobro_total: Number(t.cobro_total),
    monto_recibido: Number(t.monto_recibido),
    cambio_entregado: Number(t.cambio_entregado),
    detalles: (t.detalles ?? []).map((d) => ({
      ...d,
      servicios_id: Number(d.servicios_id),
      cantidad: Number(d.cantidad),
      subtotal: Number(d.subtotal),
    })),
  };
}

/**
 * POST /tickets/ (único endpoint de Ticket; no hay GET/PUT/DELETE).
 * `servicios`: [{ servicios_id, metrica_cobro: 'KILO'|'USO'|'PRENDA_ESPECIAL', datos }]
 */
export async function crearTicket({ clientes_id, monto_recibido, servicios }) {
  const usuarios_id = getJwtInfo(getToken())?.id;
  if (!Number.isInteger(usuarios_id) || usuarios_id <= 0) {
    throw new ApiError('No se pudo identificar al cajero. Vuelve a iniciar sesión.', 401, null);
  }
  const data = await request('/tickets/', {
    method: 'POST',
    body: {
      clientes_id: Number(clientes_id),
      usuarios_id,
      metodo_pago: 'EFECTIVO',
      monto_recibido: Number(monto_recibido),
      servicios,
    },
  });
  return normalizarTicket(data.ticket);
}
