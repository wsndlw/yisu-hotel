import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType({ description: '周边 POI（商场/景点等）' })
@Entity('poi')
@Index(['name', 'city', 'type'], { unique: true })
export class PoiEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: '名称' })
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Field(() => String, { description: '城市' })
  @Index()
  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Field(() => String, { description: '类型（shopping/spot/subway/food/medical 等）' })
  @Index()
  @Column({ type: 'varchar', length: 30 })
  type: string;

  @Field(() => Number, { nullable: true, description: '纬度' })
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude?: number | null;

  @Field(() => Number, { nullable: true, description: '经度' })
  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude?: number | null;

  @Field(() => String, { nullable: true, description: '地址' })
  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string | null;

  @Field(() => Number, { defaultValue: 0, description: '基础热度评分' })
  @Column({ type: 'decimal', precision: 6, scale: 2, default: 0 })
  baseScore: number;
}
