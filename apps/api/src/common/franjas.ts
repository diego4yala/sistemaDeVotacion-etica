import { Franja } from '@prisma/client';

/** Franjas horarias (enum fijo, sección 7). El orden es el de las columnas del mapa de calor. */
export const FRANJAS: { valor: Franja; etiqueta: string; horario: string }[] = [
  { valor: 'MANANA', etiqueta: 'Mañana', horario: '08:00 – 10:00' },
  { valor: 'MEDIA_MANANA', etiqueta: 'Media mañana', horario: '10:00 – 13:00' },
  { valor: 'MEDIODIA', etiqueta: 'Mediodía', horario: '13:00 – 16:00' },
  { valor: 'TARDE', etiqueta: 'Tarde', horario: '16:00 – 19:00' },
  { valor: 'NOCHE', etiqueta: 'Noche', horario: '19:00 – 22:00' },
];

export const FRANJAS_VALORES = FRANJAS.map((f) => f.valor);

export type ConteoFranjas = Record<Franja, number>;

export const conteoFranjasVacio = (): ConteoFranjas =>
  Object.fromEntries(FRANJAS_VALORES.map((f) => [f, 0])) as ConteoFranjas;
