import { Injectable } from '@nestjs/common';
import { EstadoProceso, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProcesosRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.procesoVotacion.findMany({
      orderBy: [{ fechaInicio: 'desc' }, { createdAt: 'desc' }],
      include: { _count: { select: { padron: true, votos: true } } },
    });
  }

  buscar(id: string) {
    return this.prisma.procesoVotacion.findUnique({ where: { id } });
  }

  buscarAbierto() {
    return this.prisma.procesoVotacion.findFirst({ where: { estado: 'ABIERTO' } });
  }

  buscarUltimo() {
    return this.prisma.procesoVotacion.findFirst({ orderBy: [{ fechaInicio: 'desc' }, { createdAt: 'desc' }] });
  }

  crear(data: Prisma.ProcesoVotacionCreateInput) {
    return this.prisma.procesoVotacion.create({ data });
  }

  actualizar(id: string, data: Prisma.ProcesoVotacionUpdateInput) {
    return this.prisma.procesoVotacion.update({ where: { id }, data });
  }

  /** Cierra los procesos abiertos cuya fecha de fin ya pasó. Devuelve los ids cerrados. */
  async cerrarVencidos(ahora: Date): Promise<string[]> {
    const vencidos = await this.prisma.procesoVotacion.findMany({
      where: { estado: 'ABIERTO', fechaFin: { lte: ahora } },
      select: { id: true },
    });
    if (!vencidos.length) return [];
    const ids = vencidos.map((p) => p.id);
    await this.prisma.procesoVotacion.updateMany({
      where: { id: { in: ids }, estado: 'ABIERTO' },
      data: { estado: EstadoProceso.CERRADO },
    });
    return ids;
  }

  async estaEnPadron(procesoId: string, usuarioId: string) {
    const fila = await this.prisma.padronAlumno.findUnique({ where: { procesoId_usuarioId: { procesoId, usuarioId } } });
    return !!fila;
  }
}
