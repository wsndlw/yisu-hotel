import { ObjectType } from '@nestjs/graphql';
import { createResult, createResults } from '../../../common/dto/result.type';
import { FacilityEntity } from '../models/facility.entity';

@ObjectType()
export class FacilityResult extends createResult(FacilityEntity) {}

@ObjectType()
export class FacilityResults extends createResults(FacilityEntity) {}
