import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';
import { ComidaData } from '../data/comida.data';

export class UC_EliminarComida {
  static async execute(id_usuario: number, id: number): Promise<ApiResponse> {
    try {
      // Verificar pertenencia
      const comida = await ComidaData.findById(id);
      if (!comida || comida.id_usuario !== id_usuario) {
        return SendResponse.error('Alimento no encontrado o no autorizado');
      }

      await ComidaData.delete(id);
      return SendResponse.success(null, 'Alimento eliminado con éxito');
    } catch (error) {
      console.error('[UC_EliminarComida] Error:', error);
      return SendResponse.error('Error al eliminar el alimento');
    }
  }
}
