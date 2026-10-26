import { Injectable } from '@nestjs/common';
import { Aptitud } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ResultadosRepository {
  constructor(private readonly prisma: PrismaService) {}

  votosDeProceso(procesoId: string, aptitud?: Aptitud) {
    return this.prisma.voto.findMany({
      where: { procesoId, ...(aptitud ? { aptitud } : {}) },
      select: {
        cursoCodigo: true,
        aptitud: true,
        usuarioId: true,
        franjas: { select: { franja: true } },
        curso: { select: { nombre: true, creditos: true } },
      },
    });
  }

  votosDeCurso(procesoId: string, cursoCodigo: string) {
    return this.prisma.voto.findMany({
      where: { procesoId, cursoCodigo },
      include: {
        franjas: { select: { franja: true } },
        usuario: { select: { codigo: true, nombres: true, apellidos: true, correo: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  votosDetallados(procesoId: string) {
    return this.prisma.voto.findMany({
      where: { procesoId },
      include: {
        franjas: { select: { franja: true } },
        usuario: { select: { codigo: true, nombres: true, apellidos: true } },
        curso: { select: { nombre: true } },
      },
      orderBy: [{ cursoCodigo: 'asc' }, { createdAt: 'asc' }],
    });
  }

  curso(codigo: string) {
    return this.prisma.curso.findUnique({ where: { codigo } });
  }

  contarPadron(procesoId: string) {
    return this.prisma.padronAlumno.count({ where: { procesoId } });
  }

  contarHistorial(procesoId: string) {
    return this.prisma.historialItem.count({ where: { procesoId } });
  }

  async alumnosSinHistorial(procesoId: string) {
    return this.prisma.padronAlumno.count({
      where: { procesoId, usuario: { historial: { none: { procesoId } } } },
    });
  }

  contarElectivos() {
    return this.prisma.curso.count({ where: { tipo: 'ELECTIVO' } });
  }

  contarElectivosSinDescripcion() {
    return this.prisma.curso.count({
      where: { tipo: 'ELECTIVO', OR: [{ descripcion: null }, { descripcion: '' }] },
    });
  }
}
