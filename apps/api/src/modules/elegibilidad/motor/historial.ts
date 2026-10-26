import { NOTA_APROBATORIA, TOPE_CREDITOS_LIBRE } from './constantes';
import { Creditos, CursoCatalogo, HistorialEntrada, HistorialResumido } from './tipos';

/**
 * Consolida las filas del historial: por curso se toma la nota máxima y,
 * si alguna fila tiene la nota vacía, el curso cuenta como "en curso".
 */
export function resumirHistorial(entradas: HistorialEntrada[]): HistorialResumido {
  const resumen: HistorialResumido = new Map();
  for (const { cursoCodigo, nota } of entradas) {
    const codigo = cursoCodigo.trim().toUpperCase();
    const actual = resumen.get(codigo) ?? { notaMax: null, enCurso: false };
    if (nota === null || nota === undefined) {
      actual.enCurso = true;
    } else if (actual.notaMax === null || nota > actual.notaMax) {
      actual.notaMax = nota;
    }
    resumen.set(codigo, actual);
  }
  return resumen;
}

// Los créditos se suman en centésimas para evitar errores de coma flotante (0.75 + 0.5...).
const aCentesimas = (n: number) => Math.round(n * 100);

/**
 * Créditos aprobados = cursos del catálogo con nota máxima ≥ 11.
 * Créditos en curso = cursos del catálogo en curso que aún no están aprobados.
 * ELECTIVO_LIBRE aporta como máximo 12 créditos en total (primero los aprobados).
 * Cursos fuera del catálogo aportan 0.
 */
export function calcularCreditos(
  historial: HistorialResumido,
  catalogo: Map<string, CursoCatalogo>,
): Creditos {
  let aprobados = 0;
  let enCurso = 0;
  let libreAprobados = 0;
  let libreEnCurso = 0;

  for (const [codigo, estado] of historial) {
    const curso = catalogo.get(codigo);
    if (!curso) continue;
    const creditos = aCentesimas(curso.creditos);
    const aprobado = estado.notaMax !== null && estado.notaMax >= NOTA_APROBATORIA;
    const esLibre = curso.tipo === 'ELECTIVO_LIBRE';
    if (aprobado) {
      if (esLibre) libreAprobados += creditos;
      else aprobados += creditos;
    } else if (estado.enCurso) {
      if (esLibre) libreEnCurso += creditos;
      else enCurso += creditos;
    }
  }

  const tope = aCentesimas(TOPE_CREDITOS_LIBRE);
  const libreAprobadosTope = Math.min(libreAprobados, tope);
  const libreEnCursoTope = Math.min(libreEnCurso, tope - libreAprobadosTope);

  return {
    aprobados: (aprobados + libreAprobadosTope) / 100,
    enCurso: (enCurso + libreEnCursoTope) / 100,
  };
}
