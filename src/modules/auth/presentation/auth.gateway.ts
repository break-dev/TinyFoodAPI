import { SubscribeMessage, WebSocketGateway, ConnectedSocket } from '@nestjs/websockets';
import { UseFilters, UseGuards } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AuthService } from '../logic/auth.service';
import { WsExceptionFilter } from '../../../common/filters/ws-exception.filter';
import { WsAuthGuard } from '../../../common/guards/ws-auth.guard';
import { ApiResponse } from '../../../common/classes/api-response.class';

@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(WsExceptionFilter)
export class AuthGateway {
  constructor(private readonly authService: AuthService) {}

  /**
   * Evento: auth:sync
   * Sincroniza el perfil del usuario en la tabla `usuario`.
   * Llamar inmediatamente después de un login/registro exitoso.
   *
   * Payload: { token: string } (o token en handshake)
   * Respuesta: ApiResponse<UsuarioData>
   */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('auth:sync')
  async handleSync(@ConnectedSocket() client: Socket): Promise<ApiResponse> {
    const user = (client as any).user;
    const profile = await this.authService.syncProfile(
      user.id,
      user.email,
      user.user_metadata?.nombre,
    );
    return ApiResponse.success(profile, 'Perfil sincronizado');
  }

  /**
   * Evento: auth:me
   * Retorna el perfil completo del usuario autenticado.
   *
   * Payload: { token: string } (o token en handshake)
   * Respuesta: ApiResponse<UsuarioData>
   */
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('auth:me')
  async handleMe(@ConnectedSocket() client: Socket): Promise<ApiResponse> {
    const user = (client as any).user;
    const profile = await this.authService.getProfile(user.id);
    return ApiResponse.success(profile, 'Perfil obtenido');
  }
}
