import { Module } from '@nestjs/common';
import { ElegibilidadRepository } from './elegibilidad.repository';
import { ElegibilidadService } from './elegibilidad.service';

@Module({
  providers: [ElegibilidadService, ElegibilidadRepository],
  exports: [ElegibilidadService],
})
export class ElegibilidadModule {}
