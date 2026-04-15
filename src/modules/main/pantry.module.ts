import { Module } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { PantryGateway } from './pantry.gateway';

@Module({
  providers: [PantryGateway, PantryService],
})
export class PantryModule {}
