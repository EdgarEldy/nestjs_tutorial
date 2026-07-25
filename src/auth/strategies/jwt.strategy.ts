import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { BlacklistedToken } from '../entities/blacklisted-token.entity';
import { User } from '../entities/user.entity';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(BlacklistedToken)
    private readonly blacklistedTokenRepo: Repository<BlacklistedToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? '',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const blacklisted = await this.blacklistedTokenRepo.findOne({
      where: { jti: payload.jti },
    });
    if (blacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['roles'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.enabled) {
      throw new UnauthorizedException('Account is not activated');
    }
    if (user.account_locked) {
      throw new UnauthorizedException('Account is locked');
    }
    return user;
  }
}
