import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType({ description: '房型日历库存（按天覆盖）' })
@Entity('calendar_stock')
@Index(['roomTypeId', 'date'], { unique: true })
export class CalendarStockEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID, { description: '房型ID' })
  @Index()
  @Column({ type: 'varchar', length: 64 })
  roomTypeId: string;

  @Field(() => String, { description: '日期（YYYY-MM-DD）' })
  @Index()
  @Column({ type: 'varchar', length: 10, comment: '日期（YYYY-MM-DD）' })
  date: string;

  @Field(() => Int, { description: '库存（>=0）' })
  @Column({ type: 'int', comment: '库存（>=0）' })
  stock: number;
}
