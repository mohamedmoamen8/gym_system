import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Owner } from './owner.entity';
import { LoginDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepo: Repository<Owner>,
    private readonly jwtService: JwtService,
  ) {}

  /** Called once during bootstrap to seed the default owner account */
  async seedDefaultOwner(): Promise<void> {
    const count = await this.ownerRepo.count();
    if (count > 0) return;

    const username = process.env.OWNER_USERNAME ?? 'owner';
    const password = process.env.OWNER_PASSWORD ?? 'gym1234';
    const passwordHash = await bcrypt.hash(password, 10);

    const owner = this.ownerRepo.create({ username, passwordHash, mustChangePassword: true });
    await this.ownerRepo.save(owner);
    console.log(`✅ Default owner seeded — username: "${username}" password: "${password}"`);
    console.log('   Change these via OWNER_USERNAME / OWNER_PASSWORD env vars.');
  }

  async login(dto: LoginDto): Promise<{ access_token: string; username: string; mustChangePassword: boolean }> {
    const owner = await this.ownerRepo.findOneBy({ username: dto.username });
    if (!owner) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, owner.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: owner.id, username: owner.username, role: owner.role };
    const access_token = this.jwtService.sign(payload);
    return { access_token, username: owner.username, mustChangePassword: owner.mustChangePassword };
  }

  async changePassword(
    ownerId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const owner = await this.ownerRepo.findOneBy({ id: ownerId });
    if (!owner) throw new UnauthorizedException('Owner not found');

    const valid = await bcrypt.compare(currentPassword, owner.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    owner.passwordHash = await bcrypt.hash(newPassword, 10);
    owner.mustChangePassword = false;
    await this.ownerRepo.save(owner);
  }
}
