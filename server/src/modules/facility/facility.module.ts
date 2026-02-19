import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacilityEntity } from './models/facility.entity';
import { FacilityResolver } from './facility.resolver';
import { FacilityService } from './facility.service';

@Module({
  imports: [TypeOrmModule.forFeature([FacilityEntity])],
  providers: [FacilityResolver, FacilityService],
  exports: [FacilityService],
})
export class FacilityModule {}
