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

  /**
   * Effective status used for access decisions. `Suspended` always wins.
   * A member whose subscriptionEndDate is in the past is treated as `Expired`
   * even if the stored `status` column hasn't been updated yet.
   */
  private effectiveStatus(customer: Customer): Customer['status'] {
    if (customer.status === 'Suspended') return 'Suspended';
    if (
      customer.subscriptionEndDate &&
      new Date(customer.subscriptionEndDate).getTime() < Date.now()
    ) {
      return 'Expired';
    }
    return customer.status;
  }

  /** Augments a Customer with derived access fields for the clients. */
  private toView(customer: Customer) {
    const effectiveStatus = this.effectiveStatus(customer);
    return {
      ...customer,
      effectiveStatus,
      accessAllowed: effectiveStatus === 'Active',
    };
  }

  /** Next member ID: 0001, 0002, … based on highest existing numeric code. */
  async getNextBarcodeCode(): Promise<string> {
    const rows = await this.customerRepo.find({ select: ['barcodeCode'] });
    let max = 0;
    for (const row of rows) {
      if (/^\d+$/.test(row.barcodeCode)) {
        const n = parseInt(row.barcodeCode, 10);
        if (n > max) max = n;
      }
    }
    return String(max + 1).padStart(4, '0');
  }

  async register(
    dto: RegisterCustomerDto,
    photoPath?: string,
  ): Promise<Customer> {
    const barcodeCode =
      dto.barcodeCode?.trim() || (await this.getNextBarcodeCode());

    const existing = await this.customerRepo.findOneBy({ barcodeCode });
    if (existing) {
      throw new ConflictException(
        `Barcode "${barcodeCode}" is already registered`,
      );
    }

    const customer = this.customerRepo.create({
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      barcodeCode,
      membershipTier: dto.membershipTier ?? null,
      subscriptionEndDate: dto.subscriptionEndDate
        ? new Date(dto.subscriptionEndDate)
        : null,
      photoPath: photoPath ?? null,
    });
    return this.toView(await this.customerRepo.save(customer));
  }

  /**
   * Background maintenance: flip any `Active` member whose subscription has
   * passed into `Expired`. Returns the number of members updated.
   */
  async markExpiredMembers(): Promise<number> {
    const expired = await this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.status = :status', { status: 'Active' })
      .andWhere('customer.subscriptionEndDate IS NOT NULL')
      .andWhere('customer.subscriptionEndDate < :now', { now: new Date() })
      .getMany();

    if (expired.length === 0) return 0;
    for (const c of expired) c.status = 'Expired';
    await this.customerRepo.save(expired);
    return expired.length;
  }

  async findExpiring(days = 7) {
    const upper = new Date();
    upper.setDate(upper.getDate() + days);
    return this.customerRepo
      .createQueryBuilder('customer')
      .where('customer.status = :status', { status: 'Active' })
      .andWhere('customer.subscriptionEndDate IS NOT NULL')
      .andWhere('customer.subscriptionEndDate >= :now', { now: new Date() })
      .andWhere('customer.subscriptionEndDate <= :upper', { upper })
      .orderBy('customer.subscriptionEndDate', 'ASC')
      .getMany()
      .then((list) => list.map((c) => this.toView(c)));
  }

  async findAll(q?: string, status?: string) {
    const qb = this.customerRepo.createQueryBuilder('customer').orderBy('customer.createdAt', 'DESC');

    if (q) {
      qb.andWhere(
        '(customer.name LIKE :q OR customer.phoneNumber LIKE :q OR customer.barcodeCode LIKE :q OR customer.membershipTier LIKE :q)',
        { q: `%${q}%` },
      );
    }

    if (status && status !== 'all') {
      qb.andWhere('customer.status = :status', { status });
    }

    const list = await qb.getMany();
    return list.map((c) => this.toView(c));
  }

  async findByBarcode(barcodeCode: string): Promise<Customer> {
    const customer = await this.customerRepo.findOneBy({ barcodeCode });
    if (!customer) {
      throw new NotFoundException(
        `No member found with barcode "${barcodeCode}"`,
      );
    }
    return this.toView(customer) as Customer;
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepo.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer with id "${id}" not found`);
    }
    return this.toView(customer) as Customer;
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
    return this.toView(await this.customerRepo.save(customer)) as Customer;
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepo.remove(customer);
  }
}
