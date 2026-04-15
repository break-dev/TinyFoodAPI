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

  // eslint-disable-next-line @typescript-eslint/require-await
  async syncProfile(user: any): Promise<any> {
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      console.warn(
        'Simulando sincronización de perfil. Falta SUPABASE_SERVICE_ROLE_KEY',
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      return { id: user?.id, email: user?.email, sync: true };
    }

    // Aquí puedes conectar este service a un modelo/ORM, o usar el SDK de Supabase:
    // Ejemplo hipotético asumiendo una tabla 'profiles':
    /*
    const supabase = createClient(this.supabaseUrl, this.supabaseServiceKey);
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: user.email, last_login: new Date() })
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
    */

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return { id: user?.id, email: user?.email, sync: true };
  }
}
