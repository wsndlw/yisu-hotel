import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { HotelAuditAction } from '../models/audit-record.entity';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@InputType({ description: '审核记录查询' })
export class AuditRecordQueryInput {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  hotelId?: string;

  @Field(() => HotelAuditAction, { nullable: true })
  @IsOptional()
  action?: HotelAuditAction;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  operatorId?: string;

  @Field(() => String, { nullable: true, description: '开始日期（YYYY-MM-DD）' })
  @IsOptional()
  @Matches(DATE_RE)
  startDate?: string;

  @Field(() => String, { nullable: true, description: '结束日期（YYYY-MM-DD）' })
  @IsOptional()
  @Matches(DATE_RE)
  endDate?: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Field(() => Int, { defaultValue: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number;
}
