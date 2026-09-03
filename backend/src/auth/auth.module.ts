import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Owner } from './owner.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 5 },
    ]),
    TypeOrmModule.forFeature([Owner]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'gym_jwt_secret_change_in_production',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
