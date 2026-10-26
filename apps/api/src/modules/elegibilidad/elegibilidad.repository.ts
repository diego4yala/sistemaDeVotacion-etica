import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Cliente de Prisma o transacción en curso. */
export type Db = PrismaService | Prisma.TransactionClient;

@Injectable()
export class ElegibilidadRepository {
  constructor(private readonly prisma: PrismaService) {}

  cursosConRequisitos(db: Db = this.prisma) {
    return db.curso.findMany({
      include: { requisitos: { orderBy: { orden: 'asc' } } },
      orderBy: { codigo: 'asc' },
    });
  }

  historialDeAlumno(procesoId: string, usuarioId: string, db: Db = this.prisma) {
    return db.historialItem.findMany({
      where: { procesoId, usuarioId },
      select: { cursoCodigo: true, nota: true },
    });
  }

  historialDeProceso(procesoId: string) {
    return this.prisma.historialItem.findMany({
      where: { procesoId },
      select: { usuarioId: true, cursoCodigo: true, nota: true },
    });
  }
}
