import { Controller, Get, Post, Body, UseGuards, Param, ParseUUIDPipe } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class SetValueDto {
  value!: string;
}

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  list() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  get(@Param('key') key: string) {
    return this.settingsService.get(key).then((value) => ({ key, value }));
  }

  @Post(':key')
  set(@Param('key') key: string, @Body() dto: SetValueDto) {
    return this.settingsService.set(key, dto.value ?? null);
  }
}
