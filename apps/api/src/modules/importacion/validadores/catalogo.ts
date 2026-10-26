import { TipoCurso } from '@prisma/client';
import { TerminoRequisito, parsearRequisitos } from '../../elegibilidad/motor';
import { HojaLeida, Valor, texto } from '../excel';
import { FilaPreview, RE_CODIGO_CURSO, ResultadoValidacion } from './tipos';

export const COLUMNAS_CATALOGO = ['codigo', 'nombre', 'creditos', 'tipo'];
export const COLUMNAS_CATALOGO_OPCIONALES = ['ciclo', 'grupo', 'requisitos', 'descripcion'];

const TIPOS: TipoCurso[] = ['OBLIGATORIO', 'ELECTIVO', 'ELECTIVO_GENERALES', 'ELECTIVO_LIBRE'];
const GRUPOS = ['EH1', 'EH2', 'TEO'];

export interface CursoImportado {
  codigo: string;
  nombre: string;
  creditos: number;
  tipo: TipoCurso;
  ciclo: number | null;
  grupo: string | null;
  requisitos: string | null;
  descripcion: string | null;
  /** Solo para ELECTIVO: términos ya parseados. */
  terminos: TerminoRequisito[];
}

/** Decimal desde número o texto ("4.5" o "4,5"). */
export function numero(v: Valor): number | null {
  if (v === null) return null;
  if (typeof v === 'number') return v;
  const limpio = v.replace(',', '.').trim();
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null;
}

export function validarCatalogo(hoja: HojaLeida): ResultadoValidacion<CursoImportado> {
  const filas: FilaPreview<CursoImportado>[] = [];
  const advertenciasGenerales = [...hoja.advertenciasGenerales];
  const primeraFilaPorCodigo = new Map<string, number>();

  for (const { fila, valores } of hoja.filas) {
    const errores: string[] = [];
    const advertencias: string[] = [];

    const codigo = (texto(valores.codigo) ?? '').toUpperCase();
    if (!codigo) errores.push('Falta el código');
    else if (!RE_CODIGO_CURSO.test(codigo)) errores.push(`Código "${codigo}" inválido: deben ser 6 letras o dígitos`);
    else if (primeraFilaPorCodigo.has(codigo)) {
      errores.push(`Código duplicado (ya aparece en la fila ${primeraFilaPorCodigo.get(codigo)})`);
    } else primeraFilaPorCodigo.set(codigo, fila);

    const nombre = texto(valores.nombre) ?? '';
    if (!nombre) errores.push('Falta el nombre');
    else if (nombre.length > 200) errores.push('El nombre supera los 200 caracteres');

    const creditos = numero(valores.creditos);
    if (valores.creditos === null) errores.push('Faltan los créditos');
    else if (creditos === null || creditos < 0) errores.push(`Créditos "${valores.creditos}" inválidos: debe ser un decimal ≥ 0`);
    else if (creditos > 99.99) errores.push('Créditos fuera de rango (máximo 99.99)');
    else if (Math.abs(Math.round(creditos * 100) - creditos * 100) > 1e-6) errores.push('Los créditos admiten como máximo 2 decimales');

    const tipoTexto = (texto(valores.tipo) ?? '').toUpperCase();
    const tipo = TIPOS.includes(tipoTexto as TipoCurso) ? (tipoTexto as TipoCurso) : null;
    if (!tipoTexto) errores.push('Falta el tipo');
    else if (!tipo) errores.push(`Tipo "${tipoTexto}" inválido: use ${TIPOS.join(', ')}`);

    let ciclo: number | null = null;
    if (valores.ciclo !== null) {
      const n = numero(valores.ciclo);
      if (n === null || !Number.isInteger(n) || n < 1 || n > 10) errores.push(`Ciclo "${valores.ciclo}" inválido: entero de 1 a 10`);
      else ciclo = n;
    }

    let grupo: string | null = (texto(valores.grupo) ?? '').toUpperCase() || null;
    if (grupo && !GRUPOS.includes(grupo)) {
      errores.push(`Grupo "${grupo}" inválido: use EH1, EH2 o TEO`);
    } else if (grupo && tipo && tipo !== 'ELECTIVO_GENERALES') {
      advertencias.push('El grupo solo aplica a ELECTIVO_GENERALES: se ignora');
      grupo = null;
    }

    const requisitos = texto(valores.requisitos);
    let terminos: TerminoRequisito[] = [];
    // Solo se parsean y evalúan los requisitos de los ELECTIVO; los demás son texto informativo.
    if (tipo === 'ELECTIVO' && requisitos) {
      const parseo = parsearRequisitos(requisitos);
      terminos = parseo.terminos;
      errores.push(...parseo.errores.map((e) => e.mensaje));
    }

    filas.push({
      fila,
      datos: {
        codigo,
        nombre,
        creditos: creditos ?? 0,
        tipo: tipo ?? 'OBLIGATORIO',
        ciclo,
        grupo,
        requisitos,
        descripcion: texto(valores.descripcion),
        terminos,
      },
      errores,
      advertencias,
    });
  }

  // Requisitos de electivos que apuntan a cursos fuera del archivo: válidos, pero se avisa.
  for (const f of filas) {
    const ausentes = f.datos.terminos
      .map((t) => t.cursoRequerido)
      .filter((c): c is string => !!c && !primeraFilaPorCodigo.has(c));
    if (ausentes.length) {
      f.advertencias.push(`Requisito${ausentes.length > 1 ? 's' : ''} fuera del catálogo: ${ausentes.join(', ')}`);
    }
  }

  if (!filas.some((f) => f.datos.tipo === 'ELECTIVO' && !f.errores.length)) {
    advertenciasGenerales.push('El archivo no contiene cursos ELECTIVO: no habrá nada que votar');
  }
  return { filas, erroresGenerales: [...hoja.erroresGenerales], advertenciasGenerales };
}
