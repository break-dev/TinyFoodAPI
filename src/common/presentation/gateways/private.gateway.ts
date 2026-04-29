/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  OnGatewayConnection,
  WsException,
} from '@nestjs/websockets';
import { UseFilters } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '../auth.guard';
import { ExceptionFilter } from '../exception.filter';
import { Dispatcher } from '../dispatcher';
import type { AuthSocket } from '../interfaces/auth-socket.interface';
import { AuthData } from 'src/modules/auth/data/auth.data';
import { ClientRequest } from '../dtos/client.request';

/**
 * Gateway Padre Privado.
 * Es un puente puro: recibe cualquier evento, verifica seguridad y despacha.
 */
@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(ExceptionFilter)
// @UseGuards(AuthGuard) // Guard no funciona con client.onAny automáticamente en NestJS
export class PrivateGateway implements OnGatewayConnection {
  constructor(private readonly configService: ConfigService) {}

  handleConnection(client: AuthSocket) {
    console.log(`[PrivateGateway] Cliente conectado: ${client.id}`);

    // Escuchamos cualquier evento entrante (Socket.io onAny)
    client.onAny((event: string, ...args: any[]) => {
      console.log(`[PrivateGateway] Evento recibido: ${event}`);
      const data = args[0] as ClientRequest;
      const ack =
        args.length > 1 && typeof args[args.length - 1] === 'function'
          ? args[args.length - 1]
          : null;

      void (async () => {
        try {
          // Validar autenticación de manera manual
          const token: string | undefined =
            data?.token || (client.handshake?.auth?.token as string);
          if (!token) throw new WsException('No se proporcionó token');

          const user = await AuthGuard.verify(token, this.configService);
          client.user = user;

          const usuario = await AuthData.findUserBySupabaseId(user.id);
          const isAuthEvent =
            event === 'auth:autenticar' || event === 'auth:registrar';
          if (!usuario && !isAuthEvent) {
            throw new WsException('Usuario no registrado localmente');
          }
          client.usuario = usuario as any;

          // Extraemos el payload del body si viene con la estructura ClientRequest
          const payload: unknown = data?.body !== undefined ? data.body : data;

          // Intentamos despachar a través del registro privado
          const response = await Dispatcher.dispatchPrivate(
            event,
            client,
            payload as any,
          );

          console.log(`[PrivateGateway] Respuesta para ${event}:`, response);

          // Si hay un callback de reconocimiento (ack), lo usamos
          if (ack) {
            ack(response);
          } else if (response) {
            // Fallback: emitir evento si no hay ack
            client.emit(event, response);
          }
        } catch (error: any) {
          console.error(`[PrivateGateway] Error en ${event}:`, error.message);
          const errorRes = {
            success: false,
            message: error.message || 'Error en el servidor',
            data: null,
          };
          if (ack) ack(errorRes);
          else client.emit(event, errorRes);
        }
      })();
    });
  }
}
