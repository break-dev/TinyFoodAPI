import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(private configService: ConfigService) {
    // Estas variables las pondremos en el .env
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_KEY') || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const data = context.switchToWs().getData<{ token?: string } | undefined>();

    // Obtenemos el token desde el header, query o payload auth event.
    // Usualmente en websockets pasamos el token en la conexion inicial, o en cada evento como payload.
    // Asumiremos que el cliente lo manda en `data.token` en cada petición, o ya fue guardado en el client.

    // Para no ser tan estrictos en el ejemplo inicial, asumiremos que si viene un token válido en `data.token`, o ya está en el socket
    const token = data?.token || client.handshake?.auth?.token;

    if (!token) {
      throw new WsException('No authorization token provided');
    }

    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      console.warn(
        'Supabase URL/Key no configurado en WS Guard. Simulando auth exitosa temporalmente...',
      );
      (client as any).user = { id: 'test-user-id' };
      return true;
    }

    const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);

    const { data: userData, error } = await supabase.auth.getUser(token);

    if (error || !userData?.user) {
      throw new WsException('Invalid token or session expired');
    }

    // Guardamos el usuario en el socket para que el gateway pueda acceder
    (client as any).user = userData.user;

    return true;
  }
}
