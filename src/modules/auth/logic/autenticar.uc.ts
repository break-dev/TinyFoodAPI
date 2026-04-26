import { AuthData } from '../data/auth.data';
import { ApiResponse } from '../../../common/logic/dtos/api.response';
import { SendResponse } from '../../../common/utils/functions/api-response';

export class UC_Autenticar {
  /**
   * Verifica si el usuario ya tiene un perfil en la tabla "usuario" del schema public.
   */
  static async execute(id_supabase: string): Promise<ApiResponse> {
    try {
      const usuario = await AuthData.findUserBySupabaseId(id_supabase);

      if (!usuario) {
        // El Front usará este mensaje para redirigir al Onboarding
        return SendResponse.error('USER_NOT_FOUND');
      }

      return SendResponse.success(usuario, 'Bienvenido de nuevo');
    } catch (error) {
      return SendResponse.error(
        `Error al verificar autenticación: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
    }
  }
}
