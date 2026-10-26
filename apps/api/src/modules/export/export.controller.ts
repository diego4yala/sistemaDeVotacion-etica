import { Controller, Get, Param, ParseUUIDPipe, Query, Res, StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { Roles } from '../../common/auth.decorators';
import { ExportService } from './export.service';

const MIME_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Roles('COORDINADOR')
@Controller('coord/export')
export class ExportController {
  constructor(private readonly exportar: ExportService) {}

  /** Hojas: Ranking, Matriz franjas, Votos detallados. */
  @Get('resultados.xlsx')
  async resultados(
    @Res({ passthrough: true }) res: Response,
    @Query('procesoId', new ParseUUIDPipe({ optional: true })) procesoId?: string,
  ) {
    const { buffer, nombre } = await this.exportar.resultadosXlsx(procesoId);
    res.set({ 'Content-Type': MIME_XLSX, 'Content-Disposition': `attachment; filename="${nombre}"` });
    return new StreamableFile(buffer);
  }

  /** Votantes de un curso. */
  @Get('cursos/:codigo/votantes.xlsx')
  async curso(
    @Param('codigo') codigo: string,
    @Res({ passthrough: true }) res: Response,
    @Query('procesoId', new ParseUUIDPipe({ optional: true })) procesoId?: string,
  ) {
    const { buffer, nombre } = await this.exportar.cursoXlsx(codigo, procesoId);
    res.set({ 'Content-Type': MIME_XLSX, 'Content-Disposition': `attachment; filename="${nombre}"` });
    return new StreamableFile(buffer);
  }
}
