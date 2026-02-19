import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType({ description: '房型日历价格（按天覆盖）' })
@Entity('calendar_price')
@Index(['roomTypeId', 'date'], { unique: true })
export class CalendarPriceEntity {
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

  @Field(() => Number, { description: '价格（单位：元）' })
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '价格（单位：元）' })
  price: number;
}
