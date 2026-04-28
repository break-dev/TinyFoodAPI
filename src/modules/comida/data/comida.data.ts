import { PrismaService } from '../../../common/service/prisma.service';

export class ComidaData {
  /**
   * Registra una nueva comida vinculada al usuario.
   */
  static async crearComida(payload: {
    id_usuario: number;
    nombre: string;
    cantidad: string;
    descripcion?: string;
    incluir_hora?: boolean;
    fecha_compra?: Date;
    fecha_vencimiento?: Date;
    tags?: string;
    estado?: string;
  }) {
    return PrismaService.db.comida.create({
      data: {
        id_usuario: payload.id_usuario,
        nombre: payload.nombre,
        cantidad: payload.cantidad,
        descripcion: payload.descripcion,
        incluir_hora: payload.incluir_hora ?? false,
        fecha_compra: payload.fecha_compra,
        fecha_vencimiento: payload.fecha_vencimiento,
        tags: payload.tags,
        estado: payload.estado ?? 'Por consumir',
      },
    });
  }

  /**
   * Obtiene todas las comidas del usuario ordenadas por fecha de creación.
   */
  static async listarComidas(id_usuario: number) {
    return PrismaService.db.comida.findMany({
      where: { id_usuario },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene una comida por su ID verificando que pertenezca al usuario.
   */
  static async obtenerComida(id: number, id_usuario: number) {
    return PrismaService.db.comida.findFirst({
      where: { id, id_usuario },
    });
  }

  /**
   * Actualiza los campos de una comida existente.
   */
  static async editarComida(
    id: number,
    id_usuario: number,
    cambios: {
      nombre?: string;
      cantidad?: string;
      descripcion?: string;
      incluir_hora?: boolean;
      fecha_compra?: Date;
      fecha_vencimiento?: Date;
      tags?: string;
      estado?: string;
    },
  ) {
    return PrismaService.db.comida.updateMany({
      where: { id, id_usuario },
      data: cambios,
    });
  }

  /**
   * Elimina una comida verificando que pertenezca al usuario.
   */
  static async eliminarComida(id: number, id_usuario: number) {
    return PrismaService.db.comida.deleteMany({
      where: { id, id_usuario },
    });
  }
}
