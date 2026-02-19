import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { BannerEntity } from './models/banner.entity';
import { BannerService } from './banner.service';
import { BannerUpsertInput } from './dto/banner.input';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../user/models/user.entity';

@Resolver(() => BannerEntity)
export class BannerResolver {
  constructor(private readonly banners: BannerService) {}

  @Query(() => [BannerEntity], { description: '获取首页 Banner 列表（移动端）' })
  async bannersQuery() {
    const now = new Date();
    const list = await this.banners.banners();
    return list.filter((b) => {
      if (b.startAt && b.startAt > now) return false;
      if (b.endAt && b.endAt < now) return false;
      return true;
    });
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Query(() => [BannerEntity], { description: '获取全部 Banner（管理端，包含禁用）' })
  allBannersQuery() {
    return this.banners.allBanners();
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => BannerEntity, { description: '新增/更新 Banner（管理员）' })
  upsertBanner(
    @Args('id', { type: () => ID, nullable: true, description: 'Banner ID（为空则新增）' }) id: string | null,
    @Args('input', { description: 'Banner 配置' }) input: BannerUpsertInput,
  ) {
    return this.banners.upsert(id, input);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => BannerEntity, { description: '启用/禁用 Banner（管理员）' })
  setBannerEnabled(
    @Args('id', { type: () => ID, description: 'Banner ID' }) id: string,
    @Args('enabled', { description: '是否启用' }) enabled: boolean,
  ) {
    return this.banners.setEnabled(id, enabled);
  }

  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean, { description: '删除 Banner（管理员）' })
  deleteBanner(@Args('id', { type: () => ID, description: 'Banner ID' }) id: string) {
    return this.banners.remove(id);
  }
}
