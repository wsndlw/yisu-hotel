import { Args, ID, Mutation, Query, Resolver, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { HotelService } from './hotel.service';
import { HotelEntity, HotelStatus } from './models/hotel.entity';
import { HotelListInput, HotelUpsertInput, SetHotelImagesInput } from './dto/hotel.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity, UserRole } from '../user/models/user.entity';
import { HotelResult, HotelResults } from './dto/result-hotel.output';
import * as CODE from '../../common/constants/code';
import { getMsg } from '../../shared/utils/msg';

@Resolver()
export class HotelResolver {
  constructor(private readonly hotelService: HotelService) { }

  @Query(() => HotelResults, { description: '酒店列表查询（支持城市/关键词/星级/标签/设施/状态筛选）' })
  async hotels(@Args('input', { description: '列表查询条件' }) input: HotelListInput): Promise<HotelResults> {
    try {
      const result = await this.hotelService.listHotels(input);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS),
        data: result.list,
        page: {
          total: result.total,
          pageNum: result.page,
          pageSize: result.pageSize,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Query(() => HotelResult, { description: '酒店详情查询（包含标签、设施、房型、图片）' })
  async hotel(@Args('id', { type: () => ID, description: '酒店ID' }) id: string): Promise<HotelResult> {
    try {
      const data = await this.hotelService.getHotelById(id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @Query(() => HotelResults, { description: '我的酒店列表（商户返回自己的酒店；管理员返回全量酒店）' })
  async myHotels(
    @CurrentUser() user: UserEntity,
    @Args('status', { type: () => HotelStatus, nullable: true, description: '按状态筛选（可选）' }) status?: HotelStatus,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page?: number,
    @Args('pageSize', { type: () => Int, nullable: true, defaultValue: 10 }) pageSize?: number,
  ): Promise<HotelResults> {
    try {
      const result = await this.hotelService.myHotels(user, status, page, pageSize);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS),
        data: result.list,
        page: {
          total: result.total,
          pageNum: result.page,
          pageSize: result.pageSize,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 商户
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '商户创建酒店（草稿状态）' })
  async createHotel(
    @CurrentUser() user: UserEntity,
    @Args('input', { description: '酒店信息（包含标签ID/设施ID等）' }) input: HotelUpsertInput,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.createHotel(user, input);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '酒店创建成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '商户更新酒店（仅草稿/未通过可编辑）' })
  async updateHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
    @Args('input', { description: '酒店信息（包含标签ID/设施ID等）' }) input: HotelUpsertInput,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.updateHotel(user, id, input);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '酒店更新成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '商户删除酒店（仅草稿/未通过可删除）' })
  async deleteHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.deleteHotel(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '酒店删除成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '商户提交酒店进入审核' })
  async submitHotelForReview(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.submitForReview(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '提交审核成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '商户撤回审核（审核中 -> 草稿）' })
  async withdrawHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.withdrawHotel(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '撤回成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '商户申请下线（已发布 -> 已下线）' })
  async requestOffline(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.requestOffline(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '已申请下线'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Mutation(() => HotelResult, { description: '设置酒店图片列表（简化：直接传 URL）' })
  async setHotelImages(
    @CurrentUser() user: UserEntity,
    @Args('input', { description: '酒店图片参数' }) input: SetHotelImagesInput,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.setImages(user, input.hotelId, input.urls);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '图片设置成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  // 管理员
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => HotelResult, { description: '管理员审核通过（记录审核通过，不改变发布状态）' })
  async approveHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.approveHotel(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '审核通过'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => HotelResult, { description: '管理员驳回（进入 REJECTED，并记录驳回原因）' })
  async rejectHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
    @Args('reason', { type: () => String, description: '驳回原因' }) reason: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.rejectHotel(user, id, reason);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '已驳回'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => HotelResult, { description: '管理员发布酒店（状态变为 PUBLISHED）' })
  async publishHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.publishHotel(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '发布成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => HotelResult, { description: '管理员下线酒店（状态变为 OFFLINE，可恢复）' })
  async offlineHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.offlineHotel(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '已下线'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => HotelResult, { description: '管理员恢复酒店（OFFLINE -> PUBLISHED）' })
  async restoreHotel(
    @CurrentUser() user: UserEntity,
    @Args('id', { type: () => ID, description: '酒店ID' }) id: string,
  ): Promise<HotelResult> {
    try {
      const data = await this.hotelService.restoreHotel(user, id);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '恢复成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
