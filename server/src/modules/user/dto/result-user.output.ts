import { ObjectType } from '@nestjs/graphql';
import { createResult } from '../../../common/dto/result.type';
import { UserEntity } from '../models/user.entity';

@ObjectType()
export class UserResult extends createResult(UserEntity) {}
