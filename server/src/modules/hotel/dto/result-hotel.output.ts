import { ObjectType } from '@nestjs/graphql';
import { createResult, createResults } from '../../../common/dto/result.type';
import { HotelEntity } from '../models/hotel.entity';

@ObjectType()
export class HotelResult extends createResult(HotelEntity) {}

@ObjectType()
export class HotelResults extends createResults(HotelEntity) {}
