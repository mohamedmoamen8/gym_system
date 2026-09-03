import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './payment.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly repo: Repository<Payment>,
  ) {}

  create(dto: { customerId: string; amount: number; method?: string | null; note?: string | null }): Promise<Payment> {
    const payment = this.repo.create({
      customerId: dto.customerId,
      amount: dto.amount,
      method: dto.method ?? null,
      note: dto.note ?? null,
      status: 'pending',
    });
    return this.repo.save(payment);
  }

  findAll(): Promise<Payment[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByCustomer(customerId: string) {
    return this.repo.find({ where: { customerId }, order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, status: Payment['status']): Promise<Payment> {
    const payment = await this.repo.findOneBy({ id });
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    payment.status = status;
    return this.repo.save(payment);
  }

  revenueTotal() {
    return this.repo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: 'paid' })
      .getRawOne()
      .then((r) => ({ total: parseFloat(r.total) }));
  }

  revenueMonthly() {
    return this.repo
      .createQueryBuilder('p')
      .select('strftime("%Y-%m", p.createdAt)', 'month')
      .addSelect('COALESCE(SUM(p.amount), 0)', 'total')
      .where('p.status = :status', { status: 'paid' })
      .groupBy('month')
      .orderBy('month', 'DESC')
      .limit(6)
      .getRawMany()
      .then((rows) =>
        rows.map((r: any) => ({ month: r.month, total: parseFloat(r.total) })),
      );
  }
}
