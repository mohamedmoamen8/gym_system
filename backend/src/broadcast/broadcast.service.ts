import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Customer } from '../customers/customer.entity';

export interface BroadcastResult {
  sent: number;
  failed: number;
  skipped: number;
  gateway: 'openwa' | 'mock';
}

/**
 * Sends WhatsApp messages via a locally-running OpenWA instance.
 *
 * OpenWA docs: https://github.com/rmyndharis/OpenWA
 * API endpoint: POST /api/sessions/{sessionId}/messages/send-text
 * Auth header:  X-API-Key: <your key>
 *
 * Required env vars:
 *   OPENWA_URL        — e.g. http://localhost:2785
 *   OPENWA_API_KEY    — API key created in the OpenWA dashboard
 *   OPENWA_SESSION    — session name/id you created in OpenWA (e.g. "gym")
 *
 * Leave any of them empty and broadcast runs in mock mode (logs only, no messages sent).
 */
@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  private readonly openwaUrl: string | undefined;
  private readonly openwaApiKey: string | undefined;
  private readonly openwaSession: string | undefined;
  private readonly isConfigured: boolean;

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {
    this.openwaUrl     = process.env.OPENWA_URL?.replace(/\/$/, ''); // strip trailing slash
    this.openwaApiKey  = process.env.OPENWA_API_KEY;
    this.openwaSession = process.env.OPENWA_SESSION;

    this.isConfigured = !!(this.openwaUrl && this.openwaApiKey && this.openwaSession);

    if (this.isConfigured) {
      this.logger.log(
        `OpenWA gateway configured — ${this.openwaUrl} | session: ${this.openwaSession}`,
      );
    } else {
      this.logger.warn(
        'OpenWA env vars not set — broadcast runs in mock mode (no messages sent). ' +
        'Set OPENWA_URL, OPENWA_API_KEY, OPENWA_SESSION to enable.',
      );
    }
  }

  async broadcast(
    message: string,
    customerIds: string[],
  ): Promise<BroadcastResult> {
    const customers = await this.customerRepo.findBy({ id: In(customerIds) });

    let sent    = 0;
    let failed  = 0;
    let skipped = 0;

    for (const customer of customers) {
      if (!customer.phoneNumber) {
        skipped++;
        continue;
      }

      if (!this.isConfigured) {
        // Mock mode — just log
        this.logger.log(
          `[MOCK] Would send to ${customer.name} (${customer.phoneNumber}): ${message}`,
        );
        sent++;
        continue;
      }

      try {
        await this.sendViaOpenWA(customer.phoneNumber, message);
        sent++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to send to ${customer.name} (${customer.phoneNumber}): ${msg}`,
        );
        failed++;
      }
    }

    return {
      sent,
      failed,
      skipped,
      gateway: this.isConfigured ? 'openwa' : 'mock',
    };
  }

  /**
   * Send a single text message via OpenWA.
   *
   * Phone number format: international digits only, no +, spaces, or dashes.
   * e.g. "201012345678"  (Egypt) or "966512345678" (Saudi)
   *
   * OpenWA chatId format: "<number>@c.us"
   */
  private async sendViaOpenWA(phoneNumber: string, text: string): Promise<void> {
    // Normalize: strip +, spaces, dashes → pure digits
    const digits = phoneNumber.replace(/[\s\-+]/g, '');
    const chatId = `${digits}@c.us`;

    const url = `${this.openwaUrl}/api/sessions/${this.openwaSession}/messages/send-text`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.openwaApiKey!,
      },
      body: JSON.stringify({ chatId, text }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`OpenWA returned ${response.status}: ${body}`);
    }
  }
}
