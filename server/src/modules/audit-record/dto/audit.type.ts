import { Field, ObjectType } from '@nestjs/graphql';
import { AuditRecordEntity } from '../models/audit-record.entity';

@ObjectType({ description: '审核记录展示' })
export class AuditRecordView extends AuditRecordEntity {
  @Field(() => String, { nullable: true })
  hotelName?: string | null;

  @Field(() => String, { nullable: true })
  operatorName?: string | null;
}

@ObjectType({ description: '审核记录列表' })
export class AuditRecordListResult {
  @Field(() => [AuditRecordView])
  items: AuditRecordView[];

  @Field(() => Number)
  total: number;
}
