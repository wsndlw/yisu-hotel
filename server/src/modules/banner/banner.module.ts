import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannerEntity } from './models/banner.entity';
import { BannerResolver } from './banner.resolver';
import { BannerService } from './banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([BannerEntity])],
  providers: [BannerService, BannerResolver],
  exports: [BannerService],
})
export class BannerModule {}
