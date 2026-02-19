import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '../models/user.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => UserRole)
  role: UserRole;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
