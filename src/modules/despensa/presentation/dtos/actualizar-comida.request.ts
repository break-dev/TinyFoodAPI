import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EstadoComida } from 'src/common/utils/enums/estado-comida.enum';

export class REQ_ActualizarComida {
  @IsInt()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  cantidad?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  incluir_hora?: boolean;

  @IsDateString()
  @IsOptional()
  fecha_compra?: string;

  @IsDateString()
  @IsOptional()
  hora_compra?: string;

  @IsDateString()
  @IsOptional()
  fecha_vencimiento?: string;

  @IsDateString()
  @IsOptional()
  hora_vencimiento?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsEnum(EstadoComida)
  @IsOptional()
  estado?: EstadoComida;
}
