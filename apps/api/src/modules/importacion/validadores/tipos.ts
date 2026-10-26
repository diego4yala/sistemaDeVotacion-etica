export interface FilaPreview<T> {
  fila: number;
  datos: T;
  errores: string[];
  advertencias: string[];
}

export interface ResultadoValidacion<T> {
  filas: FilaPreview<T>[];
  erroresGenerales: string[];
  advertenciasGenerales: string[];
}

export const RE_CODIGO_CURSO = /^[0-9A-Z]{6}$/;
export const RE_CODIGO_ALUMNO = /^\d{8}$/;
