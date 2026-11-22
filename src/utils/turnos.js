const MAX_FEED = 12;

export const INITIAL_WS_STATE = {
  queue: [],
  liveAssignments: {},
  feed: [],
};

/** Un turno sigue abierto mientras `close_hour` sea null/vacío. */
export function isTurnOpen(turno) {
  return Boolean(turno) && (turno.close_hour === null || turno.close_hour === undefined || turno.close_hour === '');
}

/** Parsea de forma segura un frame JSON del WebSocket `/ws`; devuelve null si es inválido. */
export function parseWsEvent(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.event !== 'string') return null;
    return { event: parsed.event, payload: parsed.payload ?? {} };
  } catch {
    return null;
  }
}

/**
 * Aplica un evento broadcast de Turnos (`join_reply`, `asign`, `release_reply`)
 * sobre el estado en vivo del tablero sin mutar el estado previo.
 */
export function applyWsEvent(state, msg, nowIso = new Date().toISOString()) {
  if (!msg?.event) return state;
  const payload = msg.payload && typeof msg.payload === 'object' ? msg.payload : {};

  if (msg.event === 'join_reply') {
    const turn = Number(payload.turn);
    const clientId = Number(payload.client_id);
    if (!Number.isFinite(clientId)) return state;

    const alreadyQueued = state.queue.some((q) => q.turn === turn && q.client_id === clientId);
    const queue = alreadyQueued
      ? state.queue
      : [...state.queue, { turn: Number.isFinite(turn) ? turn : null, client_id: clientId, at: nowIso }];

    const item = {
      key: `join-${turn}-${clientId}-${nowIso}`,
      kind: 'join',
      turn: Number.isFinite(turn) ? turn : null,
      client_id: clientId,
      at: nowIso,
    };
    return { ...state, queue, feed: [item, ...state.feed].slice(0, MAX_FEED) };
  }

  if (msg.event === 'asign') {
    const clientId = Number(payload.client);
    const machineId = Number(payload.machine);
    const storedId = Number(payload.stored_id);
    if (!Number.isFinite(machineId)) return state;

    let removed = false;
    const queue = state.queue.filter((q) => {
      if (!removed && q.client_id === clientId) {
        removed = true;
        return false;
      }
      return true;
    });

    const liveAssignments = {
      ...state.liveAssignments,
      [machineId]: {
        id: Number.isFinite(storedId) ? storedId : null,
        machine_id: machineId,
        client_id: Number.isFinite(clientId) ? clientId : null,
        start_hour: nowIso,
        close_hour: null,
        source: 'ws',
      },
    };

    const item = {
      key: `asign-${storedId}-${machineId}-${nowIso}`,
      kind: 'asign',
      stored_id: Number.isFinite(storedId) ? storedId : null,
      machine_id: machineId,
      client_id: Number.isFinite(clientId) ? clientId : null,
      at: nowIso,
    };
    return { queue, liveAssignments, feed: [item, ...state.feed].slice(0, MAX_FEED) };
  }

  if (msg.event === 'release_reply') {
    const machineId = Number(payload.machine);
    if (!Number.isFinite(machineId)) return state;

    const liveAssignments = { ...state.liveAssignments };
    delete liveAssignments[machineId];

    const item = {
      key: `release-${machineId}-${nowIso}`,
      kind: 'release',
      machine_id: machineId,
      at: nowIso,
    };
    return { ...state, liveAssignments, feed: [item, ...state.feed].slice(0, MAX_FEED) };
  }

  return state;
}

/**
 * Cruza los turnos abiertos de REST (`close_hour === null`) con las asignaciones
 * en vivo recibidas por WebSocket, devolviendo un mapa `{ [machine_id]: turno }`.
 */
export function buildActiveTurnsMap(restTurnos = [], liveAssignments = {}) {
  const closedIds = new Set();
  const byMachine = {};

  for (const t of Array.isArray(restTurnos) ? restTurnos : []) {
    if (!t) continue;
    if (!isTurnOpen(t)) {
      if (t.id !== undefined && t.id !== null) closedIds.add(Number(t.id));
      continue;
    }
    const mid = Number(t.machine_id);
    if (!Number.isFinite(mid)) continue;
    const prev = byMachine[mid];
    if (!prev || Number(t.id ?? 0) >= Number(prev.id ?? 0)) {
      byMachine[mid] = t;
    }
  }

  for (const [midKey, live] of Object.entries(liveAssignments ?? {})) {
    if (!live) continue;
    const mid = Number(live.machine_id ?? midKey);
    if (!Number.isFinite(mid)) continue;
    if (live.id !== null && live.id !== undefined && closedIds.has(Number(live.id))) continue;
    const prev = byMachine[mid];
    if (!prev || Number(live.id ?? 0) >= Number(prev.id ?? 0)) {
      byMachine[mid] = live;
    }
  }

  return byMachine;
}
