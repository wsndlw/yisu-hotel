import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditRecordEntity } from './models/audit-record.entity';
import { AuditService } from './audit.service';
import { AuditResolver } from './audit.resolver';
import { HotelModule } from '../hotel/hotel.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditRecordEntity]),
    forwardRef(() => HotelModule),
    UserModule,
  ],
  providers: [AuditService, AuditResolver],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {}
