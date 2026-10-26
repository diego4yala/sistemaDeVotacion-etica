import { Module } from '@nestjs/common';
import { ElegibilidadModule } from '../elegibilidad/elegibilidad.module';
import { ProcesosModule } from '../procesos/procesos.module';
import { PadronController } from './padron.controller';
import { PadronRepository } from './padron.repository';
import { PadronService } from './padron.service';

@Module({
  imports: [ProcesosModule, ElegibilidadModule],
  controllers: [PadronController],
  providers: [PadronService, PadronRepository],
})
export class PadronModule {}
