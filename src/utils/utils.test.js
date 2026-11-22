import test from 'node:test';
import assert from 'node:assert/strict';
import { toTicketMetrica, metricaDeTipo } from './mappers.js';
import { formatMXN, formatFecha, localDateKey, toIsoSeconds } from './formatters.js';
import { getJwtInfo } from './jwt.js';
import { normalizarTicket } from '../api/tickets.api.js';
import {
  INITIAL_WS_STATE,
  applyWsEvent,
  buildActiveTurnsMap,
  isTurnOpen,
  parseWsEvent,
} from './turnos.js';
import { mapRegisterError, validateUsuarioForm } from './usuarios.js';

test('mappers', () => {
  assert.equal(toTicketMetrica('PAGO_POR_KILO'), 'KILO');
  assert.equal(toTicketMetrica('SERVICIO_POR_USO'), 'USO');
  assert.equal(toTicketMetrica('PAGO_POR_PRENDA_ESPECIAL'), 'PRENDA_ESPECIAL');
  assert.throws(() => toTicketMetrica('X'));
  assert.equal(metricaDeTipo('SERVICIO_POR_KILO'), 'PAGO_POR_KILO');
});

test('formatters', () => {
  assert.match(formatMXN('310'), /310\.00/);
  assert.equal(formatMXN(undefined).includes('0.00'), true);
  assert.equal(formatFecha('21/11/2026 HH:MM:SS'), '21/11/2026 HH:MM:SS');
  assert.equal(formatFecha(null), '—');
  assert.doesNotThrow(() => formatFecha('basura'));
});

test('jwt', () => {
  const p = Buffer.from(JSON.stringify({ sub: '7', rol: 'ADMIN', exp: 1 })).toString('base64url');
  assert.deepEqual(getJwtInfo(`a.${p}.c`), { id: 7, rol: 'ADMIN', exp: 1 });
  assert.equal(getJwtInfo('mal'), null);
});

test('tickets: importes string -> Number y fechas', () => {
  const t = normalizarTicket({
    id: 2,
    cobro_total: '610.00',
    metodo_pago: 'EFECTIVO',
    monto_recibido: '1000',
    cambio_entregado: '390.00',
    clientes_id: 1,
    usuarios_id: 1,
    detalles: [{ servicios_id: 1, cantidad: '5.0', subtotal: '160.00' }],
  });
  assert.equal(t.cobro_total, 610);
  assert.equal(t.monto_recibido, 1000);
  assert.equal(t.cambio_entregado, 390);
  assert.deepEqual(t.detalles[0], { servicios_id: 1, cantidad: 5, subtotal: 160 });
  assert.equal(toIsoSeconds('2026-10-29T12:00'), '2026-10-29T12:00:00');
  assert.equal(localDateKey('basura'), '');
  assert.equal(localDateKey(new Date(2026, 10, 21, 23, 0).toISOString()), '2026-11-21');
});

test('turnos: eventos WS y cruce de turnos activos', () => {
  assert.equal(parseWsEvent('no-json'), null);
  assert.equal(parseWsEvent('{}'), null);
  assert.deepEqual(
    parseWsEvent(JSON.stringify({ event: 'join_reply', payload: { turn: 1, client_id: 12 } })),
    { event: 'join_reply', payload: { turn: 1, client_id: 12 } },
  );

  let state = INITIAL_WS_STATE;
  state = applyWsEvent(state, { event: 'join_reply', payload: { turn: 1, client_id: 12 } }, '2026-11-22T10:00:00Z');
  state = applyWsEvent(state, { event: 'join_reply', payload: { turn: 1, client_id: 12 } }, '2026-11-22T10:00:01Z');
  assert.equal(state.queue.length, 1);
  assert.equal(state.queue[0].client_id, 12);

  state = applyWsEvent(
    state,
    { event: 'asign', payload: { client: 12, machine: 2, stored_id: 45 } },
    '2026-11-22T10:01:00Z',
  );
  assert.equal(state.queue.length, 0);
  assert.equal(state.liveAssignments[2].id, 45);
  assert.equal(state.liveAssignments[2].client_id, 12);

  const restTurnos = [
    { id: 40, machine_id: 1, client_id: 5, start_hour: '22/11/2026 HH:MM:SS', close_hour: null },
    { id: 45, machine_id: 2, client_id: 12, start_hour: '22/11/2026 10:01:00', close_hour: '22/11/2026 10:41:00' },
  ];
  const activos = buildActiveTurnsMap(restTurnos, state.liveAssignments);
  assert.equal(isTurnOpen(restTurnos[0]), true);
  assert.equal(isTurnOpen(restTurnos[1]), false);
  assert.equal(activos[1].id, 40);
  assert.equal(activos[2], undefined);

  state = applyWsEvent(state, { event: 'release_reply', payload: { machine: 2 } }, '2026-11-22T10:42:00Z');
  assert.equal(state.liveAssignments[2], undefined);
  assert.equal(state.feed[0].kind, 'release');
});

test('usuarios: validación de formulario y mapeo de errores register', () => {
  const vacio = validateUsuarioForm({
    nombre_usuario: '   ',
    password: '123',
    confirmPassword: '456',
    rol: 'OTRO',
  });
  assert.equal(vacio.payload, null);
  assert.ok(vacio.fieldErrors.nombre_usuario);
  assert.ok(vacio.fieldErrors.password);
  assert.ok(vacio.fieldErrors.confirmPassword);
  assert.ok(vacio.fieldErrors.rol);

  for (const invalido of ['ab', 'ab1', '1abc', '123', 'ab1c', 'juan perez']) {
    const res = validateUsuarioForm({
      nombre_usuario: invalido,
      password: 'Password123',
      confirmPassword: 'Password123',
      rol: 'EMPLEADO',
    });
    assert.equal(res.payload, null, `Debió rechazar "${invalido}"`);
    assert.ok(res.fieldErrors.nombre_usuario, `Debió indicar error en "${invalido}"`);
  }

  for (const valido of ['abc', '  cajero1  ', 'empleado12']) {
    const res = validateUsuarioForm({
      nombre_usuario: valido,
      password: 'Password123',
      confirmPassword: 'Password123',
      rol: 'ADMIN',
    });
    assert.deepEqual(res.fieldErrors, {}, `Debió aceptar "${valido}"`);
    assert.equal(res.payload.nombre_usuario, valido.trim());
  }

  assert.equal(mapRegisterError({ status: 409 }).field, 'nombre_usuario');
  assert.match(mapRegisterError({ status: 409 }).message, /ya está registrado/i);
  assert.match(mapRegisterError({ status: 403 }).message, /administrador/i);
  assert.match(mapRegisterError({ status: 400 }).message, /inválidos/i);
  assert.equal(mapRegisterError({ status: 503 }).unavailable, true);
  assert.equal(mapRegisterError({ status: 0 }).unavailable, true);
});
