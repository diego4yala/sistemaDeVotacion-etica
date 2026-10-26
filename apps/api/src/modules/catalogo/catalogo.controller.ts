import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Roles, UsuarioActual, UsuarioSesion } from '../../common/auth.decorators';
import { EditarCursoDto, FiltroCursosDto } from './catalogo.dto';
import { CatalogoService } from './catalogo.service';

@Roles('COORDINADOR')
@Controller('coord/cursos')
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get()
  listar(@Query() filtro: FiltroCursosDto) {
    return this.catalogo.listar(filtro.tipo);
  }

  @Patch(':codigo')
  editar(@Param('codigo') codigo: string, @Body() dto: EditarCursoDto, @UsuarioActual() u: UsuarioSesion) {
    return this.catalogo.editar(codigo, dto, u.id);
  }
}
