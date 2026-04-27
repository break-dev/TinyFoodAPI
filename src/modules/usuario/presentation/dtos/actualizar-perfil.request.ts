import {
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Min,
  Max,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

class CondicionMedicaDto {
  @IsString()
  nombre: string = '';

  @IsString()
  descripcion: string = '';
}

export class REQ_ActualizarPerfil {
  @IsDateString()
  @IsOptional()
  fecha_nacimiento?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(500)
  peso?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(300)
  talla?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  nivel_actividad?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CondicionMedicaDto)
  informacion_medica?: CondicionMedicaDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alimentos_prohibidos?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferencias?: string[];
}
