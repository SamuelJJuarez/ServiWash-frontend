import { request } from './client.js';

// Contrato: docs/api/Usuarios.md. Sin barra final (subrutas). Errores bajo "detail".

export const loginUsuario = (nombre_usuario, password) =>
  request('/usuarios/login', { method: 'POST', body: { nombre_usuario, password }, auth: false });

export const verificarToken = () => request('/usuarios/verify', { method: 'POST' });

export const refrescarToken = () => request('/usuarios/refresh', { method: 'POST' });

/** Solo ADMIN. rol ∈ {'ADMIN','EMPLEADO'}. El backend responde 200 (no 201). */
export const registrarUsuario = ({ nombre_usuario, password, rol }) =>
  request('/usuarios/register', { method: 'POST', body: { nombre_usuario, password, rol } });
