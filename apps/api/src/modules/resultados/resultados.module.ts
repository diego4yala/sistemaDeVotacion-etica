import { Module } from '@nestjs/common';
import { ProcesosModule } from '../procesos/procesos.module';
import { CoordResultadosController, ResultadosPublicosController } from './resultados.controller';
import { ResultadosRepository } from './resultados.repository';
import { ResultadosService } from './resultados.service';

@Module({
  imports: [ProcesosModule],
  controllers: [ResultadosPublicosController, CoordResultadosController],
  providers: [ResultadosService, ResultadosRepository],
  exports: [ResultadosService],
})
export class ResultadosModule {}
