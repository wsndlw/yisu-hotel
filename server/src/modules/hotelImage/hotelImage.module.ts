import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelImageEntity } from './models/hotel-image.entity';
import { HotelImageService } from './hotelImage.service';

@Module({
  imports: [TypeOrmModule.forFeature([HotelImageEntity])],
  providers: [HotelImageService],
  exports: [HotelImageService, TypeOrmModule],
})
export class HotelImageModule {}
