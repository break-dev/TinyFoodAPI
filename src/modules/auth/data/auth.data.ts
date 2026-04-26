import { PrismaService } from '../../../common/service/prisma.service';

export class AuthData {
  /** Obtener usuario por el ID de Supabase (UUID) */
  static async findUserBySupabaseId(id_supabase: string) {
    return PrismaService.db.usuario.findUnique({
      where: { id_supabase },
    });
  }

  /**
   * Registra al usuario en el schema public vinculándolo con su ID de Supabase.
   */
  static async crearUsuario(payload: {
    id_supabase: string;
    nombre: string;
    url_foto?: string | null;
    peso?: number;
    talla?: number;
    fecha_nacimiento?: Date;
    nivel_actividad?: number;
    informacion_medica?: string;
    alimentos_prohibidos?: string;
    preferencias?: string;
  }) {
    return PrismaService.db.usuario.create({
      data: {
        id_supabase: payload.id_supabase,
        nombre: payload.nombre,
        url_foto: payload.url_foto,
        peso: payload.peso,
        talla: payload.talla,
        fecha_nacimiento: payload.fecha_nacimiento,
        nivel_actividad: payload.nivel_actividad,
        informacion_medica: payload.informacion_medica,
        alimentos_prohibidos: payload.alimentos_prohibidos,
        preferencias: payload.preferencias,
      },
    });
  }
}
