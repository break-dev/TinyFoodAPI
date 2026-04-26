import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ApiResponse } from '../logic/dtos/api.response';
import { SendResponse } from '../utils/functions/api-response';

@Catch()
export class ExceptionFilter extends BaseWsExceptionFilter {
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

    const response: ApiResponse<null> = SendResponse.error(message);

    client.emit('exception', response as any);
  }
}
