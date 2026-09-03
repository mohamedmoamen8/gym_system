import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';

import { Owner } from './auth/owner.entity';
import { AuthModule } from './auth/auth.module';

import { Customer } from './customers/customer.entity';
import { CustomersController } from './customers/customers.controller';
import { CustomersService } from './customers/customers.service';

import { Captain } from './staff/captain.entity';
import { CaptainLog } from './staff/captain-log.entity';
import { StaffController } from './staff/staff.controller';
import { StaffService } from './staff/staff.service';

import { MembershipPlan } from './memberships/membership-plan.entity';
import { MembershipsModule } from './memberships/memberships.module';

import { BroadcastModule } from './broadcast/broadcast.module';

import { GymSetting } from './settings/gym-setting.entity';
import { SettingsModule } from './settings/settings.module';
import { MemberCheckin } from './checkins/member-checkin.entity';
import { CheckinsModule } from './checkins/checkins.module';
import { Payment } from './payments/payment.entity';
import { PaymentsModule } from './payments/payments.module';
import { ExpiryScheduler } from './jobs/expiry.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', 'gym.sqlite'),
      entities: [Owner, Customer, Captain, CaptainLog, MembershipPlan, GymSetting, MemberCheckin, Payment],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Customer, Captain, CaptainLog, GymSetting, MemberCheckin, Payment]),
    AuthModule,
    MembershipsModule,
    BroadcastModule,
    SettingsModule,
    CheckinsModule,
    PaymentsModule,
  ],
  controllers: [CustomersController, StaffController],
  providers: [CustomersService, StaffService, ExpiryScheduler],
})
export class AppModule {}
