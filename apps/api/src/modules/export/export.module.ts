import { Module } from '@nestjs/common';
import { ProcesosModule } from '../procesos/procesos.module';
import { ResultadosModule } from '../resultados/resultados.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [ProcesosModule, ResultadosModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
