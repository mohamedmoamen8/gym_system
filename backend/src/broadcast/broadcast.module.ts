import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../customers/customer.entity';
import { BroadcastService } from './broadcast.service';
import { BroadcastController } from './broadcast.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  providers: [BroadcastService],
  controllers: [BroadcastController],
})
export class BroadcastModule {}
