import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseFilters, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PantryService } from './pantry.service';
import { WsExceptionFilter } from '../../common/filters/ws-exception.filter';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { ApiResponse } from '../../common/classes/api-response.class';

// Configuramos cors para que acepte las conexiones de Expo y local
@WebSocketGateway({ cors: { origin: '*' } })
@UseFilters(WsExceptionFilter)
export class PantryGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private readonly pantryService: PantryService) {}

  afterInit() {
    console.log('Websockets Gateway Inicializado');
  }

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // EVENTO PARA ANALIZAR IMAGEN
  // Para probar localmente podemos quitar temporalmente el UseGuards
  @UseGuards(WsAuthGuard)
  @SubscribeMessage('pantry:analyze_image')
  async handleAnalyzeImage(
    client: Socket,
    payload: { imageBase64: string; token: string },
  ): Promise<ApiResponse> {
    console.log('Recibiendo imagen para procesar via Gemini...');

    // Llamamos al service que contiene la lógica de negocio
    const analisisResult = await this.pantryService.analyzeFoodImage(
      payload.imageBase64,
    );

    // Retornamos SIEMPRE con nuestro DTO unificado
    return ApiResponse.success(analisisResult, 'Imagen analizada con éxito');
  }
}
