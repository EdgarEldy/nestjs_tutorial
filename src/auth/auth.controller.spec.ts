import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { User } from './entities/user.entity';

const mockUser = (): User => ({
  id: 1,
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane@example.com',
  password: 'hashed',
  enabled: true,
  account_locked: false,
  roles: [{ id: 1, role_name: 'USER', users: [], permissions: [] }],
});

describe('AuthController', () => {
  let controller: AuthController;
  let mockService: {
    register: jest.Mock;
    login: jest.Mock;
    logout: jest.Mock;
    activateAccount: jest.Mock;
    forgotPassword: jest.Mock;
    resetPassword: jest.Mock;
    getProfile: jest.Mock;
  };

  beforeEach(async () => {
    mockService = {
      register: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      activateAccount: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('register calls authService.register and returns message', async () => {
    mockService.register.mockResolvedValue({
      message: 'Account created. Use activation token to activate: abc',
    });
    const result = await controller.register({
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      password: 'Secret@1234',
    });
    expect(result.message).toContain('Account created');
  });

  it('login calls authService.login with the user from the request', () => {
    const user = mockUser();
    mockService.login.mockReturnValue({
      accessToken: 'tok',
      user: {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        roles: ['USER'],
      },
    });
    const result = controller.login(
      { email: 'jane@example.com', password: 'Secret@1234' },
      { user },
    );
    expect(result.accessToken).toBe('tok');
    expect(mockService.login).toHaveBeenCalledWith(user);
  });

  it('logout extracts jti from bearer token and calls authService.logout', async () => {
    mockService.logout.mockResolvedValue({ message: 'Logged out successfully' });
    const fakeJwt = `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ jti: 'test-jti', sub: 1 })).toString('base64url')}.sig`;
    const result = await controller.logout(
      { user: mockUser(), headers: { authorization: `Bearer ${fakeJwt}` } },
      mockUser(),
    );
    expect(result.message).toContain('Logged out');
    expect(mockService.logout).toHaveBeenCalledWith('test-jti', fakeJwt);
  });

  it('activateAccount calls authService.activateAccount', async () => {
    mockService.activateAccount.mockResolvedValue({ message: 'Account activated successfully' });
    const result = await controller.activateAccount({ token: 'some-token' });
    expect(result.message).toContain('activated');
  });

  it('forgotPassword calls authService.forgotPassword', async () => {
    mockService.forgotPassword.mockResolvedValue({ message: 'If that email is registered...' });
    const result = await controller.forgotPassword({ email: 'jane@example.com' });
    expect(result.message).toBeDefined();
  });

  it('resetPassword calls authService.resetPassword', async () => {
    mockService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });
    const result = await controller.resetPassword({ token: 'tok', newPassword: 'New@1234' });
    expect(result.message).toContain('reset');
  });

  it('getProfile calls authService.getProfile with the current user id', async () => {
    const user = mockUser();
    const profile = {
      id: 1,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      enabled: true,
      account_locked: false,
      roles: ['USER'],
    };
    mockService.getProfile.mockResolvedValue(profile);
    const result = await controller.getProfile(user);
    expect(result.email).toBe('jane@example.com');
    expect(mockService.getProfile).toHaveBeenCalledWith(1);
  });
});
