import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '../../user/models/user.entity';
import { RoomTypeEntity } from '../../roomType/models/room-type.entity';
import { HotelImageEntity } from '../../hotelImage/models/hotel-image.entity';
import { FacilityEntity } from '../../facility/models/facility.entity';

export enum HotelStatus {
  DRAFT = 0,
  REVIEWING = 1,
  REJECTED = 2,
  PUBLISHED = 3,
  OFFLINE = 4,
}

registerEnumType(HotelStatus, { name: 'HotelStatus', description: '酒店状态' });

@ObjectType('Hotel', { description: '酒店信息' })
@Entity('hotels')
export class HotelEntity {
  @Field(() => ID, { description: '酒店ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: '酒店名称（中文）' })
  @Index()
  @Column({ type: 'varchar', length: 128, comment: '酒店名称（中文）' })
  nameZh: string;

  @Field(() => String, { nullable: true, description: '酒店名称（英文，可选）' })
  @Column({ type: 'varchar', length: 128, nullable: true, comment: '酒店名称（英文）' })
  nameEn?: string | null;

  @Field(() => String, { nullable: true, description: '酒店业务ID' })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32, nullable: true, comment: '酒店业务ID' })
  hotelID?: string | null;

  @Field(() => String, { nullable: true, description: '酒店地址（用于展示）' })
  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '酒店地址（用于展示）' })
  address?: string | null;

  @Field(() => Number, { nullable: true, description: '纬度（来自地图选点）' })
  @Column({ type: 'double', nullable: true, comment: '纬度' })
  latitude?: number | null;

  @Field(() => Number, { nullable: true, description: '经度（来自地图选点）' })
  @Column({ type: 'double', nullable: true, comment: '经度' })
  longitude?: number | null;

  @Field(() => String, { nullable: true, description: '所属城市' })
  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true, comment: '所属城市' })
  city?: string | null;

  @Field(() => Number, { nullable: true, description: '酒店星级（0-10）' })
  @Column({ type: 'int', nullable: true, comment: '酒店星级（0-10）' })
  starLevel?: number | null;

  @Field(() => Number, { nullable: true, description: '最低起价（自动由房型价格计算）' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, nullable: true, comment: '最低起价（自动由房型价格计算）' })
  miniPrice?: number | null;

  @Field(() => Number, { nullable: true, description: '收藏数（展示用，可后续接真实收藏逻辑）' })
  @Column({ type: 'int', default: 0, nullable: true, comment: '收藏数（展示用）' })
  favoriteCount?: number | null;

  @Field(() => Number, { nullable: true, description: '酒店评分（0-5分）' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, nullable: true, comment: '酒店评分（0-5分）' })
  score?: number | null;

  @Field(() => Number, { nullable: true, description: '距离（公里）' })
  distance?: number | null;

  @Field(() => String, { nullable: true, description: '距离文案' })
  distanceText?: string | null;

  @Field(() => String, { nullable: true, description: '开业时间（YYYY-MM-DD 格式）' })
  @Column({ type: 'date', nullable: true, comment: '开业时间' })
  openSince?: string | null;

  @Field(() => [FacilityEntity], { nullable: true, description: '酒店标签列表（从设施表中筛选 TAG 类型）' })
  @ManyToMany(() => FacilityEntity)
  @JoinTable({
    name: 'hotel_tags',
    joinColumn: { name: 'hotelId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags: FacilityEntity[];

  @Field(() => [FacilityEntity], { description: '酒店设施列表', nullable: true })
  @ManyToMany(() => FacilityEntity)
  @JoinTable({
    name: 'hotel_facilities',
    joinColumn: { name: 'hotelId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'facilityId', referencedColumnName: 'id' },
  })
  facilities?: FacilityEntity[];

  @Field(() => [String], { nullable: true, description: '附近信息（景点/交通/商场等，可选）' })
  @Column({ type: 'json', nullable: true, comment: '附近信息' })
  nearby?: string[] | null;

  @Field(() => String, { nullable: true, description: '优惠/折扣描述（可选）' })
  @Column({ type: 'text', nullable: true, comment: '优惠/折扣描述' })
  discountInfo?: string | null;

  @Field(() => HotelStatus, { description: '酒店状态' })
  @Index()
  @Column({ type: 'int', default: HotelStatus.DRAFT, comment: '酒店状态' })
  status: HotelStatus;

  @Field(() => String, { nullable: true, description: '驳回原因（审核不通过时填写）' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '驳回原因' })
  rejectReason?: string | null;

  @Field(() => ID, { description: '所属商户ID' })
  @Index()
  @Column({ type: 'uuid', comment: '所属商户ID' })
  merchantId: string;

  @Field(() => UserEntity, { description: '所属商户信息', nullable: true })
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'merchantId' })
  merchant?: UserEntity;

  @Field(() => [RoomTypeEntity], { description: '房型列表' })
  @OneToMany(() => RoomTypeEntity, (rt) => rt.hotel)
  roomTypes: RoomTypeEntity[];

  @Field(() => [HotelImageEntity], { description: '图片列表' })
  @OneToMany(() => HotelImageEntity, (img) => img.hotel)
  images: HotelImageEntity[];

  @Field(() => Date, { description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date, { description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

   @Field(() => Boolean, { description: '是否曾发布过(用于区分草稿类型)' })
  @Index()
  @Column({ type: 'tinyint', width: 1, default: 0, comment: '是否曾发布过(0=未发布,1=已发布过)' })
  hasEverPublished: boolean;
}
