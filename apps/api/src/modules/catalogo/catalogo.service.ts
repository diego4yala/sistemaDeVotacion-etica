import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TipoCurso } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { TerminoRequisito, parsearRequisitos } from '../elegibilidad/motor';
import { EditarCursoDto } from './catalogo.dto';
import { CatalogoRepository } from './catalogo.repository';

type CursoConRequisitos = NonNullable<Awaited<ReturnType<CatalogoRepository['buscar']>>>;

@Injectable()
export class CatalogoService {
  constructor(
    private readonly repo: CatalogoRepository,
    private readonly audit: AuditService,
  ) {}

  async listar(tipo?: TipoCurso) {
    const cursos = await this.repo.listar(tipo);
    return cursos.map((c) => this.aRespuesta(c));
  }

  async editar(codigoParam: string, dto: EditarCursoDto, coordinadorId: string) {
    const codigo = codigoParam.toUpperCase();
    const actual = await this.repo.buscar(codigo);
    if (!actual) throw new NotFoundException('Curso no encontrado');

    const data: Prisma.CursoUpdateInput = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.creditos !== undefined) data.creditos = new Prisma.Decimal(dto.creditos);
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion || null;

    let terminos: TerminoRequisito[] | undefined;
    if (dto.requisitosTexto !== undefined) {
      data.requisitosTexto = dto.requisitosTexto || null;
      // Solo los ELECTIVO tienen requisitos evaluables; en los demás es texto informativo.
      if (actual.tipo === 'ELECTIVO') {
        const parseo = parsearRequisitos(dto.requisitosTexto);
        if (parseo.errores.length) {
          throw new BadRequestException({
            message: parseo.errores.map((e) => e.mensaje),
            error: 'Requisitos inválidos',
            statusCode: 400,
          });
        }
        terminos = parseo.terminos;
      }
    }

    const curso = await this.repo.actualizar(codigo, data, terminos);
    await this.audit.registrar('EDITAR_CURSO', coordinadorId, { codigo, cambios: JSON.parse(JSON.stringify(dto)) });
    return this.aRespuesta(curso);
  }

  private aRespuesta(c: CursoConRequisitos) {
    return {
      codigo: c.codigo,
      nombre: c.nombre,
      creditos: Number(c.creditos),
      tipo: c.tipo,
      ciclo: c.ciclo,
      grupo: c.grupo,
      requisitosTexto: c.requisitosTexto,
      descripcion: c.descripcion,
      requisitos: c.requisitos.map((r) => ({
        texto: r.texto,
        tipo: r.tipo,
        cursoRequerido: r.cursoRequerido,
        creditosMinimos: r.creditosMinimos,
      })),
      faltaDescripcion: c.tipo === 'ELECTIVO' && !c.descripcion,
    };
  }
}
