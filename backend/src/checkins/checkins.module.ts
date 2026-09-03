import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberCheckin } from './member-checkin.entity';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MemberCheckin])],
  providers: [CheckinsService],
  controllers: [CheckinsController],
  exports: [CheckinsService],
})
export class CheckinsModule {}
