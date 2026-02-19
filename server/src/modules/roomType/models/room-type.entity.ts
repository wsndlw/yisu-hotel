import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { HotelEntity } from '../../hotel/models/hotel.entity';

@ObjectType({ description: '房型实体' })
@Entity('room_types')
export class RoomTypeEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Index()
  @Column({ type: 'uuid' })
  hotelId: string;

  @Field(() => String)
  @Column({ type: 'varchar', length: 64, comment: '房型名称' })
  name: string;

  @Field(() => Number)
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '房型基础价格' })
  basePrice: number;

  @Field(() => Number, { nullable: true, description: '可住人数（可选）' })
  @Column({ type: 'int', nullable: true, comment: '可住人数' })
  maxGuests?: number | null;

  @Field(() => String, { nullable: true, description: '床型（可选）' })
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '床型' })
  bedType?: string | null;

  @Field(() => Number, { nullable: true, description: '库存（可选）' })
  @Column({ type: 'int', nullable: true, comment: '库存' })
  stock?: number | null;

  @Field(() => String, { nullable: true, description: '房型图片（JSON 字符串）' })
  @Column({ type: 'text', nullable: true, comment: '房型图片' })
  images?: string | null;

  @Field(() => Boolean, { nullable: true, description: '是否开售' })
  @Column({ type: 'tinyint', nullable: true, comment: '是否开售' })
  isOnSale?: boolean | null;

  @Field(() => Boolean, { nullable: true, description: '含早' })
  @Column({ type: 'tinyint', nullable: true, comment: '含早' })
  hasBreakfast?: boolean | null;

  @Field(() => Boolean, { nullable: true, description: '可退' })
  @Column({ type: 'tinyint', nullable: true, comment: '可退' })
  refundable?: boolean | null;

  @Field(() => Number, { nullable: true, description: '房间面积(㎡)' })
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true, comment: '房间面积(㎡)' })
  area?: number | null;

  @Field(() => String, { nullable: true, description: '楼层' })
  @Column({ type: 'varchar', length: 32, nullable: true, comment: '楼层' })
  floor?: string | null;

  @Field(() => Boolean, { nullable: true, description: '有窗' })
  @Column({ type: 'tinyint', nullable: true, comment: '有窗' })
  hasWindow?: boolean | null;

  @Field(() => Number)
  @Column({ type: 'int', default: 0, comment: '排序' })
  sortOrder: number;

  @Field(() => Date)
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => HotelEntity, (hotel) => hotel.roomTypes, { onDelete: 'CASCADE' })
  hotel: HotelEntity;
}
