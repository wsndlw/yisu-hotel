import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType({ description: '酒店-POI 关联' })
@Entity('hotel_poi')
@Index(['hotelId', 'poiId'], { unique: true })
export class HotelPoiEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Index()
  @Column({ type: 'varchar', length: 64 })
  hotelId: string;

  @Field(() => ID)
  @Index()
  @Column({ type: 'varchar', length: 64 })
  poiId: string;
}
