import { Controller, Post, Body, Param, UseGuards, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class RecordCheckinDto {
  customerId!: string;
}

@Controller('checkins')
@UseGuards(JwtAuthGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  /** Record a check-in for a member (used by scanner tab) */
  @Post()
  record(@Body() dto: RecordCheckinDto) {
    return this.checkinsService.record(dto.customerId);
  }

  /** Check-in history for a member */
  @Get('member/:customerId')
  history(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.checkinsService.findByCustomer(customerId);
  }

  /** Check-ins recorded today */
  @Get('today')
  today() {
    return this.checkinsService.countToday().then((count) => ({ count }));
  }

  /** Daily visitor counts for the last N days (default 7) */
  @Get('daily')
  daily(@Query('days') days: string = '7') {
    return this.checkinsService.dailyCounts(parseInt(days, 10));
  }
}
