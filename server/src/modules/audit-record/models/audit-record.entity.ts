import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum HotelAuditAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  PUBLISH = 'PUBLISH',
  OFFLINE = 'OFFLINE',
  RESTORE = 'RESTORE',
  WITHDRAW = 'WITHDRAW',
  OFFLINE_REQUEST = 'OFFLINE_REQUEST',
}

registerEnumType(HotelAuditAction, { name: 'HotelAuditAction', description: '酒店审核/发布动作' });

@ObjectType('HotelAuditRecord', { description: '酒店审核记录' })
@Entity('hotel_audit_records')
export class AuditRecordEntity {
  @Field(() => ID, { description: '审核记录ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID, { description: '酒店ID' })
  @Index()
  @Column({ type: 'uuid', comment: '酒店ID' })
  hotelId: string;

  @Field(() => HotelAuditAction, { description: '动作类型' })
  @Column({ type: 'simple-enum', enum: HotelAuditAction, comment: '动作类型' })
  action: HotelAuditAction;

  @Field(() => String, { nullable: true, description: '原因（驳回原因等）' })
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '原因' })
  reason?: string | null;

  @Field(() => ID, { nullable: true, description: '操作人ID' })
  @Column({ type: 'uuid', nullable: true, comment: '操作人ID' })
  operatorId?: string | null;

  @Field(() => Date, { description: '创建时间' })
  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;
}
