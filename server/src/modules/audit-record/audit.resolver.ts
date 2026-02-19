import { Args, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditRecordQueryInput } from './dto/audit.input';
import { AuditRecordListResult } from './dto/audit.type';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/models/user.entity';

@Resolver()
export class AuditResolver {
  constructor(private readonly auditService: AuditService) {}

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => AuditRecordListResult, { description: '审核记录列表（管理员）' })
  auditRecords(@Args('input') input: AuditRecordQueryInput) {
    return this.auditService.listRecords(input);
  }
}
