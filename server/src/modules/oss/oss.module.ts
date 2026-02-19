import { Module } from '@nestjs/common';
import { OssResolver } from './oss.resolver';
import { OssService } from './oss.service';

@Module({
  providers: [OssResolver, OssService],
  exports: [OssService],
})
export class OssModule {}
