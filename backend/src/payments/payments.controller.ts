import { Controller, Post, Body, Get, Param, Patch, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('customer/:customerId')
  byCustomer(@Param('customerId', ParseUUIDPipe) customerId: string) {
    return this.paymentsService.findByCustomer(customerId);
  }

  @Patch(':id/status')
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body('status') status: any) {
    return this.paymentsService.updateStatus(id, status);
  }

  @Get('analytics/revenue')
  revenue() {
    return this.paymentsService.revenueTotal();
  }

  @Get('analytics/monthly')
  monthly() {
    return this.paymentsService.revenueMonthly();
  }
}
