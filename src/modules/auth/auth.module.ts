import { Module } from '@nestjs/common';
import { AuthGateway } from './presentation/auth.gateway';
import { AuthService } from './logic/auth.service';
import { AuthRepository } from './data/auth.repository';
import { SupabaseService } from '../../common/services/supabase.service';

@Module({
  providers: [AuthGateway, AuthService, AuthRepository, SupabaseService],
})
export class AuthModule {}
