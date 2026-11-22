import { request } from './client.js';

/** GET /servicios/ (colección con barra final). */
export const listarServicios = () => request('/servicios/');

/** GET /servicios/{id} */
export const obtenerServicio = (id) => request(`/servicios/${id}`);

/** POST /servicios/ (colección con barra final). */
export const crearServicio = ({ tipo_servicio, metrica_cobro, costo_referencia }) =>
  request('/servicios/', {
    method: 'POST',
    body: {
      tipo_servicio,
      metrica_cobro,
      costo_referencia: Number(costo_referencia),
    },
  });

/** PUT /servicios/{id} — actualización parcial (el servicio no implementa PATCH). */
export const actualizarServicio = (id, parcial) => {
  const body = { ...parcial };
  if (body.costo_referencia !== undefined) {
    body.costo_referencia = Number(body.costo_referencia);
  }
  return request(`/servicios/${id}`, {
    method: 'PUT',
    body,
  });
};

/** DELETE /servicios/{id} */
export const eliminarServicio = (id) =>
  request(`/servicios/${id}`, { method: 'DELETE' });

/** POST /servicios/cotizar/kilo */
export const cotizarKilo = ({ servicio_id, cantidad_kilos, express = false }) =>
  request('/servicios/cotizar/kilo', {
    method: 'POST',
    body: {
      servicio_id: Number(servicio_id),
      cantidad_kilos: Number(cantidad_kilos),
      express: Boolean(express),
    },
  });

/** POST /servicios/cotizar/uso — t_inicio y t_final en ISO YYYY-MM-DDTHH:MM:SS */
export const cotizarUso = ({ servicio_id, t_inicio, t_final, express = false }) =>
  request('/servicios/cotizar/uso', {
    method: 'POST',
    body: {
      servicio_id: Number(servicio_id),
      t_inicio,
      t_final,
      express: Boolean(express),
    },
  });

/** POST /servicios/cotizar/prenda-especial */
export const cotizarPrenda = ({ servicio_id, cantidad_prendas_especiales, express = false }) =>
  request('/servicios/cotizar/prenda-especial', {
    method: 'POST',
    body: {
      servicio_id: Number(servicio_id),
      cantidad_prendas_especiales: Math.trunc(Number(cantidad_prendas_especiales)),
      express: Boolean(express),
    },
  });
