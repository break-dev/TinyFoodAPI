import { ComidaData } from '../data/comida.data';
import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';

export class UC_RegistrarComida {
  static async execute(
    id_usuario: number,
    data: {
      nombre: string;
      cantidad: string;
      descripcion?: string;
      incluir_hora?: boolean;
      fecha_compra?: string;
      fecha_vencimiento?: string;
      tags?: string;
      estado?: string;
    },
  ): Promise<ApiResponse> {
    try {
      const nuevaComida = await ComidaData.crearComida({
        id_usuario,
        nombre: data.nombre,
        cantidad: data.cantidad,
        descripcion: data.descripcion,
        incluir_hora: data.incluir_hora,
        fecha_compra: data.fecha_compra ? new Date(data.fecha_compra) : undefined,
        fecha_vencimiento: data.fecha_vencimiento
          ? new Date(data.fecha_vencimiento)
          : undefined,
        tags: data.tags,
        estado: data.estado,
      });

      return SendResponse.success(nuevaComida, 'Comida registrada correctamente');
    } catch (error) {
      return SendResponse.error(
        `Error al registrar comida: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
