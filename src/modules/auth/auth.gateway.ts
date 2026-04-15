import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { UseFilters, UseGuards } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { ApiResponse } from '../../common/classes/api-response.class';

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(WsExceptionFilter)
export class AuthGateway {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('auth:sync')
  async handleSyncUser(client: Socket): Promise<ApiResponse> {
    // client.user es inyectado por el WsAuthGuard
    const user = (client as any).user;

    // El service se encarga de verificar que el perfil exista en Postgres (Models)
    const profile = await this.authService.syncProfile(user);

    return ApiResponse.success(profile, 'Perfil sincronizado correctamente');
  }
}
