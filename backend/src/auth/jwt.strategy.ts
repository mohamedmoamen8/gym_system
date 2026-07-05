import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Owner } from './owner.entity';

export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Owner)
    private readonly ownerRepo: Repository<Owner>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'gym_jwt_secret_change_in_production',
    });
  }

  async validate(payload: JwtPayload): Promise<Owner> {
    const owner = await this.ownerRepo.findOneBy({ id: payload.sub });
    if (!owner) throw new UnauthorizedException('Session invalid');
    return owner;
  }
}
