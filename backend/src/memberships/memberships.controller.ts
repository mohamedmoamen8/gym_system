import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './membership-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /** Public — used by the RegisterTab to populate the tier dropdown */
  @Get('active')
  getActive() {
    return this.membershipsService.findActive();
  }

  /** All routes below require the owner to be logged in */
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.membershipsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateMembershipPlanDto) {
    return this.membershipsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipPlanDto,
  ) {
    return this.membershipsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.membershipsService.remove(id);
  }
}
