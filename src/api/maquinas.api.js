import { request } from './client.js';

/** GET /maquinas/ (colección con barra final). `estado` opcional. */
export const listarMaquinas = (estado) =>
  request('/maquinas/', { params: estado ? { estado } : undefined });

/** GET /maquinas/{id} */
export const obtenerMaquina = (id) => request(`/maquinas/${id}`);

/** POST /maquinas/ (colección con barra final). */
export const crearMaquina = ({ tipo_maquina, capacidad, tiempo_ciclo, estado = 'DISPONIBLE' }) =>
  request('/maquinas/', {
    method: 'POST',
    body: {
      tipo_maquina,
      capacidad: Number(capacidad),
      tiempo_ciclo: Math.trunc(Number(tiempo_ciclo)),
      estado,
    },
  });

/** PATCH /maquinas/{id}/estado */
export const cambiarEstadoMaquina = (id, estado) =>
  request(`/maquinas/${id}/estado`, {
    method: 'PATCH',
    body: { estado },
  });

/** PATCH /maquinas/{id}/tipo_maquina */
export const cambiarTipoMaquina = (id, tipo_maquina) =>
  request(`/maquinas/${id}/tipo_maquina`, {
    method: 'PATCH',
    body: { tipo_maquina },
  });

/** DELETE /maquinas/{id} */
export const eliminarMaquina = (id) =>
  request(`/maquinas/${id}`, { method: 'DELETE' });
