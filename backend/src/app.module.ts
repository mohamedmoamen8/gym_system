import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', 'gym.sqlite'),
      entities: [Owner, Customer, Captain, CaptainLog, MembershipPlan],
      // synchronize keeps the schema in sync automatically.
      // For a production deployment with a persistent database, set this to
      // false and run TypeORM migrations instead.
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Customer, Captain, CaptainLog]),
    AuthModule,
    MembershipsModule,
    BroadcastModule,
  ],
  controllers: [CustomersController, StaffController],
  providers: [CustomersService, StaffService],
})
export class AppModule {}
