import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

export type SupportIdentity = {
  id: string;
  email: string;
  role: string;
  name?: string;
};

export function verifySupportToken(auth?: string): SupportIdentity {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (payload.role !== 'SUPPORT_EXPERT' && payload.role !== 'support_expert') {
      throw new UnauthorizedException('دسترسی فقط برای کارشناس پشتیبانی مجاز است');
    }
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') {
      throw new UnauthorizedException('توکن نامعتبر است');
    }
    return { id: payload.sub, email: payload.email, role: payload.role, name: typeof payload.name === 'string' ? payload.name : undefined };
  } catch (error) {
    if (error instanceof UnauthorizedException) throw error;
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

@Injectable()
export class SupportExpertGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers?: { authorization?: string }; supportIdentity?: SupportIdentity }>();
    request.supportIdentity = verifySupportToken(request.headers?.authorization);
    return true;
  }
}

export function verifySocketSupport(socket: Socket): SupportIdentity {
  const authHeader = typeof socket.handshake.auth?.token === 'string'
    ? `Bearer ${socket.handshake.auth.token}`
    : socket.handshake.headers.authorization;
  const identity = verifySupportToken(authHeader);
  socket.data.supportIdentity = identity;
  return identity;
}
