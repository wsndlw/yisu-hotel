import { ObjectType } from '@nestjs/graphql';
import { createResult } from '../../../common/dto/result.type';
import { AuthPayload } from './auth.type';

@ObjectType()
export class AuthResult extends createResult(AuthPayload) {}
