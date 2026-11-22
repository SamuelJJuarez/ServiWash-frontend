import { request } from './client.js';

/** GET /turnos/?page=&per_page=&client_id= (colección con barra final; page base 0). */
export function listarTurnos({ page = 0, perPage = 10, clientId } = {}) {
  const cid = Number(clientId);
  return request('/turnos/', {
    params: {
      page,
      per_page: perPage,
      client_id: Number.isInteger(cid) && cid > 0 ? cid : undefined,
    },
  });
}

/** GET /turnos/{id} (sin barra final). */
export const obtenerTurno = (id) => request(`/turnos/${id}`);

/** DELETE /turnos/{id} (sin barra final). */
export const eliminarTurno = (id) => request(`/turnos/${id}`, { method: 'DELETE' });

/** URL relativa al host actual para pasar por el proxy Vite /ws sin hardcodear puertos internos. */
export function getTurnosWsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
}
