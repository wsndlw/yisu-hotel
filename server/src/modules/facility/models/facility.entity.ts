import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/**
 * 设施类型枚举
 */
export enum FacilityType {
  /** 标签类 - 用于酒店特色标记 */
  TAG = 'TAG',
  /** 设施类 - 用于酒店硬件设施 */
  FACILITY = 'FACILITY',
}

// 注册枚举到 GraphQL
registerEnumType(FacilityType, {
  name: 'FacilityType',
  description: '设施类型：TAG（标签类）/ FACILITY（设施类）',
  valuesMap: {
    TAG: { description: '标签类 - 用于酒店特色标记（如：近地铁、亲子友好）' },
    FACILITY: { description: '设施类 - 用于酒店硬件设施（如：免费WiFi、停车场）' },
  },
});

/**
 * 设施分类枚举（用于前端分组展示）
 */
export enum FacilityCategory {
  BASIC = 'BASIC', // 基础设施（WiFi, 停车场, 电梯等）
  ROOM = 'ROOM', // 客房设施（空调, 热水, 吹风机等）
  DINING = 'DINING', // 餐饮服务（中餐厅, 西餐厅, 咖啡厅等）
  ENTERTAINMENT = 'ENTERTAINMENT', // 娱乐休闲（健身房, 游泳池, SPA等）
  BUSINESS = 'BUSINESS', // 商务服务（会议室, 商务中心等）
  OTHER = 'OTHER', // 其他
}

registerEnumType(FacilityCategory, {
  name: 'FacilityCategory',
  description: '设施分类',
  valuesMap: {
    BASIC: { description: '基础设施' },
    ROOM: { description: '客房设施' },
    DINING: { description: '餐饮服务' },
    ENTERTAINMENT: { description: '娱乐休闲' },
    BUSINESS: { description: '商务服务' },
    OTHER: { description: '其他' },
  },
});

@ObjectType('Facility', { description: '酒店设施/标签（统一管理）' })
@Entity('facilities')
export class FacilityEntity {
  @Field(() => ID, { description: '设施ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { description: '设施名称' })
  @Index({ unique: false })
  @Column({ type: 'varchar', length: 64, comment: '设施名称' })
  name: string;

  @Field(() => FacilityType, { description: '设施类型' })
  @Index()
  @Column({
    type: 'enum',
    enum: FacilityType,
    default: FacilityType.FACILITY,
    comment: '设施类型：TAG=标签类，FACILITY=设施类',
  })
  type: FacilityType;

  @Field(() => FacilityCategory, { description: '设施分类（必填）' })
  @Column({
    type: 'enum',
    enum: FacilityCategory,
    default: FacilityCategory.OTHER,
    comment: '设施分类：用于前端分组展示',
  })
  category: FacilityCategory;

  @Field(() => Boolean, { description: '是否启用' })
  @Column({ type: 'tinyint', default: 1, comment: '是否启用' })
  enabled: boolean;

  @Field(() => Date, { description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Field(() => Date, { description: '更新时间' })
  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
