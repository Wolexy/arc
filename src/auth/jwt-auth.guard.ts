import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
    accessGranted: boolean;
  };
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class AccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role === 'ADMIN') {
      return true;
    }

    if (user.accessGranted) {
      return true;
    }

    throw new ForbiddenException(
      'Access to personality assessment requires payment',
    );
  }
}
