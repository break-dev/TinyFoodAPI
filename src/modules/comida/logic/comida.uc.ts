import { ComidaData } from '../data/comida.data';
import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';

export class UC_ListarComidas {
  static async execute(id_usuario: number): Promise<ApiResponse> {
    try {
      const comidas = await ComidaData.listarComidas(id_usuario);
      return SendResponse.success(comidas, 'Comidas obtenidas correctamente');
    } catch (error) {
      return SendResponse.error(
        `Error al listar comidas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}

export class UC_EditarComida {
  static async execute(
    id: number,
    id_usuario: number,
    cambios: {
      nombre?: string;
      cantidad?: string;
      descripcion?: string;
      incluir_hora?: boolean;
      fecha_compra?: string;
      fecha_vencimiento?: string;
      tags?: string;
      estado?: string;
    },
  ): Promise<ApiResponse> {
    try {
      // Verificar que la comida existe y pertenece al usuario
      const comida = await ComidaData.obtenerComida(id, id_usuario);
      if (!comida) {
        return SendResponse.error('Comida no encontrada');
      }

      const resultado = await ComidaData.editarComida(id, id_usuario, {
        ...cambios,
        fecha_compra: cambios.fecha_compra
          ? new Date(cambios.fecha_compra)
          : undefined,
        fecha_vencimiento: cambios.fecha_vencimiento
          ? new Date(cambios.fecha_vencimiento)
          : undefined,
      });

      return SendResponse.success(resultado, 'Comida actualizada correctamente');
    } catch (error) {
      return SendResponse.error(
        `Error al editar comida: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}

export class UC_EliminarComida {
  static async execute(id: number, id_usuario: number): Promise<ApiResponse> {
    try {
      const comida = await ComidaData.obtenerComida(id, id_usuario);
      if (!comida) {
        return SendResponse.error('Comida no encontrada');
      }

      await ComidaData.eliminarComida(id, id_usuario);
      return SendResponse.success(null, 'Comida eliminada correctamente');
    } catch (error) {
      return SendResponse.error(
        `Error al eliminar comida: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
