import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ApiResponse } from '../classes/api-response.class';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let message = 'Internal server error';

    if (exception instanceof WsException) {
      message = exception.message;
    } else if (exception instanceof HttpException) {
      message = exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const response: ApiResponse<null> = ApiResponse.error(message);

    // Emit the error back to the client. We assume the client listens for its own specific error events
    // or a global 'exception' event.
    client.emit('exception', response as any);
  }
}
