import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OssService } from './oss.service';
import { OssType } from './dto/oss.type';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';

@Resolver()
@UseGuards(GqlAuthGuard)
export class OssResolver {
  constructor(private readonly ossService: OssService) {}

  @Query(() => OssType, { description: '获取 OSS 签名（用于前端表单直传）' })
  async getOssInfo(): Promise<OssType> {
    return this.ossService.getSignature();
  }
}
