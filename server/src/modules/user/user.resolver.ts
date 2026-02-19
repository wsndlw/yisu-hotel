import { BadRequestException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { UserEntity } from './models/user.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateMeInput } from './dto/user.input';
import { UserService } from './user.service';
import { UserResult } from './dto/result-user.output';
import * as CODE from '../../common/constants/code';
import { getMsg } from 'shared/utils/msg';

@Resolver()
export class UserResolver {
  constructor(private readonly users: UserService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => UserResult, { description: '获取当前登录用户信息' })
  me(@CurrentUser() user: UserEntity): UserResult {
    return {
      code: CODE.SUCCESS,
      message: getMsg(CODE.SUCCESS),
      data: user,
    };
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => UserResult, { description: '更新当前用户信息（用户名/密码）' })
  async updateMe(
    @CurrentUser() user: UserEntity,
    @Args('input', { description: '更新信息' }) input: UpdateMeInput,
  ): Promise<UserResult> {
    try {
      if (input.username && input.username !== user.username) {
        const exists = await this.users.findByUsername(input.username);
        if (exists) throw new BadRequestException('用户名已存在');
      }

      const patch: any = {};
      if (input.username) patch.username = input.username;
      if (input.password) patch.passwordHash = await bcrypt.hash(input.password, 10);
      if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl;
      if (input.preferredTagIds !== undefined) patch.preferredTagIds = input.preferredTagIds;
      if (input.preferredFacilityIds !== undefined) patch.preferredFacilityIds = input.preferredFacilityIds;

      const data = await this.users.updateUser(user.id, patch);
      return {
        code: CODE.SUCCESS,
        message: getMsg(CODE.SUCCESS, '更新成功'),
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
