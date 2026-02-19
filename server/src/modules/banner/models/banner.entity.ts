import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@ObjectType('Banner', { description: '首页 Banner（移动端首页轮播）' })
@Entity('banners')
export class BannerEntity {
  @Field(() => ID, { description: 'Banner ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: '标题' })
  @Column({ type: 'varchar', length: 64, comment: '标题' })
  title: string;

  @Field(() => String, { description: '图片地址' })
  @Column({ type: 'varchar', length: 512, comment: '图片地址' })
  imageUrl: string;

  @Field(() => String, { description: '跳转酒店ID' })
  @Index()
  @Column({ type: 'uuid', comment: '跳转酒店ID' })
  targetHotelId: string;

  @Field(() => Int, { description: '排序（数值越小越靠前）' })
  @Index()
  @Column({ type: 'int', default: 0, comment: '排序（数值越小越靠前）' })
  sort: number;

  @Field(() => Boolean, { description: '是否启用' })
  @Index()
  @Column({ type: 'tinyint', default: 1, comment: '是否启用' })
  enabled: boolean;

  @Field(() => Date, { nullable: true, description: '开始时间（可选）' })
  @Column({ type: 'datetime', nullable: true, comment: '开始时间' })
  startAt?: Date | null;

  @Field(() => Date, { nullable: true, description: '结束时间（可选）' })
  @Column({ type: 'datetime', nullable: true, comment: '结束时间' })
  endAt?: Date | null;

  @Field(() => Date, { description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date, { description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
