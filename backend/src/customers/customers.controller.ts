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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CustomersService } from './customers.service';
import { RegisterCustomerDto, UpdateCustomerDto } from './customer.dto';

const photoStorage = diskStorage({
  destination: './storage/photos',
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `cust_${unique}${extname(file.originalname)}`);
  },
});

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post('register')
  @UseInterceptors(FileInterceptor('photo', { storage: photoStorage }))
  register(
    @Body() dto: RegisterCustomerDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const photoPath = file ? `photos/${file.filename}` : undefined;
    return this.customersService.register(dto, photoPath);
  }

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  /** Lookup by barcode — used by the scanner tab */
  @Get('barcode/:code')
  findByBarcode(@Param('code') code: string) {
    return this.customersService.findByBarcode(code);
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
