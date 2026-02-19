import { Field, Int, ObjectType } from '@nestjs/graphql';
import { ClassType } from 'type-graphql';
import { Page } from './page.type';

/**
 * 单条数据返回格式
 */
export interface IResult<T> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 多条数据返回接口
 */
export interface IResults<T> {
  code: number;
  message: string;
  data?: T[];
  page?: Page;
}

/**
 * 创建单条数据返回类型
 */
export function createResult<T extends object>(ItemType: ClassType<T>): ClassType<IResult<T>> {
  @ObjectType()
  class Result implements IResult<T> {
    @Field(() => Int)
    code: number;

    @Field(() => String)
    message: string;

    @Field(() => ItemType, { nullable: true })
    data?: T;
  }
  return Result as any;
}

/**
 * 创建多条数据返回类型
 */
export function createResults<T extends object>(
  ItemType: ClassType<T>,
): ClassType<IResults<T>> {
  @ObjectType()
  class Results implements IResults<T> {
    @Field(() => Int)
    code: number;

    @Field(() => String)
    message: string;

    @Field(() => [ItemType], { nullable: true })
    data?: T[];

    @Field(() => Page, { nullable: true })
    page?: Page;
  }
  return Results as any;
}

/**
 * 基础返回类型
 */
@ObjectType()
export class Result {
  @Field(() => Int)
  code: number;

  @Field(() => String)
  message: string;

  @Field(() => String, { nullable: true })
  data?: string;
}
