import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { IsArray, IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { BroadcastService, BroadcastResult } from './broadcast.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class BroadcastDto {
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  message!: string;

  @IsArray()
  @IsUUID('4', { each: true, message: 'Each recipient must be a valid customer UUID' })
  recipientIds!: string[];
}

@Controller('broadcast')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  send(@Body() dto: BroadcastDto): Promise<BroadcastResult> {
    return this.broadcastService.broadcast(dto.message, dto.recipientIds);
  }
}
