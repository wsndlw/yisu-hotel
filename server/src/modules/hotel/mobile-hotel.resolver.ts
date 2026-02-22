import { Args, Query, Resolver } from '@nestjs/graphql';
import { HotelService } from './hotel.service';
import { BannerService } from '../banner/banner.service';
import { FacilityService } from '../facility/facility.service';
import { RoomTypeService } from '../roomType/roomType.service';
import { CalendarService } from '../calendar/calendar.service';
import { PoiService } from '../poi/poi.service';
import { NearbyPoiItem } from '../poi/dto/poi.type';
import { FacilityType } from '../facility/models/facility.entity';
import { SearchHotelInput, MobileHotelSort } from './dto/mobile.input';
import {
  MobileHomeConfigResult,
  HotelConnectionResult,
  MobileHotelDetailResult,
  MobileHotelDetail,
  MobileRoom,
} from './dto/mobile.type';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';

@Resolver()
export class MobileHotelResolver {
  constructor(
    private readonly hotelService: HotelService,
    private readonly bannerService: BannerService,
    private readonly facilityService: FacilityService,
    private readonly roomTypeService: RoomTypeService,
    private readonly calendarService: CalendarService,
    private readonly poiService: PoiService,
  ) { }

  @Query(() => MobileHomeConfigResult, { description: '移动端首页聚合配置' })
  async homeConfig(): Promise<MobileHomeConfigResult> {
    const now = new Date();
    const [rawBanners, cities, facilities] = await Promise.all([
      this.bannerService.banners(),
      this.hotelService.getHotCities(),
      this.facilityService.getEnabledFacilities(),
    ]);

    const banners = rawBanners.filter((b) => {
      if (b.startAt && b.startAt > now) return false;
      if (b.endAt && b.endAt < now) return false;
      return true;
    });

    return {
      code: CODE.SUCCESS,
      message: getMsg(CODE.SUCCESS),
      data: {
        banners: banners.map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          redirectHotelId: b.targetHotelId,
        })),
        cities: cities.map((c) => ({
          code: c.cityCode,
          name: c.cityName,
        })),
        facilities: facilities.map((t) => ({ id: t.id, name: t.name })),
      },
    };
  }

  @Query(() => HotelConnectionResult, { description: '移动端搜索酒店列表' })
  async searchHotels(
    @Args('input', { description: '支持城市、日期、设施等' }) input: SearchHotelInput,
  ): Promise<HotelConnectionResult> {
    const page = input.pagination?.page ?? 1;
    const pageSize = input.pagination?.pageSize ?? 10;
    const hasGeo = input.latitude != null && input.longitude != null;
    const sortBy =
      input.sort === MobileHotelSort.PRICE_ASC
        ? 'price'
        : input.sort === MobileHotelSort.SCORE_DESC
          ? 'starLevel'
          : input.sort === MobileHotelSort.DISTANCE_ASC
            ? 'distance'
            : hasGeo
              ? 'distance'
              : 'updatedAt';

    // 旧版：不含 POI 筛选逻辑
    // const result = await this.hotelService.listHotelsForH5({ ... })

    const result = await this.hotelService.listHotelsForH5({
      city: input.cityCode,
      keyword: input.keyword,
      minPrice: input.priceMin,
      maxPrice: input.priceMax,
      starLevel: input.starRating,
      facilityIds: input.facilityIds,
      bedType: input.bedType,
      guestCount: input.guestCount,
      latitude: input.latitude,
      longitude: input.longitude,
      distanceMax: input.distanceMax,
      page,
      pageSize,
      sortBy,
    });

    const rawItems = Array.isArray(result)
      ? result
      : result.items || result.list || [];

    let items = rawItems.map((hotel: any) => ({
      id: hotel.id,
      hotelNo: hotel.hotelID || null,
      name: hotel.nameZh,
      coverImage: hotel.images?.[0]?.url || null,
      score: typeof hotel.score === 'number' ? hotel.score : null,
      minPrice: hotel.miniPrice ?? null,
      distance: hotel.distance ?? null,
      distanceText: hotel.distanceText ?? null,
      address: hotel.address ?? null,
      favoriteCount: hotel.favoriteCount ?? 0,
      latitude: hotel.latitude ?? null,
      longitude: hotel.longitude ?? null,
      roomType: Array.isArray(hotel.roomTypes) ? hotel.roomTypes ?? null : null,
    }));
    console.log('items', items);
    // POI 筛选（单选）
    if (input.poiId) {
      const poi = await this.poiService.getPoiById(input.poiId);
      items = items.filter((h: any) => {
        if (!h.latitude || !h.longitude || !poi?.latitude || !poi?.longitude) return false;
        const distance = this.poiService.getDistanceKm(
          { latitude: h.latitude, longitude: h.longitude },
          { latitude: poi.latitude, longitude: poi.longitude },
        );
        return distance <= (input.distanceMax ?? 5);
      });
    }

    if (input.checkIn && input.checkOut) {
      const checkIn = this.normalizeDate(input.checkIn);
      const checkOut = this.normalizeDate(input.checkOut);
      const nights = checkIn && checkOut ? this.calculateNights(checkIn, checkOut) : 0;

      if (!checkIn || !checkOut || nights <= 0) {
        // 无效日期范围时不做库存过滤
      } else {
        const availableItems: typeof items = [];
        for (const hotel of items) {
          const roomTypes = await this.roomTypeService.listByHotelId(hotel.id);
          if (roomTypes.length === 0) continue;
          let hasAvailable = false;
          let minPrice = Infinity;
          for (const room of roomTypes) {
            const available = await this.calendarService.checkAvailability(room.id, checkIn, checkOut);
            if (available) {
              hasAvailable = true;
              const totalPrice = await this.calendarService.getDateRangePrice(room.id, checkIn, checkOut);
              const avgPrice = totalPrice / nights;
              if (avgPrice < minPrice) minPrice = avgPrice;
            }
          }
          if (hasAvailable) {
            availableItems.push({
              ...hotel,
              minPrice: minPrice === Infinity ? hotel.minPrice : minPrice,
            });
          }
        }
        items = availableItems;
      }
    }
    return {
      code: CODE.SUCCESS,
      message: getMsg(CODE.SUCCESS),
      data: {
        items,
        total: items.length,
      },
    };
  }

  private normalizeDate(value: string | null | undefined): string | null {
    if (!value) return null;
    // 允许传入带时间的 ISO 或 'YYYY-MM-DD'，统一截断到日期
    const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  private calculateNights(checkIn: string, checkOut: string): number {
    const d1 = new Date(checkIn + 'T00:00:00.000Z');
    const d2 = new Date(checkOut + 'T00:00:00.000Z');
    return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / (24 * 3600 * 1000)));
  }

  @Query(() => MobileHotelDetailResult, { description: '移动端酒店详情' })
  async hotelDetail(
    @Args('id') id: string,
    @Args('checkIn', { nullable: true }) checkIn?: string,
    @Args('checkOut', { nullable: true }) checkOut?: string,
  ): Promise<MobileHotelDetailResult> {
    const hotel = await this.hotelService.getHotelForH5(id);
    const rawRooms = (hotel.roomTypes || []).slice().sort((a: any, b: any) => Number(a.basePrice) - Number(b.basePrice));
    const rooms: MobileRoom[] = [];

    for (const room of rawRooms) {
      let coverImage: string | null = null;
      if (room.images) {
        try {
          const urls = JSON.parse(room.images);
          coverImage = Array.isArray(urls) ? urls[0] : null;
        } catch {
          coverImage = null;
        }
      }

      let price = Number(room.basePrice);
      let stock = room.stock ?? null;
      let available = true;

      if (checkIn && checkOut) {
        available = await this.calendarService.checkAvailability(room.id, checkIn, checkOut);
        if (available) {
          const totalPrice = await this.calendarService.getDateRangePrice(room.id, checkIn, checkOut);
          const nights = this.calculateNights(checkIn, checkOut);
          price = nights > 0 ? totalPrice / nights : Number(room.basePrice);
        }
        stock = available ? stock : 0;
      }

      rooms.push({
        id: room.id,
        title: room.name,
        coverImage,
        price,
        stock,
        bedType: room.bedType ?? null,
        hasBreakfast: room.hasBreakfast ?? null,
        refundable: room.refundable ?? null,
        area: room.area ?? null,
        hasWindow: room.hasWindow ?? null,
      });
    }

    const nearbyPoi = await this.poiService.getNearbyPoiByHotel(hotel, undefined, 5, 10);

    const detail: MobileHotelDetail = {
      id: hotel.id,
      name: hotel.nameZh,
      address: hotel.address ?? null,
      description: hotel.discountInfo ?? null,
      images: (hotel.images || []).map((img: any) => img.url),
      favoriteCount: hotel.favoriteCount ?? 0,
      facilities: (hotel.facilities || []).map((f: any) => f.name),
      rooms,
      nearbyPoi,
    };

    return {
      code: CODE.SUCCESS,
      message: getMsg(CODE.SUCCESS),
      data: detail,
    };
  }
}