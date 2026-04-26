import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

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

  @IsString()
  @IsOptional()
  informacion_medica?: string;

  @IsString()
  @IsOptional()
  alimentos_prohibidos?: string;

  @IsString()
  @IsOptional()
  preferencias?: string;
}
