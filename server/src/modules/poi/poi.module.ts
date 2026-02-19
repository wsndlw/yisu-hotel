import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoiEntity } from './models/poi.entity';
import { HotelPoiEntity } from './models/hotel-poi.entity';
import { PoiService } from './poi.service';
import { PoiResolver } from './poi.resolver';
import { HotelModule } from '../hotel/hotel.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([PoiEntity, HotelPoiEntity]), forwardRef(() => HotelModule)],
  providers: [PoiService, PoiResolver],
  exports: [PoiService],
})
export class PoiModule {}
