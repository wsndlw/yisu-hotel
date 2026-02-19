import { Field, ObjectType } from '@nestjs/graphql';
import { PoiEntity } from '../models/poi.entity';

@ObjectType({ description: '酒店附近 POI（含距离）' })
export class NearbyPoiItem extends PoiEntity {
  @Field(() => Number, { description: '距离（km）' })
  distanceKm: number;
}
