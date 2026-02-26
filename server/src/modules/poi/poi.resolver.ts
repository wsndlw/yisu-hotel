import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PoiService } from './poi.service';
import { PoiEntity } from './models/poi.entity';
import { HotelPoiLinkInput, NearbyPoiQueryInput, PoiUpsertInput, PoiListQueryInput } from './dto/poi.input';
import { NearbyPoiItem } from './dto/poi.type';
import { HotelService } from '../hotel/hotel.service';

@Resolver()
export class PoiResolver {
  constructor(
    private readonly poiService: PoiService,
    private readonly hotelService: HotelService,
  ) {}



  @Query(() => [NearbyPoiItem], { description: '查询酒店附近 POI（按距离排序）' })
  async nearbyPoi(@Args('input') input: NearbyPoiQueryInput) {
    const hotel = await this.hotelService.getHotelById(input.hotelId);
    return this.poiService.getNearbyPoiByHotel(
      hotel,
      input.type,
      input.radiusKm ?? 5,
      input.limit ?? 20,
    );
  }

  @Query(() => [PoiEntity], { description: '移动端 POI 列表（按城市/类型/关键词）' })
  async poiList(@Args('input') input: PoiListQueryInput) {
    return this.poiService.listPoiForMobile(input.city, input.type, input.keyword, input.limit ?? 50);
  }
}
