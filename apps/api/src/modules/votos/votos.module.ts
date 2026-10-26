import { Module } from '@nestjs/common';
import { ElegibilidadModule } from '../elegibilidad/elegibilidad.module';
import { ProcesosModule } from '../procesos/procesos.module';
import { AlumnoController } from './alumno.controller';
import { VotosRepository } from './votos.repository';
import { VotosService } from './votos.service';

@Module({
  imports: [ProcesosModule, ElegibilidadModule],
  controllers: [AlumnoController],
  providers: [VotosService, VotosRepository],
})
export class VotosModule {}
