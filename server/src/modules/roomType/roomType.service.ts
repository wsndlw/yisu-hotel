import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomTypeEntity } from './models/room-type.entity';
import { RoomTypeOpsInput, RoomTypeUpsertInput } from '../hotel/dto/hotel.input';

@Injectable()
export class RoomTypeService {
  constructor(
    @InjectRepository(RoomTypeEntity)
    private readonly roomRepo: Repository<RoomTypeEntity>,
  ) {}

  async upsertRoomType(hotelId: string, roomTypeId: string | null, input: RoomTypeUpsertInput) {
    if (roomTypeId) {
      const rt = await this.roomRepo.findOne({ where: { id: roomTypeId, hotelId } });
      if (!rt) throw new BadRequestException('房型不存在');
      Object.assign(rt, {
        name: input.name,
        basePrice: input.basePrice,
        maxGuests: input.maxGuests ?? null,
        bedType: input.bedType ?? null,
        stock: input.stock ?? null,
        images: input.images ?? null,
        isOnSale: input.isOnSale ?? null,
        hasBreakfast: input.hasBreakfast ?? null,
        refundable: input.refundable ?? null,
        area: input.area ?? null,
        floor: input.floor ?? null,
        hasWindow: input.hasWindow ?? null,
        sortOrder: input.sortOrder ?? rt.sortOrder,
      });
      return this.roomRepo.save(rt);
    }

    const rt = this.roomRepo.create({
      hotelId,
      name: input.name,
      basePrice: input.basePrice,
      maxGuests: input.maxGuests ?? null,
      bedType: input.bedType ?? null,
      stock: input.stock ?? null,
      images: input.images ?? null,
      isOnSale: input.isOnSale ?? null,
      hasBreakfast: input.hasBreakfast ?? null,
      refundable: input.refundable ?? null,
      area: input.area ?? null,
      floor: input.floor ?? null,
      hasWindow: input.hasWindow ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
    return this.roomRepo.save(rt);
  }

  async getRoomTypeById(roomTypeId: string) {
    const rt = await this.roomRepo.findOne({ where: { id: roomTypeId } });
    if (!rt) throw new BadRequestException('房型不存在');
    return rt;
  }

  async updateRoomOps(roomTypeId: string, input: RoomTypeOpsInput) {
    const rt = await this.getRoomTypeById(roomTypeId);
    Object.assign(rt, {
      basePrice: input.basePrice ?? rt.basePrice,
      stock: input.stock ?? rt.stock,
      isOnSale: input.isOnSale ?? rt.isOnSale,
      hasBreakfast: input.hasBreakfast ?? rt.hasBreakfast,
      refundable: input.refundable ?? rt.refundable,
    });
    return this.roomRepo.save(rt);
  }

  async deleteRoomType(roomTypeId: string) {
    const rt = await this.getRoomTypeById(roomTypeId);
    await this.roomRepo.remove(rt);
    return true;
  }

  async listByHotelId(hotelId: string): Promise<RoomTypeEntity[]> {
    return this.roomRepo.find({ where: { hotelId } });
  }
}
