import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Franja, Prisma, ProcesoVotacion } from '@prisma/client';
import { FRANJAS } from '../../common/franjas';
import { TERMINOS_TEXTO, TERMINOS_VERSION } from '../../common/terminos';
import { AuditService } from '../audit/audit.service';
import { ElegibilidadService } from '../elegibilidad/elegibilidad.service';
import { ProcesosService } from '../procesos/procesos.service';
import { ResultadosGateway } from '../resultados/resultados.gateway';
import { EmitirVotoDto } from './votos.dto';
import { VotosRepository } from './votos.repository';

const ordenFranja = (f: Franja) => FRANJAS.findIndex((x) => x.valor === f);

/** Un proceso admite votos si está ABIERTO y aún no llegó su fecha de fin. */
const estaAbierto = (p: ProcesoVotacion) => p.estado === 'ABIERTO' && p.fechaFin > new Date();

@Injectable()
export class VotosService {
  constructor(
    private readonly repo: VotosRepository,
    private readonly procesos: ProcesosService,
    private readonly elegibilidad: ElegibilidadService,
    private readonly audit: AuditService,
    private readonly gateway: ResultadosGateway,
  ) {}

  /** Proceso activo en el que el alumno está empadronado. */
  private async procesoDelAlumno(usuarioId: string) {
    const proceso = await this.procesos.obtenerActivoOFallar();
    if (!(await this.procesos.estaEnPadron(proceso.id, usuarioId))) {
      throw new ForbiddenException('No estás habilitado en el proceso de votación actual');
    }
    return proceso;
  }

  async estado(usuarioId: string) {
    const proceso = await this.procesoDelAlumno(usuarioId);
    const [aceptacion, votosUsados] = await Promise.all([
      this.repo.aceptacion(proceso.id, usuarioId),
      this.repo.contarVotos(proceso.id, usuarioId),
    ]);
    const terminosAceptados = aceptacion?.version === TERMINOS_VERSION;
    const abierto = estaAbierto(proceso);
    return {
      proceso,
      abierto,
      terminos: {
        version: TERMINOS_VERSION,
        texto: TERMINOS_TEXTO,
        aceptados: terminosAceptados,
        aceptadoEn: terminosAceptados ? aceptacion!.aceptadoEn : null,
      },
      votosUsados,
      maxCursos: proceso.maxCursos,
      maxFranjas: proceso.maxFranjas,
      puedeVotar: abierto && terminosAceptados && votosUsados < proceso.maxCursos,
    };
  }

  async aceptarTerminos(usuarioId: string) {
    const proceso = await this.procesoDelAlumno(usuarioId);
    if (!estaAbierto(proceso)) throw new BadRequestException('El proceso de votación no está abierto');
    const actual = await this.repo.aceptacion(proceso.id, usuarioId);
    if (actual?.version === TERMINOS_VERSION) return actual;
    const aceptacion = await this.repo.guardarAceptacion(proceso.id, usuarioId, TERMINOS_VERSION);
    await this.audit.registrar('ACEPTAR_TERMINOS', usuarioId, { procesoId: proceso.id, version: TERMINOS_VERSION });
    return aceptacion;
  }

  async electivos(usuarioId: string) {
    const proceso = await this.procesoDelAlumno(usuarioId);
    const [evaluacion, votos] = await Promise.all([
      this.elegibilidad.evaluarAlumno(proceso.id, usuarioId),
      this.repo.votosDeAlumno(proceso.id, usuarioId),
    ]);
    const votoPorCurso = new Map(votos.map((v) => [v.cursoCodigo, v]));
    return {
      creditos: evaluacion.creditos,
      electivos: evaluacion.electivos.map((e) => {
        const voto = votoPorCurso.get(e.codigo);
        return {
          ...e,
          voto: voto
            ? { franjas: this.franjasOrdenadas(voto.franjas), aptitud: voto.aptitud, createdAt: voto.createdAt }
            : null,
        };
      }),
    };
  }

