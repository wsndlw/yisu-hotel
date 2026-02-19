import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotelImageEntity } from './models/hotel-image.entity';

@Injectable()
export class HotelImageService {
  constructor(
    @InjectRepository(HotelImageEntity)
    private readonly imageRepo: Repository<HotelImageEntity>,
  ) {}

  async getByHotelId(hotelId: string) {
    return this.imageRepo.find({ where: { hotelId }, order: { sortOrder: 'ASC' } });
  }
}
