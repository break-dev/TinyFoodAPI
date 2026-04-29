import { WebSocketGateway, OnGatewayConnection } from '@nestjs/websockets';
import { UseFilters } from '@nestjs/common';
import { ExceptionFilter } from '../exception.filter';
import { Dispatcher } from '../dispatcher';
import { Socket } from 'socket.io';
import { ClientRequest } from '../dtos/client.request';

/**
 * Gateway Padre Público.
 * Puente para eventos que no requieren autenticación.
 */
@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(ExceptionFilter)
export class PublicGateway implements OnGatewayConnection {
  handleConnection(client: Socket) {
    client.onAny((event: string, data: ClientRequest) => {
      void (async () => {
        // Extraemos el payload del body si viene con la estructura ClientRequest
        const payload: unknown = data?.body !== undefined ? data.body : data;

        // Intentamos despachar a través del registro público
        const response = await Dispatcher.dispatchPublic(
          event,
          client,
          payload as any,
        );

        if (response) {
          client.emit(event, response);
        }
      })();
    });
  }
}
