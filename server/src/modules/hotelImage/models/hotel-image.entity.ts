import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { HotelEntity } from '../../hotel/models/hotel.entity';

@ObjectType('HotelImage', { description: '酒店图片' })
@Entity('hotel_images')
export class HotelImageEntity {
  @Field(() => ID, { description: '图片ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID, { description: '所属酒店ID' })
  @Index()
  @Column({ type: 'uuid', comment: '所属酒店ID' })
  hotelId: string;

  @ManyToOne(() => HotelEntity, (hotel) => hotel.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotelId' })
  hotel: HotelEntity;

  @Field(() => String, { description: '图片URL' })
  @Column({ type: 'varchar', length: 512, comment: '图片URL' })
  url: string;

  @Field(() => Number, { description: '排序（越小越靠前）' })
  @Column({ type: 'int', default: 0, comment: '排序（越小越靠前）' })
  sortOrder: number;

  @Field(() => Date, { description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date, { description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
