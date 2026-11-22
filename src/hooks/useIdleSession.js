import { useEffect, useRef } from 'react';

const EVENTS = ['pointerdown', 'keydown', 'scroll'];

/**
 * Llama a `onActive` cada `intervalMs` solo si hubo actividad del usuario en ese lapso.
 * Sirve para refrescar el JWT antes de la inactividad de 50 min del backend.
 */
export function useIdleSession({ enabled, intervalMs, onActive }) {
  const cb = useRef(onActive);
  useEffect(() => {
    cb.current = onActive;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    let active = false;
    const mark = () => {
      active = true;
    };
    EVENTS.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const id = setInterval(() => {
      if (!active) return;
      active = false;
      cb.current();
    }, intervalMs);
    return () => {
      clearInterval(id);
      EVENTS.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [enabled, intervalMs]);
}
