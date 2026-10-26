import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { Roles } from '../../common/auth.decorators';
import { PadronService } from './padron.service';

@Roles('COORDINADOR')
@Controller('coord/padron')
export class PadronController {
  constructor(private readonly padron: PadronService) {}

  @Get()
  listar(@Query('procesoId', new ParseUUIDPipe({ optional: true })) procesoId?: string) {
    return this.padron.listar(procesoId);
  }

  @Get(':codigo')
  detalle(@Param('codigo') codigo: string, @Query('procesoId', new ParseUUIDPipe({ optional: true })) procesoId?: string) {
    return this.padron.detalle(codigo, procesoId);
  }
}
