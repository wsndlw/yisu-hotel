import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FacilityEntity, FacilityType, FacilityCategory } from './models/facility.entity';
import { FacilityService } from './facility.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/models/user.entity';
import { FacilityResult, FacilityResults } from './dto/result-facility.output';
import { FacilityUpsertInput } from './dto/facility.type';
import { Result } from '../../common/dto/result.type';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';

@Resolver(() => FacilityEntity)
export class FacilityResolver {
  constructor(private readonly facilityService: FacilityService) {}

  // ========== 公共查询（商户/移动端使用） ==========

  @Query(() => FacilityResults, { description: '获取启用的设施列表（用于商户选择与用户筛选）' })
  async facilities(): Promise<FacilityResults> {
    try {
      const data = await this.facilityService.getEnabledFacilities();
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS),
        data,
      };
    } catch (error) {
      console.error('Error fetching facilities:', error);
      return {
        code: 500,
        message: '获取设施失败',
      };
    }
  }

  @Query(() => FacilityResults, { description: '【移动端】获取设施列表 - 用于筛选条件' })
  async getFacilitiesForH5(): Promise<FacilityResults> {
    try {
      const data = await this.facilityService.getEnabledFacilities();
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS),
        data,
      };
    } catch (error) {
      console.error('Error fetching facilities for H5:', error);
      return {
        code: 500,
        message: '获取设施失败',
      };
    }
  }

  // ========== 管理员管理 ==========

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => FacilityResults, { description: '获取全部设施（管理员，包含已禁用）' })
  async allFacilities(): Promise<FacilityResults> {
    try {
      const data = await this.facilityService.getAllFacilities();
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS),
        data,
      };
    } catch (error) {
      console.error('Error fetching all facilities:', error);
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => FacilityResult, { description: '新增/更新设施（管理员）' })
  async upsertFacility(
    @Args('input') input: FacilityUpsertInput,
  ): Promise<FacilityResult> {
    try {
      const data = await this.facilityService.upsertFacility(
        input.id || null,
        input.name,
        input.type,
        input.category,
      );
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, input.id ? '设施更新成功' : '设施添加成功'),
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => FacilityResult, { description: '启用/禁用设施（管理员）' })
  async setFacilityEnabled(
    @Args('id', { type: () => ID, description: '设施ID' }) id: string,
    @Args('enabled', { type: () => Boolean, description: '是否启用' }) enabled: boolean,
  ): Promise<FacilityResult> {
    try {
      const data = await this.facilityService.setEnabled(id, enabled);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, enabled ? '设施已启用' : '设施已禁用'),
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => FacilityResult, { description: '删除设施（管理员，软删除=禁用）' })
  async deleteFacility(@Args('id', { type: () => ID, description: '设施ID' }) id: string): Promise<FacilityResult> {
    try {
      const data = await this.facilityService.softDelete(id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '设施已删除'),
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => Result, { description: '彻底删除设施（管理员）。若设施被酒店引用，则不允许删除' })
  async hardDeleteFacility(@Args('id', { type: () => ID, description: '设施ID' }) id: string): Promise<Result> {
    try {
      await this.facilityService.hardDelete(id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '设施已永久删除'),
      };
    } catch (error) {
      throw error;
    }
  }
}
