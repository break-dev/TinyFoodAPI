import { ApiResponse } from '../../logic/dtos/api.response';

export const SendResponse = {
  // Función para respuestas exitosas
  success: <T>(
    data: T,
    message: string | string[] | null = null,
  ): ApiResponse<T> => {
    return {
      success: true,
      data,
      message,
    };
  },

  // Función para respuestas de error
  error: <T = any>(
    message: string | string[] | null = null,
  ): ApiResponse<T> => {
    return {
      success: false,
      data: null,
      message,
    };
  },
};
