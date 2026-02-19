import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PoiEntity } from './models/poi.entity';
import { HotelPoiEntity } from './models/hotel-poi.entity';

@Injectable()
export class PoiService {
  constructor(
    @InjectRepository(PoiEntity) private readonly poiRepo: Repository<PoiEntity>,
    @InjectRepository(HotelPoiEntity) private readonly hotelPoiRepo: Repository<HotelPoiEntity>,
  ) {}

  async upsertPoi(input: Partial<PoiEntity>) {
    const exists = await this.poiRepo.findOne({
      where: { name: input.name, city: input.city, type: input.type },
    });
    if (exists) {
      Object.assign(exists, input);
      return this.poiRepo.save(exists);
    }
    const created = this.poiRepo.create(input);
    return this.poiRepo.save(created);
  }

  async linkHotelPoi(hotelId: string, poiId: string) {
    const exists = await this.hotelPoiRepo.findOne({ where: { hotelId, poiId } });
    if (exists) return exists;
    return this.hotelPoiRepo.save(this.hotelPoiRepo.create({ hotelId, poiId }));
  }

  async listHotelPoiIds(hotelId: string) {
    const list = await this.hotelPoiRepo.find({ where: { hotelId } });
    return list.map((i) => i.poiId);
  }

  async listPoiByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.poiRepo.findByIds(ids);
  }

  async listByCityAndType(city: string, type?: string, keyword?: string, limit = 50) {
    const qb = this.poiRepo.createQueryBuilder('p').where('p.city = :city', { city });
    if (type) qb.andWhere('p.type = :type', { type });
    if (keyword) qb.andWhere('p.name LIKE :kw', { kw: `%${keyword}%` });
    return qb.take(limit).getMany();
  }

  async listPoiForMobile(city: string, type?: string, keyword?: string, limit = 50) {
    return this.listByCityAndType(city, type, keyword, limit);
  }

  async getPoiById(id: string) {
    return this.poiRepo.findOne({ where: { id } });
  }

  getDistanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }

  async getNearbyPoiByHotel(
    hotel: { id: string; city?: string | null; latitude?: number | null; longitude?: number | null },
    type?: string,
    radiusKm = 5,
    limit = 20,
  ) {
    if (!hotel?.latitude || !hotel?.longitude) return [];

    const poiIds = await this.listHotelPoiIds(hotel.id);
    const pois = poiIds.length
      ? await this.listPoiByIds(poiIds)
      : hotel.city
      ? await this.listByCityAndType(hotel.city, type)
      : [];

    const withDistance = pois
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => ({
        ...p,
        distanceKm: haversineKm(hotel.latitude!, hotel.longitude!, Number(p.latitude), Number(p.longitude)),
      }))
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return withDistance;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
