import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivationToken } from './entities/activation-token.entity';
import { BlacklistedToken } from './entities/blacklisted-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User } from './entities/user.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(ActivationToken)
    private readonly activationTokenRepo: Repository<ActivationToken>,
    @InjectRepository(BlacklistedToken)
    private readonly blacklistedTokenRepo: Repository<BlacklistedToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepo: Repository<PasswordResetToken>,
  ) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email }, relations: ['roles'] });
  }

  findUserById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['roles'] });
  }

  saveUser(user: Partial<User>): Promise<User> {
    return this.userRepo.save(user);
  }

  saveActivationToken(token: Partial<ActivationToken>): Promise<ActivationToken> {
    return this.activationTokenRepo.save(token);
  }

  findActivationToken(token: string): Promise<ActivationToken | null> {
    return this.activationTokenRepo.findOne({ where: { token }, relations: ['user'] });
  }

  async blacklistToken(data: Partial<BlacklistedToken>): Promise<BlacklistedToken> {
    return this.blacklistedTokenRepo.save(data);
  }

  findBlacklistedByJti(jti: string): Promise<BlacklistedToken | null> {
    return this.blacklistedTokenRepo.findOne({ where: { jti } });
  }

  savePasswordResetToken(token: Partial<PasswordResetToken>): Promise<PasswordResetToken> {
    return this.passwordResetTokenRepo.save(token);
  }

  findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    return this.passwordResetTokenRepo.findOne({ where: { token }, relations: ['user'] });
  }

  deletePasswordResetToken(id: number): Promise<void> {
    return this.passwordResetTokenRepo.delete(id).then(() => undefined);
  }
}
