import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { RegisterDto } from './dto/register.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { UserProfileDto } from './dto/user-profile.dto';
import type { User } from './entities/user.entity';
import type { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthRepository } from './auth.repository';

const BCRYPT_ROUNDS = 12;
const ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.authRepository.saveUser({
      first_name: dto.first_name,
      last_name: dto.last_name,
      email: dto.email,
      password: hashedPassword,
      enabled: false,
      account_locked: false,
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS);
    await this.authRepository.saveActivationToken({
      token,
      user,
      expires_at: expiresAt,
      validated_at: null,
    });

    return { message: `Account created. Use activation token to activate: ${token}` };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user || !user.password) {
      return null;
    }
    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return null;
    }
    return user;
  }

  login(user: User): AuthResponseDto {
    if (!user.enabled) {
      throw new UnauthorizedException('Account is not activated');
    }
    if (user.account_locked) {
      throw new UnauthorizedException('Account is locked');
    }
    const jti = randomUUID();
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((r) => r.role_name) ?? [],
      jti,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        roles: payload.roles,
      },
    };
  }

  async logout(jti: string, token: string): Promise<{ message: string }> {
    await this.authRepository.blacklistToken({
      jti,
      token,
      blacklisted_at: new Date(),
    });
    return { message: 'Logged out successfully' };
  }

  async activateAccount(token: string): Promise<{ message: string }> {
    const activationToken = await this.authRepository.findActivationToken(token);
    if (!activationToken) {
      throw new BadRequestException('Invalid activation token');
    }
    if (activationToken.validated_at) {
      throw new BadRequestException('Activation token has already been used');
    }
    if (activationToken.expires_at && activationToken.expires_at < new Date()) {
      throw new BadRequestException('Activation token has expired');
    }
    await this.authRepository.saveActivationToken({
      ...activationToken,
      validated_at: new Date(),
    });
    await this.authRepository.saveUser({ ...activationToken.user, enabled: true });
    return { message: 'Account activated successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      return { message: 'If that email is registered, a reset link has been sent' };
    }
    const token = randomUUID();
    const expiryDate = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await this.authRepository.savePasswordResetToken({
      token,
      type: 'PASSWORD_RESET',
      expiry_date: expiryDate,
      user,
    });
    return { message: `Password reset token generated: ${token}` };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const resetToken = await this.authRepository.findPasswordResetToken(dto.token);
    if (!resetToken) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
    if (resetToken.expiry_date < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }
    const hashedPassword = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.authRepository.saveUser({ ...resetToken.user, password: hashedPassword });
    await this.authRepository.deletePasswordResetToken(resetToken.id);
    return { message: 'Password reset successfully' };
  }

  async getProfile(userId: number): Promise<UserProfileDto> {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User #${userId} not found`);
    }
    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      enabled: user.enabled,
      account_locked: user.account_locked,
      roles: user.roles?.map((r) => r.role_name) ?? [],
    };
  }
}
