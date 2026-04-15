import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../../common/services/supabase.service';

export interface UsuarioData {
  id: string;
  nombre: string;
  correo: string;
  peso?: number;
  talla?: number;
  fecha_nacimiento?: string;
  nivel_actividad?: number;
  informacion_medica?: { nombre: string; descripcion: string }[];
  alimentos_prohibidos?: string[];
  preferencias?: string[];
  created_at?: string;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findByUserId(userId: string): Promise<UsuarioData | null> {
    const { data, error } = await this.supabaseService.admin
      .from('usuario')
      .select('*')
      .eq('id', userId)
      .single();

    // PGRST116 = no rows found (no es un error real)
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data ?? null;
  }

  async upsertUser(payload: {
    id: string;
    correo: string;
    nombre: string;
  }): Promise<UsuarioData> {
    const { data, error } = await this.supabaseService.admin
      .from('usuario')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
