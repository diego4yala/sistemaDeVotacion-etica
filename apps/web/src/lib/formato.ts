import type { Aptitud, EstadoProceso, Franja, TipoCurso } from './tipos';

export const FRANJAS: { valor: Franja; etiqueta: string; horario: string }[] = [
  { valor: 'MANANA', etiqueta: 'Mañana', horario: '08:00 – 10:00' },
  { valor: 'MEDIA_MANANA', etiqueta: 'Media mañana', horario: '10:00 – 13:00' },
  { valor: 'MEDIODIA', etiqueta: 'Mediodía', horario: '13:00 – 16:00' },
  { valor: 'TARDE', etiqueta: 'Tarde', horario: '16:00 – 19:00' },
  { valor: 'NOCHE', etiqueta: 'Noche', horario: '19:00 – 22:00' },
];

export const etiquetaFranja = (f: Franja) => FRANJAS.find((x) => x.valor === f)?.etiqueta ?? f;

export const ETIQUETA_APTITUD: Record<Aptitud, string> = {
  CONFIRMADO: 'Confirmado',
  CONDICIONAL: 'Condicional',
  NO_APTO: 'No apto',
};

export const ETIQUETA_ESTADO: Record<EstadoProceso, string> = {
  BORRADOR: 'Borrador',
  ABIERTO: 'Abierto',
  CERRADO: 'Cerrado',
};

export const ETIQUETA_TIPO: Record<TipoCurso, string> = {
  OBLIGATORIO: 'Obligatorio',
  ELECTIVO: 'Electivo',
  ELECTIVO_GENERALES: 'Electivo de EEGG',
  ELECTIVO_LIBRE: 'Libre disponibilidad',
};

const fechaHora = new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
export const formatearFecha = (iso: string) => fechaHora.format(new Date(iso));

export const formatearCreditos = (n: number) =>
  n.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const textoCreditos = (n: number) => `${formatearCreditos(n)} ${n === 1 ? 'crédito' : 'créditos'}`;

/** Valor para <input type="datetime-local"> en hora local. */
export function aInputFecha(iso: string | Date) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
