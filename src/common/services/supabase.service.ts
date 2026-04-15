import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    // La service_role key bypassa RLS — usar solo en el servidor
    this.adminClient = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  /** Cliente con permisos de admin (service role). Para operaciones de servidor. */
  get admin(): SupabaseClient {
    return this.adminClient;
  }

  /** Valida un JWT de usuario usando la anon key. Retorna el user o null. */
  async getUser(token: string) {
    const anonClient = createClient(
      this.configService.get<string>('SUPABASE_URL')!,
      this.configService.get<string>('SUPABASE_KEY')!,
    );
    const { data, error } = await anonClient.auth.getUser(token);
    if (error) return null;
    return data.user;
  }
}
