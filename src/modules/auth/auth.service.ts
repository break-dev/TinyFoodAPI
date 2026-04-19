import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private supabaseUrl: string;
  private supabaseServiceKey: string;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    // Usamos la service key para insertar el usuario en tablas locales bypassing RLS si es necesario
    this.supabaseServiceKey =
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '';
  }

  async syncProfile(user: any): Promise<any> {
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.warn(
        'Simulando sincronización de perfil. Falta SUPABASE_SERVICE_ROLE_KEY',
      );
      return { id: user?.id, email: user?.email, sync: true };
    }

    return { id: user?.id, email: user?.email, sync: true };
  }
}
