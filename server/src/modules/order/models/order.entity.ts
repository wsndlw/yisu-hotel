import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: '订单状态',
});

@ObjectType('Order', { description: '酒店订单' })
@Entity('orders')
@Index(['userId', 'createdAt'])
export class OrderEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID, { description: '下单用户ID' })
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Field(() => ID, { description: '酒店ID' })
  @Index()
  @Column({ type: 'uuid' })
  hotelId: string;

  @Field(() => ID, { description: '房型ID' })
  @Index()
  @Column({ type: 'uuid' })
  roomTypeId: string;

  @Field(() => String, { description: '酒店名称快照' })
  @Column({ type: 'varchar', length: 128 })
  hotelName: string;

  @Field(() => String, { description: '房型名称快照' })
  @Column({ type: 'varchar', length: 64 })
  roomTypeName: string;

  @Field(() => String, { description: '入住日期（YYYY-MM-DD）' })
  @Column({ type: 'varchar', length: 10 })
  checkIn: string;

  @Field(() => String, { description: '离店日期（YYYY-MM-DD）' })
  @Column({ type: 'varchar', length: 10 })
  checkOut: string;

  @Field(() => Int, { description: '入住人数' })
  @Column({ type: 'int' })
  guestCount: number;

  @Field(() => String, { description: '入住人姓名' })
  @Column({ type: 'varchar', length: 64 })
  guestName: string;

  @Field(() => String, { description: '入住人手机号' })
  @Column({ type: 'varchar', length: 32 })
  guestPhone: string;

  @Field(() => Number, { description: '下单总金额（服务端计算快照）' })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalAmount: number;

  // 仅记录实际扣减过库存的夜晚；基础库存为空（不限库存）的日期不会写入。
  @Column({ type: 'json', nullable: true })
  inventoryDates?: string[] | null;

  @Field(() => OrderStatus)
  @Index()
  @Column({ type: 'simple-enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;
}
