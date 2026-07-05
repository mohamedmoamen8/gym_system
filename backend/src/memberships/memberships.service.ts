import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlan } from './membership-plan.entity';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './membership-plan.dto';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(MembershipPlan)
    private readonly planRepo: Repository<MembershipPlan>,
  ) {}

  async create(dto: CreateMembershipPlanDto): Promise<MembershipPlan> {
    const exists = await this.planRepo.findOneBy({ name: dto.name });
    if (exists) throw new ConflictException(`Plan "${dto.name}" already exists`);

    const plan = this.planRepo.create({ ...dto, isActive: dto.isActive ?? true });
    return this.planRepo.save(plan);
  }

  findAll(): Promise<MembershipPlan[]> {
    return this.planRepo.find({ order: { price: 'ASC' } });
  }

  findActive(): Promise<MembershipPlan[]> {
    return this.planRepo.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async findOne(id: string): Promise<MembershipPlan> {
    const plan = await this.planRepo.findOneBy({ id });
    if (!plan) throw new NotFoundException(`Plan with id "${id}" not found`);
    return plan;
  }

  async update(id: string, dto: UpdateMembershipPlanDto): Promise<MembershipPlan> {
    const plan = await this.findOne(id);

    if (dto.name && dto.name !== plan.name) {
      const exists = await this.planRepo.findOneBy({ name: dto.name });
      if (exists) throw new ConflictException(`Plan "${dto.name}" already exists`);
    }

    Object.assign(plan, dto);
    return this.planRepo.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    await this.planRepo.remove(plan);
  }
}
