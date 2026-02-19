import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomTypeEntity } from './models/room-type.entity';
import { RoomTypeService } from './roomType.service';
import { RoomTypeResolver } from './roomType.resolver';
import { HotelModule } from '../hotel/hotel.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoomTypeEntity]), forwardRef(() => HotelModule)],
  providers: [RoomTypeService, RoomTypeResolver],
  exports: [RoomTypeService, TypeOrmModule],
})
export class RoomTypeModule {}
