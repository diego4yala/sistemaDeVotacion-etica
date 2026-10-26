import { Injectable, NotFoundException } from '@nestjs/common';
import { Franja } from '@prisma/client';
import { FRANJAS } from '../../common/franjas';
import { ElegibilidadService } from '../elegibilidad/elegibilidad.service';
import { NOTA_APROBATORIA } from '../elegibilidad/motor';
import { ProcesosService } from '../procesos/procesos.service';
import { PadronRepository } from './padron.repository';

const ordenFranja = (f: Franja) => FRANJAS.findIndex((x) => x.valor === f);

@Injectable()
export class PadronService {
  constructor(
    private readonly repo: PadronRepository,
    private readonly procesos: ProcesosService,
    private readonly elegibilidad: ElegibilidadService,
  ) {}

  async listar(procesoId?: string) {
    const proceso = await this.procesos.resolver(procesoId);
    const [filas, creditos] = await Promise.all([
      this.repo.alumnosDelProceso(proceso.id),
      this.elegibilidad.creditosPorAlumno(proceso.id),
    ]);
    return {
      proceso: { id: proceso.id, nombre: proceso.nombre, maxCursos: proceso.maxCursos },
      alumnos: filas.map(({ usuario: u }) => ({
        codigo: u.codigo,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo: u.correo,
        creditosAprobados: creditos.get(u.id)?.aprobados ?? 0,
        creditosEnCurso: creditos.get(u.id)?.enCurso ?? 0,
        votos: u._count.votos,
        tieneHistorial: u._count.historial > 0,
        terminosAceptados: u.aceptaciones.length > 0,
      })),
    };
  }

  /** Historial, créditos y aptitud por electivo de un alumno (sirve para verificar el motor). */
  async detalle(codigo: string, procesoId?: string) {
    const proceso = await this.procesos.resolver(procesoId);
    const alumno = await this.repo.alumnoEnProceso(proceso.id, codigo);
    if (!alumno) throw new NotFoundException('El alumno no está en el padrón de este proceso');

    const [evaluacion, votos] = await Promise.all([
      this.elegibilidad.evaluarAlumno(proceso.id, alumno.id),
      this.repo.votosDeAlumno(proceso.id, alumno.id),
    ]);

    const notasPorCurso = new Map<string, (number | null)[]>();
    for (const e of evaluacion.entradas) {
      const lista = notasPorCurso.get(e.cursoCodigo) ?? [];
      lista.push(e.nota);
      notasPorCurso.set(e.cursoCodigo, lista);
    }
    const historial = [...evaluacion.contexto.historial.entries()]
      .map(([cursoCodigo, estado]) => {
        const curso = evaluacion.catalogo.cursos.get(cursoCodigo);
        return {
          cursoCodigo,
          cursoNombre: curso?.nombre ?? null,
          tipo: curso?.tipo ?? null,
          creditos: curso?.creditos ?? 0,
          enCatalogo: !!curso,
          notas: notasPorCurso.get(cursoCodigo) ?? [],
          notaMax: estado.notaMax,
          enCurso: estado.enCurso,
          aprobado: estado.notaMax !== null && estado.notaMax >= NOTA_APROBATORIA,
        };
      })
      .sort((a, b) => a.cursoCodigo.localeCompare(b.cursoCodigo));

    const votoPorCurso = new Map(votos.map((v) => [v.cursoCodigo, v]));
    return {
      proceso: { id: proceso.id, nombre: proceso.nombre },
      alumno,
      creditos: evaluacion.creditos,
      historial,
      electivos: evaluacion.electivos.map((e) => {
        const voto = votoPorCurso.get(e.codigo);
        return {
          ...e,
          voto: voto
            ? {
                aptitud: voto.aptitud,
                franjas: voto.franjas.map((f) => f.franja).sort((a, b) => ordenFranja(a) - ordenFranja(b)),
                createdAt: voto.createdAt,
              }
            : null,
        };
      }),
    };
  }
}
