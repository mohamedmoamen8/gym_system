import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './customer.entity';
import { RegisterCustomerDto, UpdateCustomerDto } from './customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async register(
    dto: RegisterCustomerDto,
    photoPath?: string,
  ): Promise<Customer> {
    const existing = await this.customerRepo.findOneBy({
      barcodeCode: dto.barcodeCode,
    });
    if (existing) {
      throw new ConflictException(
        `Barcode "${dto.barcodeCode}" is already registered`,
      );
    }

    const customer = this.customerRepo.create({
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      barcodeCode: dto.barcodeCode,
      membershipTier: dto.membershipTier ?? null,
      subscriptionEndDate: dto.subscriptionEndDate
        ? new Date(dto.subscriptionEndDate)
        : null,
      photoPath: photoPath ?? null,
    });
    return this.customerRepo.save(customer);
  }

  findAll(): Promise<Customer[]> {
    return this.customerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findByBarcode(barcodeCode: string): Promise<Customer> {
    const customer = await this.customerRepo.findOneBy({ barcodeCode });
    if (!customer) {
      throw new NotFoundException(
        `No member found with barcode "${barcodeCode}"`,
      );
    }
    return customer;
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.name !== undefined) customer.name = dto.name;
    if (dto.phoneNumber !== undefined) customer.phoneNumber = dto.phoneNumber;
    if (dto.membershipTier !== undefined) customer.membershipTier = dto.membershipTier;
    if (dto.subscriptionEndDate !== undefined) {
      customer.subscriptionEndDate = new Date(dto.subscriptionEndDate);
    }
    if (dto.status !== undefined) customer.status = dto.status;
    return this.customerRepo.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepo.remove(customer);
  }
}
