const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

/** Importe en MXN. Acepta number o string numérico. */
export function formatMXN(valor) {
  const n = Number(valor);
  return mxn.format(Number.isFinite(n) ? n : 0);
}

const TIPO_SERVICIO_LABEL = {
  SERVICIO_POR_KILO: 'Lavado por Kilo',
  SERVICIO_POR_USO: 'Autolavado por Uso',
  SERVICIO_POR_PRENDA_ESPECIAL: 'Prenda Especial / Tintorería',
};

const METRICA_COBRO_LABEL = {
  PAGO_POR_KILO: 'Cobro por kilo',
  PAGO_POR_USO: 'Cobro por uso (ciclo 40 min)',
  PAGO_POR_PRENDA_ESPECIAL: 'Cobro por prenda especial',
};

const ESTADO_MAQUINA_LABEL = {
  DISPONIBLE: 'Disponible',
  OCUPADA: 'Ocupada',
  EN_MANTENIMIENTO: 'En mantenimiento',
};

export const labelTipoServicio = (v) => TIPO_SERVICIO_LABEL[v] ?? v;
export const labelMetricaCobro = (v) => METRICA_COBRO_LABEL[v] ?? v;
export const labelEstadoMaquina = (v) => ESTADO_MAQUINA_LABEL[v] ?? v;

const pad2 = (n) => String(n).padStart(2, '0');

/** Date -> valor de <input type="datetime-local"> (YYYY-MM-DDTHH:MM, hora local). */
export function toLocalDateTimeInput(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Valor de datetime-local -> ISO con segundos (YYYY-MM-DDTHH:MM:SS) que exige /cotizar/uso y Ticket. */
export function toIsoSeconds(datetimeLocal) {
  if (!datetimeLocal) return '';
  return datetimeLocal.length === 16 ? `${datetimeLocal}:00` : datetimeLocal;
}

/** Rango por defecto para servicios por uso: ahora → ahora + `minutos`. */
export function defaultTimeRange(minutos = 45) {
  const now = new Date();
  now.setSeconds(0, 0);
  const later = new Date(now.getTime() + minutos * 60 * 1000);
  return { inicio: toLocalDateTimeInput(now), fin: toLocalDateTimeInput(later) };
}

/** Fecha local YYYY-MM-DD de un ISO (para filtrar por día). '' si es inválida. */
export function localDateKey(valor) {
  const d = new Date(valor ?? '');
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Formatea fechas de forma segura. Tolera el bug de Turnos
 * ("dd/mm/yyyy HH:MM:SS" literal) devolviendo el texto original; nunca lanza.
 */
export function formatFecha(valor) {
  if (valor === null || valor === undefined || valor === '') return '—';
  try {
    if (typeof valor === 'string' && /HH:MM:SS/.test(valor)) return valor;
    const m = typeof valor === 'string' && valor.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}):(\d{2}))?$/);
    const d = m
      ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0))
      : new Date(valor);
    if (Number.isNaN(d.getTime())) return String(valor);
    return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return String(valor);
  }
}
