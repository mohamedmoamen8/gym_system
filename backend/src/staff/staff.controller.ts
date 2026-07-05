import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StaffService } from './staff.service';
import { CreateCaptainDto, UpdateCaptainDto, ClockTriggerDto } from './staff.dto';

const photoStorage = diskStorage({
  destination: './storage/photos',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `capt_${unique}${extname(file.originalname)}`);
  },
});

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage }))
  create(
    @Body() dto: CreateCaptainDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const photoPath = file ? `photos/${file.filename}` : undefined;
    return this.staffService.create(dto, photoPath);
  }

  @Get()
  findAll() {
    return this.staffService.findAll();
  }

  /** Today's attendance roster */
  @Get('logs/today')
  getTodayLogs() {
    return this.staffService.getTodayLogs();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaptainDto,
  ) {
    return this.staffService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.remove(id);
  }

  @Post('clock-trigger')
  clockTrigger(@Body() dto: ClockTriggerDto) {
    return this.staffService.clockTrigger(dto);
  }
}
