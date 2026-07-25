import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { User } from '../../auth/entities/user.entity';
import type { Role } from '../../auth/entities/role.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    const hasRole = user?.roles?.some((role: Role) => requiredRoles.includes(role.role_name));
    if (!hasRole) {
      throw new ForbiddenException('You do not have the required role to perform this action');
    }
    return true;
  }
}
