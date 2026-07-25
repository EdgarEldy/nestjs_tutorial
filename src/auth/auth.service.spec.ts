import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import type { User } from './entities/user.entity';

const mockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  password: '$2b$12$hashedpassword',
  enabled: true,
  account_locked: false,
  roles: [{ id: 1, role_name: 'USER', users: [], permissions: [] }],
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let mockRepo: {
    findUserByEmail: jest.Mock;
    findUserById: jest.Mock;
    saveUser: jest.Mock;
    saveActivationToken: jest.Mock;
    findActivationToken: jest.Mock;
    blacklistToken: jest.Mock;
    savePasswordResetToken: jest.Mock;
    findPasswordResetToken: jest.Mock;
    deletePasswordResetToken: jest.Mock;
  };
  let mockJwt: { sign: jest.Mock };

  beforeEach(async () => {
    mockRepo = {
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      saveUser: jest.fn(),
      saveActivationToken: jest.fn(),
      findActivationToken: jest.fn(),
      blacklistToken: jest.fn(),
      savePasswordResetToken: jest.fn(),
      findPasswordResetToken: jest.fn(),
      deletePasswordResetToken: jest.fn(),
    };
    mockJwt = { sign: jest.fn().mockReturnValue('mock.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException when email is already registered', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockUser());
      await expect(
        service.register({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          password: 'Secret@1',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user and activation token for a new email', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      mockRepo.saveUser.mockResolvedValue(mockUser({ enabled: false }));
      mockRepo.saveActivationToken.mockResolvedValue({});

      const result = await service.register({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        password: 'Secret@1234',
      });

      expect(result.message).toContain('Account created');
      expect(mockRepo.saveUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'jane@example.com', enabled: false }),
      );
    });
  });

  describe('validateUser', () => {
    it('returns null when user is not found', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      const result = await service.validateUser('unknown@example.com', 'pass');
      expect(result).toBeNull();
    });

    it('returns null when password does not match', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(
        mockUser({ password: await bcrypt.hash('correct', 12) }),
      );
      const result = await service.validateUser('jane@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('returns user when credentials are valid', async () => {
      const hashed = await bcrypt.hash('Secret@1234', 12);
      const user = mockUser({ password: hashed });
      mockRepo.findUserByEmail.mockResolvedValue(user);
      const result = await service.validateUser('jane@example.com', 'Secret@1234');
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when account is not enabled', () => {
      expect(() => service.login(mockUser({ enabled: false }))).toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when account is locked', () => {
      expect(() => service.login(mockUser({ account_locked: true }))).toThrow(
        UnauthorizedException,
      );
    });

    it('returns accessToken and user on successful login', () => {
      const result = service.login(mockUser());
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('jane@example.com');
      expect(mockJwt.sign).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('blacklists the token', async () => {
      mockRepo.blacklistToken.mockResolvedValue({});
      const result = await service.logout('some-jti', 'some.jwt.token');
      expect(result.message).toContain('Logged out');
      expect(mockRepo.blacklistToken).toHaveBeenCalledWith(
        expect.objectContaining({ jti: 'some-jti', token: 'some.jwt.token' }),
      );
    });
  });

  describe('activateAccount', () => {
    it('throws BadRequestException for invalid token', async () => {
      mockRepo.findActivationToken.mockResolvedValue(null);
      await expect(service.activateAccount('bad-token')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token already used', async () => {
      mockRepo.findActivationToken.mockResolvedValue({
        token: 'tok',
        validated_at: new Date(),
        expires_at: null,
        user: mockUser(),
      });
      await expect(service.activateAccount('tok')).rejects.toThrow(BadRequestException);
    });

    it('activates the account on valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockRepo.findActivationToken.mockResolvedValue({
        id: 1,
        token: 'valid-tok',
        validated_at: null,
        expires_at: futureDate,
        user: mockUser({ enabled: false }),
      });
      mockRepo.saveActivationToken.mockResolvedValue({});
      mockRepo.saveUser.mockResolvedValue(mockUser({ enabled: true }));

      const result = await service.activateAccount('valid-tok');
      expect(result.message).toContain('activated');
    });
  });

  describe('forgotPassword', () => {
    it('returns generic message when email not found', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword({ email: 'nope@example.com' });
      expect(result.message).toContain('registered');
    });

    it('creates reset token when user exists', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(mockUser());
      mockRepo.savePasswordResetToken.mockResolvedValue({});
      const result = await service.forgotPassword({ email: 'jane@example.com' });
      expect(result.message).toContain('token');
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException for invalid token', async () => {
      mockRepo.findPasswordResetToken.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'bad', newPassword: 'New@1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is expired', async () => {
      mockRepo.findPasswordResetToken.mockResolvedValue({
        id: 1,
        token: 'expired',
        expiry_date: new Date(Date.now() - 1000),
        user: mockUser(),
      });
      await expect(
        service.resetPassword({ token: 'expired', newPassword: 'New@1234' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('resets password for valid token', async () => {
      mockRepo.findPasswordResetToken.mockResolvedValue({
        id: 1,
        token: 'valid',
        expiry_date: new Date(Date.now() + 3600000),
        user: mockUser(),
      });
      mockRepo.saveUser.mockResolvedValue(mockUser());
      mockRepo.deletePasswordResetToken.mockResolvedValue(undefined);

      const result = await service.resetPassword({ token: 'valid', newPassword: 'New@1234' });
      expect(result.message).toContain('reset');
    });
  });

  describe('getProfile', () => {
    it('throws NotFoundException when user not found', async () => {
      mockRepo.findUserById.mockResolvedValue(null);
      await expect(service.getProfile(99)).rejects.toThrow(NotFoundException);
    });

    it('returns profile without password when user is found', async () => {
      mockRepo.findUserById.mockResolvedValue(mockUser());
      const result = await service.getProfile(1);
      expect(result.email).toBe('jane@example.com');
      expect('password' in result).toBe(false);
    });
  });
});
