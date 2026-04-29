import { Socket } from 'socket.io';
import { User } from '@supabase/supabase-js';
import { IUser } from './usuario.interface';

export interface AuthSocket extends Socket {
  user: User;
  usuario?: IUser; // Usuario de la tabla "usuario" del schema public
}
