import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getToken, setToken, setUnauthorizedHandler } from '../api/client.js';
import { loginUsuario, refrescarToken, verificarToken } from '../api/usuarios.api.js';
import { useIdleSession } from '../hooks/useIdleSession.js';
import { getJwtInfo, isJwtExpired } from '../utils/jwt.js';

const NAME_KEY = 'serviwash_user';
const REFRESH_MS = 37 * 60 * 1000; // entre 35–40 min, antes de la inactividad de 50 min

const AuthContext = createContext(null);

// /verify y el JWT no traen el nombre; se guarda el usado al iniciar sesión.
const buildUser = (id, rol) => ({
  id,
  rol,
  nombre_usuario: localStorage.getItem(NAME_KEY) || `Usuario ${id}`,
});

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => {
    const t = getToken();
    if (t && isJwtExpired(t)) {
      setToken(null);
      return null;
    }
    return t;
  });
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(NAME_KEY);
    setTokenState(null);
    setUser(null);
    setIsLoading(false);
  }, []);

  // Cualquier 401 de la API cierra la sesión.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Verificación inicial del token guardado.
  useEffect(() => {
    const t = getToken();
    if (!t) return undefined;
    let cancelled = false;
    verificarToken()
      .then((d) => {
        if (!cancelled) setUser(buildUser(Number(d.id), d.rol));
      })
      .catch((err) => {
        if (cancelled || err.status === 401) return; // 401: el handler ya cerró sesión
        // Servicio Usuarios caído: se confía en el JWT local (aún vigente).
        const info = getJwtInfo(t);
        if (info) setUser(buildUser(info.id, info.rol));
        else logout();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (nombre_usuario, password) => {
    const data = await loginUsuario(nombre_usuario, password);
    const info = getJwtInfo(data.token);
    setToken(data.token);
    localStorage.setItem(NAME_KEY, nombre_usuario);
    setTokenState(data.token);
    setUser({ id: info?.id, rol: data.rol ?? info?.rol, nombre_usuario });
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await refrescarToken();
      setToken(data.token);
      setTokenState(data.token);
    } catch {
      // 401 cierra sesión vía handler; otros errores se reintentan en el siguiente ciclo.
    }
  }, []);

  useIdleSession({ enabled: Boolean(user), intervalMs: REFRESH_MS, onActive: refreshSession });

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [user, token, isLoading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
