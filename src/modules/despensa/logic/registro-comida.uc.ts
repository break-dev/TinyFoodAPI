import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';
import { ComidaData } from '../data/comida.data';
import { REQ_RegistrarComida } from '../presentation/dtos/registrar-comida.request';

export class UC_RegistrarComida {
  static async execute(
    id_usuario: number,
    data: REQ_RegistrarComida,
  ): Promise<ApiResponse> {
    try {
      // Procesar fechas si existen
      const payload: any = { ...data };
      if (data.fecha_compra) payload.fecha_compra = new Date(data.fecha_compra);
      if (data.hora_compra) payload.hora_compra = new Date(data.hora_compra);
      if (data.fecha_vencimiento)
        payload.fecha_vencimiento = new Date(data.fecha_vencimiento);
      if (data.hora_vencimiento)
        payload.hora_vencimiento = new Date(data.hora_vencimiento);

      const nuevaComida = await ComidaData.create(id_usuario, payload);
      return SendResponse.success(nuevaComida, 'Alimento registrado con éxito');
    } catch (error) {
      console.error('[UC_RegistrarComida] Error:', error);
      return SendResponse.error('Error al registrar el alimento');
    }
  }
}