  async electivo(usuarioId: string, codigo: string) {
    const { electivos, creditos } = await this.electivos(usuarioId);
    const electivo = electivos.find((e) => e.codigo === codigo.toUpperCase());
    if (!electivo) throw new NotFoundException('Electivo no encontrado');
    return { ...electivo, creditosAlumno: creditos };
  }

  async misVotos(usuarioId: string) {
    const proceso = await this.procesoDelAlumno(usuarioId);
    const votos = await this.repo.votosDeAlumno(proceso.id, usuarioId);
    return votos.map((v) => ({
      id: v.id,
      cursoCodigo: v.cursoCodigo,
      cursoNombre: v.curso.nombre,
      creditos: Number(v.curso.creditos),
      aptitud: v.aptitud,
      franjas: this.franjasOrdenadas(v.franjas),
      createdAt: v.createdAt,
    }));
  }

  /**
   * Emite un voto (curso + franjas) en una sola operación atómica. Se revalida todo dentro de la
   * transacción: proceso abierto, padrón, términos, límite de votos, franjas y aptitud.
   * Los votos son definitivos: no existe operación para editarlos ni retirarlos.
   */
  async emitir(usuarioId: string, dto: EmitirVotoDto) {
    const procesoActivo = await this.procesos.obtenerActivoOFallar();
    const cursoCodigo = dto.cursoCodigo.toUpperCase();
    const franjas = [...dto.franjas].sort((a, b) => ordenFranja(a) - ordenFranja(b));

    try {
      const voto = await this.repo.transaccion(async (tx) => {
        if (!(await this.repo.bloquearPadron(tx, procesoActivo.id, usuarioId))) {
          throw new ForbiddenException('No estás habilitado en el proceso de votación actual');
        }
        const proceso = await tx.procesoVotacion.findUniqueOrThrow({ where: { id: procesoActivo.id } });
        if (!estaAbierto(proceso)) throw new BadRequestException('El proceso de votación no está abierto');

        const aceptacion = await this.repo.aceptacion(proceso.id, usuarioId, tx);
        if (aceptacion?.version !== TERMINOS_VERSION) {
          throw new ForbiddenException('Debes aceptar los términos de participación antes de votar');
        }

        if (franjas.length < 1) throw new BadRequestException('Debes elegir al menos una franja');
        if (franjas.length > proceso.maxFranjas) {
          throw new BadRequestException(`Puedes elegir como máximo ${proceso.maxFranjas} franjas por curso`);
        }
        if (new Set(franjas).size !== franjas.length) throw new BadRequestException('Las franjas no pueden repetirse');

        const usados = await this.repo.contarVotos(proceso.id, usuarioId, tx);
        if (usados >= proceso.maxCursos) {
          throw new BadRequestException(`Ya usaste tus ${proceso.maxCursos} votos`);
        }

        const electivo = await this.elegibilidad.evaluarElectivo(proceso.id, usuarioId, cursoCodigo, tx);
        if (electivo.elegibilidad.aptitud === 'NO_APTO') {
          throw new ForbiddenException('No cumples los requisitos de este electivo');
        }

        return this.repo.crearVoto(tx, {
          procesoId: proceso.id,
          usuarioId,
          cursoCodigo,
          aptitud: electivo.elegibilidad.aptitud,
          franjas,
        });
      });

      await this.audit.registrar('VOTO', usuarioId, {
        procesoId: voto.procesoId,
        cursoCodigo,
        franjas,
        aptitud: voto.aptitud,
      });
      this.gateway.notificar('voto', voto.procesoId);

      return {
        id: voto.id,
        cursoCodigo: voto.cursoCodigo,
        cursoNombre: voto.curso.nombre,
        creditos: Number(voto.curso.creditos),
        aptitud: voto.aptitud,
        franjas: this.franjasOrdenadas(voto.franjas),
        createdAt: voto.createdAt,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Ya votaste por este curso');
      }
      throw e;
    }
  }

  private franjasOrdenadas(franjas: { franja: Franja }[]): Franja[] {
    return franjas.map((f) => f.franja).sort((a, b) => ordenFranja(a) - ordenFranja(b));
  }
}
