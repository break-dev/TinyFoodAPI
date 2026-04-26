import { WebSocketGateway, OnGatewayConnection } from '@nestjs/websockets';
import { UseFilters, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth.guard';
import { ExceptionFilter } from '../exception.filter';
import { Dispatcher } from '../dispatcher';
import type { AuthSocket } from '../interfaces/auth-socket.interface';

import { ClientRequest } from '../dtos/client.request';

/**
 * Gateway Padre Privado.
 * Es un puente puro: recibe cualquier evento, verifica seguridad y despacha.
 */
@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(ExceptionFilter)
@UseGuards(AuthGuard)
export class PrivateGateway implements OnGatewayConnection {
  handleConnection(client: AuthSocket) {
    // Escuchamos cualquier evento entrante (Socket.io onAny)
    client.onAny((event: string, data: ClientRequest) => {
      void (async () => {
        // Extraemos el payload del body si viene con la estructura ClientRequest
        const payload: unknown = data?.body !== undefined ? data.body : data;

        // Intentamos despachar a través del registro privado
        const response = await Dispatcher.dispatchPrivate(
          event,
          client,
          payload as any,
        );

        // Si el dispatcher encontró un handler y devolvió algo, lo emitimos
        if (response) {
          client.emit(event, response);
        }
      })();
    });
  }
}
