import { Module } from '@nestjs/common';
import { CoordProcesosController, ProcesosController } from './procesos.controller';
import { ProcesosRepository } from './procesos.repository';
import { ProcesosService } from './procesos.service';

@Module({
  controllers: [ProcesosController, CoordProcesosController],
  providers: [ProcesosService, ProcesosRepository],
  exports: [ProcesosService],
})
export class ProcesosModule {}
