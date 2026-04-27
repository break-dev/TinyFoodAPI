import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InfoMedicaDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}

export class REQ_CrearUsuario {
  @IsString()
  @IsNotEmpty()
  id_supabase: string; // id de la tabla "users" de supabase (UUID)

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsUrl()
  @IsOptional()
  urlFoto?: string;

  @IsNumber()
  @IsOptional()
  peso?: number;

  @IsNumber()
  @IsOptional()
  talla?: number;

  @IsDateString()
  @IsOptional()
  fecha_nacimiento?: string;

  @IsNumber()
  @IsOptional()
  nivel_actividad?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InfoMedicaDto)
  @IsOptional()
  informacion_medica?: InfoMedicaDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  alimentos_prohibidos?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferencias?: string[];
}
