import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../data/auth.repository';

@Injectable()
export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  /**
   * Busca el perfil del usuario en la tabla `usuario`.
   * Si no existe, lo crea con los datos de Supabase Auth.
   */
  async syncProfile(userId: string, email: string, nombre?: string) {
    const existing = await this.authRepository.findByUserId(userId);
    if (existing) return existing;

    return this.authRepository.upsertUser({
      id: userId,
      correo: email,
      nombre: nombre ?? email.split('@')[0],
    });
  }

  /** Retorna el perfil completo del usuario desde la tabla `usuario`. */
  async getProfile(userId: string) {
    const profile = await this.authRepository.findByUserId(userId);
    if (!profile) throw new Error('Perfil no encontrado. Ejecutar auth:sync primero.');
    return profile;
  }
}
