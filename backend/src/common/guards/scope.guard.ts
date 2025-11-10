import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtPayload } from '../decorators/current-user.decorator';

/**
 * ScopeGuard ensures that users can only access resources within their assigned filiais
 * OWNER and ADMIN have access to all filiais
 * Other roles must have a role assignment for the specific filial
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const filialId = request.params.id || request.params.filialId || request.body?.filialId;

    if (!user || !user.roles) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // OWNER and ADMIN have global access
    const userRoles = user.roles.map((r) => r.role);
    if (userRoles.includes(Role.OWNER) || userRoles.includes(Role.ADMIN)) {
      return true;
    }

    // For other roles, check if they have access to this specific filial
    if (filialId) {
      const hasAccess = user.roles.some((r) => r.filialId === filialId);
      if (!hasAccess) {
        throw new ForbiddenException('You do not have access to this filial');
      }
    }

    return true;
  }
}

