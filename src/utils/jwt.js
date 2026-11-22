/** Decodifica el payload de un JWT sin validar firma. Devuelve null si es inválido. */
export function decodeJwt(token) {
  try {
    const part = token.split('.')[1];
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

/** Extrae { id, rol, exp } del token. `id` = Number(sub) (usuarios_id para tickets). */
export function getJwtInfo(token) {
  const p = token ? decodeJwt(token) : null;
  if (!p) return null;
  return { id: Number(p.sub), rol: p.rol ?? p.role ?? null, exp: p.exp ?? null };
}

export function isJwtExpired(token) {
  const info = getJwtInfo(token);
  if (!info || !info.exp) return true;
  return info.exp * 1000 <= Date.now();
}
