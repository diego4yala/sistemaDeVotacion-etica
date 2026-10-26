import { ErrorParseo, ResultadoParseo, TerminoRequisito } from './tipos';

const RE_CURSO = /^[0-9A-Z]{6}$/;
const RE_CURSADO_MIN_8 = /^\(([0-9A-Z]{6})\)$/;
const RE_APROBADO_O_SIMULTANEO = /^\[([0-9A-Z]{6})\]$/;
const RE_CURSADO_O_SIMULTANEO = /^\{([0-9A-Z]{6})\}$/;
const RE_CREDITOS = /^(\d+)\s*cr[eé]ditos\s+aprobados\s*\*?$/i;

/** Reconoce un único término. Devuelve null si no coincide con ninguna notación. */
export function parsearTermino(termino: string): TerminoRequisito | null {
  const texto = termino.trim().replace(/\s+/g, ' ');
  const mayus = texto.toUpperCase();

  const creditos = RE_CREDITOS.exec(texto);
  if (creditos) {
    return { texto, tipo: 'CREDITOS_MIN', creditosMinimos: Number(creditos[1]) };
  }

  let m = RE_CURSADO_MIN_8.exec(mayus);
  if (m) return { texto, tipo: 'CURSADO_NOTA_MIN_8', cursoRequerido: m[1] };

  m = RE_APROBADO_O_SIMULTANEO.exec(mayus);
  if (m) return { texto, tipo: 'APROBADO_O_SIMULTANEO', cursoRequerido: m[1] };

  m = RE_CURSADO_O_SIMULTANEO.exec(mayus);
  if (m) return { texto, tipo: 'CURSADO_O_SIMULTANEO', cursoRequerido: m[1] };

  if (RE_CURSO.test(mayus)) return { texto, tipo: 'APROBADO', cursoRequerido: mayus };

  return null;
}

/**
 * Parsea el texto de la columna `requisitos` (notación PUCP separada por comas).
 * Los términos se combinan con AND. Un texto vacío equivale a "sin requisitos".
 */
export function parsearRequisitos(texto: string | null | undefined): ResultadoParseo {
  const terminos: TerminoRequisito[] = [];
  const errores: ErrorParseo[] = [];
  const limpio = (texto ?? '').trim();
  if (!limpio || limpio === '—' || limpio === '-') return { terminos, errores };

  for (const fragmento of limpio.split(',')) {
    const termino = fragmento.trim();
    if (!termino) continue; // coma sobrante: no aporta ningún requisito
    const parseado = parsearTermino(termino);
    if (parseado) {
      terminos.push(parseado);
    } else {
      errores.push({ termino, mensaje: `Término de requisito no reconocido: "${termino}"` });
    }
  }
  return { terminos, errores };
}
