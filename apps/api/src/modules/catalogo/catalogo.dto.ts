import { TipoCurso } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

const recortar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class EditarCursoDto {
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(99.99)
  creditos?: number;

  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(4000)
  descripcion?: string;

  /** Texto en notación PUCP; se vuelve a parsear al guardar. Cadena vacía = sin requisitos. */
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(500)
  requisitosTexto?: string;
}

export class FiltroCursosDto {
  @IsOptional()
  @IsEnum(TipoCurso)
  tipo?: TipoCurso;
}
