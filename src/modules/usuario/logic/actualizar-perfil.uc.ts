import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';
import { UserData } from '../data/usuario.data';

interface Condicion {
  nombre: string;
  descripcion: string;
}

export class UC_ActualizarPerfil {
  static async execute(
    id: number,
    data: {
      peso?: number;
      talla?: number;
      nivel_actividad?: number;
      informacion_medica?: Condicion[];
      alimentos_prohibidos?: string[];
      preferencias?: string[];
      fecha_nacimiento?: string;
    },
  ): Promise<ApiResponse> {
    try {
      const usuario = await UserData.findById(id);
      if (!usuario) {
        return SendResponse.error('USER_NOT_FOUND');
      }

      // Convertir fecha string a Date para Prisma
      const fecha_nacimiento = data.fecha_nacimiento
        ? new Date(data.fecha_nacimiento)
        : undefined;

      const usuarioActualizado = await UserData.actualizarPerfil(id, {
        ...data,
        fecha_nacimiento,
      });

      return SendResponse.success(
        usuarioActualizado,
        'Perfil actualizado con éxito',
      );
    } catch (error) {
      console.error('[UC_ActualizarPerfil] Error:', error);
      return SendResponse.error('Error al actualizar el perfil');
    }
  }
}