import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  MinLength,
} from 'class-validator';
import { EstadoComida } from 'src/common/utils/enums/estado-comida.enum';

export class REQ_CrearComida {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsString()
  @MinLength(1)
  cantidad: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsBoolean()
  incluir_hora?: boolean;

  @IsOptional()
  @IsDateString()
  fecha_compra?: string;

  @IsOptional()
  @IsDateString()
  fecha_vencimiento?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsEnum(EstadoComida)
  estado?: EstadoComida;
}
