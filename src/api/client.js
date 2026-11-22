const TOKEN_KEY = 'serviwash_token';

let onUnauthorized = null;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

/** Registra el callback global ante 401 (cierre de sesión limpio). */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.serviceUnavailable = status === 503;
  }
}

/**
 * Cliente HTTP central. `path` relativo a /api/v1 (ej. '/servicios/', '/maquinas/2/estado').
 * Colecciones con barra final; con ID o subruta sin barra.
 * Opciones: { method, body, params, auth = true }
 */
export async function request(path, { method = 'GET', body, params, auth = true } = {}) {
  let url = `/api/v1${path}`;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0, null);
  }

  let data = null;
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.error ?? data?.['error:'] ?? data?.detail ?? data?.msg ?? res.statusText;
    const text =
      typeof message === 'string'
        ? message
        : message
          ? JSON.stringify(message)
          : res.status === 503
            ? 'El servicio no está disponible'
            : `Error ${res.status}`;
    if (res.status === 401 && auth && onUnauthorized) onUnauthorized();
    throw new ApiError(text, res.status, data);
  }

  return data;
}
