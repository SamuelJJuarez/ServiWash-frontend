import { useEffect, useRef, useState } from 'react';
import { getTurnosWsUrl } from '../api/turnos.api.js';
import { INITIAL_WS_STATE, applyWsEvent, parseWsEvent } from '../utils/turnos.js';

const BASE_RECONNECT_MS = 3_000;
const MAX_RECONNECT_MS = 30_000;

/**
 * Conexión pasiva (solo lectura) al WebSocket `/ws` de Turnos con reconexión exponencial.
 * Si el WS no está disponible o cae, degrada limpiamente a modo `polling` sin lanzar errores.
 * Nunca envía `join` para no registrar clientes ficticios en la cola del servidor.
 */
export function useTurnosSocket({ enabled = true, onSync } = {}) {
  const [wsStatus, setWsStatus] = useState(enabled ? 'connecting' : 'polling');
  const [wsState, setWsState] = useState(INITIAL_WS_STATE);
  const onSyncRef = useRef(onSync);

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    if (!enabled || typeof WebSocket === 'undefined') {
      setWsStatus('polling');
      return undefined;
    }

    let cancelled = false;
    let socket = null;
    let reconnectTimer = null;
    let attempt = 0;

    const scheduleReconnect = () => {
      if (cancelled) return;
      const delay = Math.min(BASE_RECONNECT_MS * 2 ** attempt, MAX_RECONNECT_MS);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (cancelled) return;
      setWsStatus((prev) => (prev === 'live' ? 'live' : 'connecting'));

      try {
        socket = new WebSocket(getTurnosWsUrl());
      } catch {
        setWsStatus('polling');
        scheduleReconnect();
        return;
      }

      socket.onopen = () => {
        if (cancelled) {
          socket?.close();
          return;
        }
        attempt = 0;
        setWsStatus('live');
      };

      socket.onmessage = (evt) => {
        if (cancelled) return;
        const parsed = parseWsEvent(evt.data);
        if (!parsed) return;
        setWsState((prev) => applyWsEvent(prev, parsed));
        if (parsed.event === 'asign' || parsed.event === 'release_reply') {
          onSyncRef.current?.();
        }
      };

      socket.onerror = () => {
        if (!cancelled) setWsStatus('polling');
      };

      socket.onclose = () => {
        if (cancelled) return;
        setWsStatus('polling');
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
        }
      }
    };
  }, [enabled]);

  return {
    wsStatus,
    queue: wsState.queue,
    liveAssignments: wsState.liveAssignments,
    feed: wsState.feed,
  };
}
