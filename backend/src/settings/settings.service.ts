import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymSetting } from './gym-setting.entity';

export interface GymSettingsMap {
  [key: string]: string | null;
}

const SEED: GymSettingsMap = {
  name: 'GYM',
  logo: null,
  welcomeMessage: 'Welcome coach',
  scanSoundEnabled: 'true',
  memberCodeType: 'qr',
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(GymSetting)
    private readonly repo: Repository<GymSetting>,
  ) {}

  async findAll(): Promise<GymSetting[]> {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async getMap(): Promise<GymSettingsMap> {
    const rows = await this.repo.find();
    const map: GymSettingsMap = {};
    rows.forEach((r) => (map[r.key] = r.value));
    return map;
  }

  async get(key: string): Promise<string | null> {
    const row = await this.repo.findOneBy({ key });
    return row?.value ?? null;
  }

  async set(key: string, value: string | null): Promise<GymSetting> {
    let row = await this.repo.findOneBy({ key });
    if (row) {
      row.value = value;
    } else {
      row = this.repo.create({ key, value });
    }
    return this.repo.save(row);
  }

  async seed(): Promise<void> {
    for (const [key, value] of Object.entries(SEED)) {
      const exists = await this.repo.findOneBy({ key });
      if (!exists) {
        await this.repo.save(this.repo.create({ key, value }));
      }
    }
  }
}
