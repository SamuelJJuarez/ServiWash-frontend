import { request } from './client.js';

export const listarClientes = ({ page = 0, perPage = 15 } = {}) =>
  request('/clientes/', { params: { page, per_page: perPage } });

export const obtenerCliente = (id) => request(`/clientes/${id}`);

export const crearCliente = ({ name, email = null }) =>
  request('/clientes/', {
    method: 'POST',
    body: email ? { name, email } : { name },
  });

export const actualizarCliente = (id, { name, email = null }) =>
  request(`/clientes/${id}`, {
    method: 'PUT',
    body: { name, email: email || null },
  });

export const eliminarCliente = (id) =>
  request(`/clientes/${id}`, { method: 'DELETE' });
