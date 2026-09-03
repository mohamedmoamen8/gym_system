import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomersService } from './customers.service';
import { RegisterCustomerDto, UpdateCustomerDto } from './customer.dto';
import { CheckinsService } from '../checkins/checkins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const photoStorage = diskStorage({
  destination: './storage/photos',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cust_${unique}${extname(file.originalname)}`);
  },
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const photoFileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
  cb(new Error('Invalid image type. Only jpg, png, webp are allowed.'));
};

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly checkinsService: CheckinsService,
  ) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage, fileFilter: photoFileFilter, limits: { fileSize: 2 * 1024 * 1024 } }))
  register(
    @Body() dto: RegisterCustomerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const photoPath = file ? `photos/${file.filename}` : undefined;
    return this.customersService.register(dto, photoPath);
  }

  @Get()
  findAll(@Query('q') q?: string, @Query('status') status?: string) {
    return this.customersService.findAll(q, status);
  }

  /** Next auto member ID — shown on the register form (0001, 0002, …). */
  @Get('next-barcode')
  getNextBarcode() {
    return this.customersService.getNextBarcodeCode().then((code) => ({ code }));
  }

  /** Lookup by barcode — used by the scanner tab */
  @Get('barcode/:code')
  async findByBarcode(@Param('code') code: string) {
    const customer = await this.customersService.findByBarcode(code);
    await this.checkinsService.record(customer.id).catch(() => {});
    return customer;
  }

  /** Members whose subscription expires within the next N days (default 7) */
  @Get('expiring')
  expiring(@Query('days') days: string = '7') {
    return this.customersService.findExpiring(parseInt(days, 10));
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
