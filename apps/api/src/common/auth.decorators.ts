import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Rol } from '@prisma/client';

export interface UsuarioSesion {
  id: string;
  codigo: string;
  rol: Rol;
}

export const ES_PUBLICO = 'esPublico';
/** Marca un endpoint como accesible sin sesión. */
export const Publico = () => SetMetadata(ES_PUBLICO, true);

export const ROLES = 'roles';
/** Restringe un endpoint (o controlador) a los roles indicados. */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES, roles);

/** Inyecta el usuario de la sesión (lo coloca JwtAuthGuard en la request). */
export const UsuarioActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioSesion => ctx.switchToHttp().getRequest().usuario,
);
