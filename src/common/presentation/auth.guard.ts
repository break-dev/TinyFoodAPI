import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthSocket } from './interfaces/auth-socket.interface';
import { AuthData } from '../../modules/auth/data/auth.data';
import { ClientRequest } from './dtos/client.request';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<AuthSocket>();
    const data = context.switchToWs().getData<ClientRequest>();

    const token: string | undefined =
      data?.token || (client.handshake?.auth?.token as string);
    if (!token) throw new WsException('No se proporcionó token');

    try {
      const user = await AuthGuard.verify(token, this.configService);
      client.user = user;

      // Buscamos en nuestra base de datos local usando el ID de Supabase
      const dbUser = await AuthData.findUserBySupabaseId(user.id);

      // Si no existe en la BD y no es un evento de inicio (autenticar/registrar), bloqueamos
      const isAuthEvent =
        data?.event === 'auth:autenticar' || data?.event === 'auth:registrar';
      if (!dbUser && !isAuthEvent) {
        throw new WsException('Usuario no registrado localmente');
      }

      // Adjuntamos el usuario de la BD al socket
      client.dbUser = dbUser as any;

      return true;
    } catch (e) {
      if (e instanceof WsException) throw e;
      throw new WsException('Token inválido o sesión expirada');
    }
  }

  /** Lógica de verificación estática para reutilización */
  static async verify(token: string, config: ConfigService) {
    const supabase = createClient(
      config.get('SUPABASE_URL')!,
      config.get('SUPABASE_KEY')!,
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) throw new Error('Inválido');
    return data.user;
  }
}
