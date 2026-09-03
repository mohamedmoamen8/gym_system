import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomersService } from '../customers/customers.service';

/**
 * Periodically flips members whose subscription has ended to `Expired`
 * so the data stays consistent even between scans.
 */
@Injectable()
export class ExpiryScheduler {
  private readonly logger = new Logger(ExpiryScheduler.name);

  constructor(private readonly customersService: CustomersService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiry(): Promise<void> {
    try {
      const count = await this.customersService.markExpiredMembers();
      if (count > 0) {
        this.logger.log(`Auto-expired ${count} membership(s) past end date.`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Expiry job failed: ${message}`);
    }
  }
}
