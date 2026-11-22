const METRICA_TICKET = {
  PAGO_POR_KILO: 'KILO',
  SERVICIO_POR_KILO: 'KILO',
  PAGO_POR_USO: 'USO',
  SERVICIO_POR_USO: 'USO',
  PAGO_POR_PRENDA_ESPECIAL: 'PRENDA_ESPECIAL',
  SERVICIO_POR_PRENDA_ESPECIAL: 'PRENDA_ESPECIAL',
};

const TIPO_A_METRICA = {
  SERVICIO_POR_KILO: 'PAGO_POR_KILO',
  SERVICIO_POR_USO: 'PAGO_POR_USO',
  SERVICIO_POR_PRENDA_ESPECIAL: 'PAGO_POR_PRENDA_ESPECIAL',
};

/** Catálogo (tipo_servicio o metrica_cobro) -> metrica_cobro de Ticket (KILO|USO|PRENDA_ESPECIAL). */
export function toTicketMetrica(valor) {
  const m = METRICA_TICKET[valor];
  if (!m) throw new Error(`Métrica de cobro desconocida: ${valor}`);
  return m;
}

/** tipo_servicio -> metrica_cobro del catálogo (para mantenerlos sincronizados). */
export function metricaDeTipo(tipo) {
  return TIPO_A_METRICA[tipo];
}
