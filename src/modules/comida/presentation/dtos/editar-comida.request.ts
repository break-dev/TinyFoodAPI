import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { EstadoComida } from 'src/common/utils/enums/estado-comida.enum';

export class REQ_EditarComida {
  @IsInt()
  @Min(1)
  id: number;

  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  cantidad?: string;

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
