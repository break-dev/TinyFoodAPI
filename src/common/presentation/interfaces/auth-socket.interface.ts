import { Socket } from 'socket.io';
import { User } from '@supabase/supabase-js';

export interface AuthSocket extends Socket {
  user: User;
  dbUser?: unknown; // Usuario de la tabla "usuario" del schema public(unknown para seguridad de tipos)
}
