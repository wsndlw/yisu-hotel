import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Page {
  @Field(() => Int, { description: '总条数' })
  total: number;

  @Field(() => Int, { description: '当前页码', nullable: true })
  pageNum?: number;

  @Field(() => Int, { description: '每页数量', nullable: true })
  pageSize?: number;
}
