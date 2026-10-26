import { Injectable, NotFoundException } from '@nestjs/common';
import { Db, ElegibilidadRepository } from './elegibilidad.repository';
import {
  ContextoAlumno,
  CursoCatalogo,
  HistorialEntrada,
  NOTA_APROBATORIA,
  ResultadoElegibilidad,
  TerminoRequisito,
  calcularCreditos,
  evaluarElegibilidad,
  resumirHistorial,
} from './motor';

export interface ElectivoCatalogo {
  codigo: string;
  nombre: string;
  creditos: number;
  ciclo: number | null;
  descripcion: string | null;
  requisitosTexto: string | null;
  terminos: TerminoRequisito[];
}

export interface Catalogo {
  cursos: Map<string, CursoCatalogo & { nombre: string }>;
  electivos: ElectivoCatalogo[];
}

/** Etiqueta informativa: el alumno puede votar por un electivo que ya aprobó o está llevando. */
export type EstadoPropio = 'APROBADO' | 'EN_CURSO' | null;

export interface ElectivoEvaluado extends Omit<ElectivoCatalogo, 'terminos'> {
  elegibilidad: ResultadoElegibilidad;
  estadoPropio: EstadoPropio;
}

/**
 * Calcula la elegibilidad al vuelo a partir del catálogo y del historial del proceso.
 * Toda la lógica de reglas vive en ./motor (puro y con tests); aquí solo se cargan datos.
 */
@Injectable()
export class ElegibilidadService {
  constructor(private readonly repo: ElegibilidadRepository) {}

  async cargarCatalogo(db?: Db): Promise<Catalogo> {
    const filas = await this.repo.cursosConRequisitos(db);
    const cursos: Catalogo['cursos'] = new Map();
    const electivos: ElectivoCatalogo[] = [];
    for (const c of filas) {
      const creditos = Number(c.creditos);
      cursos.set(c.codigo, { codigo: c.codigo, nombre: c.nombre, creditos, tipo: c.tipo });
      if (c.tipo !== 'ELECTIVO') continue;
      electivos.push({
        codigo: c.codigo,
        nombre: c.nombre,
        creditos,
        ciclo: c.ciclo,
        descripcion: c.descripcion,
        requisitosTexto: c.requisitosTexto,
        terminos: c.requisitos.map((r) => ({
          texto: r.texto,
          tipo: r.tipo,
          ...(r.cursoRequerido ? { cursoRequerido: r.cursoRequerido } : {}),
          ...(r.creditosMinimos !== null ? { creditosMinimos: r.creditosMinimos } : {}),
        })),
      });
    }
    return { cursos, electivos };
  }

  construirContexto(entradas: HistorialEntrada[], catalogo: Catalogo): ContextoAlumno {
    const historial = resumirHistorial(entradas);
    return { historial, creditos: calcularCreditos(historial, catalogo.cursos) };
  }

  async contextoAlumno(procesoId: string, usuarioId: string, catalogo?: Catalogo, db?: Db) {
    const cat = catalogo ?? (await this.cargarCatalogo(db));
    const entradas = await this.repo.historialDeAlumno(procesoId, usuarioId, db);
    return { catalogo: cat, entradas, contexto: this.construirContexto(entradas, cat) };
  }

  evaluar(electivo: ElectivoCatalogo, contexto: ContextoAlumno): ElectivoEvaluado {
    const { terminos, ...datos } = electivo;
    const estado = contexto.historial.get(electivo.codigo);
    let estadoPropio: EstadoPropio = null;
    if (estado?.notaMax !== null && estado?.notaMax !== undefined && estado.notaMax >= NOTA_APROBATORIA) {
      estadoPropio = 'APROBADO';
    } else if (estado?.enCurso) {
      estadoPropio = 'EN_CURSO';
    }
    return { ...datos, elegibilidad: evaluarElegibilidad(terminos, contexto), estadoPropio };
  }

  /** Todos los electivos con su aptitud para el alumno. */
  async evaluarAlumno(procesoId: string, usuarioId: string) {
    const { catalogo, entradas, contexto } = await this.contextoAlumno(procesoId, usuarioId);
    return {
      creditos: contexto.creditos,
      entradas,
      contexto,
      catalogo,
      electivos: catalogo.electivos.map((e) => this.evaluar(e, contexto)),
    };
  }

  /** Aptitud de un solo electivo (para validar un voto; acepta la transacción en curso). */
  async evaluarElectivo(procesoId: string, usuarioId: string, codigo: string, db?: Db): Promise<ElectivoEvaluado> {
    const { catalogo, contexto } = await this.contextoAlumno(procesoId, usuarioId, undefined, db);
    const electivo = catalogo.electivos.find((e) => e.codigo === codigo);
    if (!electivo) throw new NotFoundException(`El curso ${codigo} no es un electivo del catálogo`);
    return this.evaluar(electivo, contexto);
  }

  /** Créditos aprobados y en curso de todos los alumnos con historial en el proceso. */
  async creditosPorAlumno(procesoId: string, catalogo?: Catalogo) {
    const cat = catalogo ?? (await this.cargarCatalogo());
    const filas = await this.repo.historialDeProceso(procesoId);
    const porAlumno = new Map<string, HistorialEntrada[]>();
    for (const f of filas) {
      const lista = porAlumno.get(f.usuarioId) ?? [];
      lista.push(f);
      porAlumno.set(f.usuarioId, lista);
    }
    const resultado = new Map<string, { aprobados: number; enCurso: number }>();
    for (const [usuarioId, entradas] of porAlumno) {
      resultado.set(usuarioId, this.construirContexto(entradas, cat).creditos);
    }
    return resultado;
  }
}
