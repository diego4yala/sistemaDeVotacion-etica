/** Nota mínima aprobatoria. */
export const NOTA_APROBATORIA = 11;

/** Nota mínima para el requisito `(X)` (haber cursado con 08 o más). */
export const NOTA_MIN_CURSADO = 8;

/** Tope de créditos de ELECTIVO_LIBRE que cuentan (nota ** del plan de estudios). */
export const TOPE_CREDITOS_LIBRE = 12;

/**
 * "Cursar simultáneamente" se refiere al próximo ciclo, y el sistema no puede saberlo.
 * Con `false`, `[X]` y `{X}` se evalúan como si X debiera estar aprobado/cursado o en curso.
 * Con `true`, se aceptan siempre. Ver la decisión en la sección 6.1 de la especificación.
 */
export const SIMULTANEO_PERMISIVO = false;
