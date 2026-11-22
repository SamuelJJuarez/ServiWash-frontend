import { useCallback, useState } from 'react';

// ADR-03: Ticket no expone GET, así que el historial vive en este navegador.
const KEY = 'serviwash_recent_tickets';
const MAX = 200;

function leer() {
  try {
    const lista = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(lista) ? lista : [];
  } catch {
    return [];
  }
}

/** Historial local de tickets (más reciente primero, máx. 200). */
export function useLocalTickets() {
  const [tickets, setTickets] = useState(leer);

  /** Guarda un ticket (con `guardado_en` ISO y `cobro_total` numérico). Devuelve false si no hubo espacio. */
  const guardar = useCallback((ticket) => {
    const lista = [ticket, ...leer()].slice(0, MAX);
    setTickets(lista);
    try {
      localStorage.setItem(KEY, JSON.stringify(lista));
      return true;
    } catch {
      return false;
    }
  }, []);

  const vaciar = useCallback(() => {
    localStorage.removeItem(KEY);
    setTickets([]);
  }, []);

  return { tickets, guardar, vaciar };
}
