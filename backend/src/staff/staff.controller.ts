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
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StaffService } from './staff.service';
import { CreateCaptainDto, UpdateCaptainDto, ClockTriggerDto } from './staff.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const photoStorage = diskStorage({
  destination: './storage/photos',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `capt_${unique}${extname(file.originalname)}`);
  },
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const captainFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid image type. Only jpg, png, webp are allowed.'));
};

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, fileFilter: captainFileFilter, limits: { fileSize: 2 * 1024 * 1024 } }))
  create(
    @Body() dto: CreateCaptainDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const photoPath = file ? `photos/${file.filename}` : undefined;
    return this.staffService.create(dto, photoPath);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.staffService.findAll();
  }

  /** Today's attendance roster */
  @Get('logs/today')
  getTodayLogs() {
    return this.staffService.getTodayLogs();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCaptainDto,
  ) {
    return this.staffService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.staffService.remove(id);
  }

  @Post('clock-trigger')
  clockTrigger(@Body() dto: ClockTriggerDto) {
    return this.staffService.clockTrigger(dto);
  }
}
