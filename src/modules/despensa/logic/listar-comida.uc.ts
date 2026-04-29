import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';
import { ComidaData } from '../data/comida.data';

export class UC_ListarComida {
  static async execute(id_usuario: number): Promise<ApiResponse> {
    try {
      const comidas = await ComidaData.findAllByUserId(id_usuario);
      return SendResponse.success(comidas, 'Alimentos listados con éxito');
    } catch (error) {
      console.error('[UC_ListarComida] Error:', error);
      return SendResponse.error('Error al listar los alimentos');
    }
  }
}
