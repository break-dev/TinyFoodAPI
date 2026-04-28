import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { Dispatcher } from 'src/common/presentation/dispatcher';
import { SendResponse } from 'src/common/utils/functions/api-response';
import { UC_RegistrarComida } from '../logic/registrar-comida.uc';
import { UC_ListarComidas, UC_EditarComida, UC_EliminarComida } from '../logic/comida.uc';
import { REQ_CrearComida } from './dtos/crear-comida.request';
import { REQ_EditarComida } from './dtos/editar-comida.request';

export class ComidaGateway {
  static {
    Dispatcher.registerPrivate({
      'comida:registrar': (client, data) =>
        ComidaGateway.registrar(client, data),
      'comida:listar': (client) =>
        ComidaGateway.listar(client),
      'comida:editar': (client, data) =>
        ComidaGateway.editar(client, data),
      'comida:eliminar': (client, data) =>
        ComidaGateway.eliminar(client, data),
    });
  }

  static async registrar(client: any, data: unknown) {
    try {
      const body = plainToInstance(REQ_CrearComida, data);
      await validateOrReject(body);
      return UC_RegistrarComida.execute(client.usuario.id, {
        nombre: body.nombre,
        cantidad: body.cantidad,
        descripcion: body.descripcion,
        incluir_hora: body.incluir_hora,
        fecha_compra: body.fecha_compra,
        fecha_vencimiento: body.fecha_vencimiento,
        tags: body.tags,
        estado: body.estado,
      });
    } catch (error) {
      return SendResponse.error(
        error instanceof Array ? 'Datos inválidos para registrar comida' : 'Error al registrar comida',
      );
    }
  }

  static async listar(client: any) {
    return UC_ListarComidas.execute(client.usuario.id);
  }

  static async editar(client: any, data: unknown) {
    try {
      const body = plainToInstance(REQ_EditarComida, data);
      await validateOrReject(body);
      return UC_EditarComida.execute(body.id, client.usuario.id, {
        nombre: body.nombre,
        cantidad: body.cantidad,
        descripcion: body.descripcion,
        incluir_hora: body.incluir_hora,
        fecha_compra: body.fecha_compra,
        fecha_vencimiento: body.fecha_vencimiento,
        tags: body.tags,
        estado: body.estado,
      });
    } catch (error) {
      return SendResponse.error(
        error instanceof Array ? 'Datos inválidos para editar comida' : 'Error al editar comida',
      );
    }
  }

  static async eliminar(client: any, data: unknown) {
    try {
      const body = data as { id: number };
      if (!body?.id || typeof body.id !== 'number') {
        return SendResponse.error('Se requiere un ID válido para eliminar');
      }
      return UC_EliminarComida.execute(body.id, client.usuario.id);
    } catch (error) {
      return SendResponse.error('Error al eliminar comida');
    }
  }
}