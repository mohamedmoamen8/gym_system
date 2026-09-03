import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberCheckin } from './member-checkin.entity';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(MemberCheckin)
    private readonly repo: Repository<MemberCheckin>,
  ) {}

  record(customerId: string): Promise<MemberCheckin> {
    const checkin = this.repo.create({ customerId });
    return this.repo.save(checkin);
  }

  findByCustomer(customerId: string) {
    return this.repo.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  countToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.repo.count({ where: { createdAt: { $gte: start } as any } });
  }

  /** visitor counts per day for last N days */
  async dailyCounts(days = 7) {
    const rows: { day: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = await this.repo
        .createQueryBuilder('c')
        .where('c.createdAt >= :start', { start: d })
        .andWhere('c.createdAt < :end', { end: next })
        .getCount();
      rows.push({
        day: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }),
        count,
      });
    }
    return rows;
  }
}
