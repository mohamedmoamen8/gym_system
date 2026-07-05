import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Captain } from './captain.entity';
import { CaptainLog } from './captain-log.entity';
import { CreateCaptainDto, UpdateCaptainDto, ClockTriggerDto } from './staff.dto';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Captain)
    private readonly captainRepo: Repository<Captain>,
    @InjectRepository(CaptainLog)
    private readonly logRepo: Repository<CaptainLog>,
  ) {}

  async create(dto: CreateCaptainDto, photoPath?: string): Promise<Captain> {
    const existing = await this.captainRepo.findOneBy({
      accessCode: dto.accessCode,
    });
    if (existing) {
      throw new ConflictException('A captain with that access code already exists');
    }
    const captain = this.captainRepo.create({
      name: dto.name,
      accessCode: dto.accessCode,
      photoPath: photoPath ?? null,
    });
    return this.captainRepo.save(captain);
  }

  findAll(): Promise<Captain[]> {
    return this.captainRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Captain> {
    const captain = await this.captainRepo.findOneBy({ id });
    if (!captain) {
      throw new NotFoundException(`Captain with id "${id}" not found`);
    }
    return captain;
  }

  async update(id: string, dto: UpdateCaptainDto): Promise<Captain> {
    const captain = await this.findOne(id);
    if (dto.name !== undefined) captain.name = dto.name;
    if (dto.accessCode !== undefined) captain.accessCode = dto.accessCode;
    if (dto.status !== undefined) captain.status = dto.status;
    return this.captainRepo.save(captain);
  }

  async remove(id: string): Promise<void> {
    const captain = await this.findOne(id);
    await this.captainRepo.remove(captain);
  }

  async clockTrigger(dto: ClockTriggerDto): Promise<{
    status: 'IN' | 'OUT';
    message: string;
    captain: Captain;
    hours?: number;
  }> {
    const captain = await this.captainRepo.findOne({
      where: { accessCode: dto.accessCode, status: 'Active' },
    });
    if (!captain) {
      throw new BadRequestException('Invalid access code or account is inactive');
    }

    const activeLog = await this.logRepo.findOne({
      where: { captain: { id: captain.id }, clockOutTime: IsNull() },
      relations: ['captain'],
    });

    if (!activeLog) {
      const log = this.logRepo.create({ captain });
      await this.logRepo.save(log);
      return { status: 'IN', message: `${captain.name} clocked in`, captain };
    }

    activeLog.clockOutTime = new Date();
    const diffMs = activeLog.clockOutTime.getTime() - activeLog.clockInTime.getTime();
    activeLog.hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    await this.logRepo.save(activeLog);

    return {
      status: 'OUT',
      message: `${captain.name} clocked out`,
      captain,
      hours: activeLog.hoursWorked,
    };
  }

  async getTodayLogs(): Promise<CaptainLog[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.logRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.captain', 'captain')
      .where('log.clockInTime >= :start', { start })
      .andWhere('log.clockInTime <= :end', { end })
      .orderBy('log.clockInTime', 'DESC')
      .getMany();
  }
}
