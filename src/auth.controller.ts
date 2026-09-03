import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
const TOKEN_TTL = '7d';

class RegisterDto {
  @IsString() fullName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
}

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

function signToken(user: AuthUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.fullName },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL },
  );
}

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return { ok: false, error: 'این ایمیل قبلاً ثبت شده است. وارد شوید.' };
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        passwordHash,
        role: 'radiologist',
      },
    });

    const token = signToken({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });
    if (!user) {
      return { ok: false, error: 'ایمیل یا رمز عبور اشتباه است' };
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return { ok: false, error: 'ایمیل یا رمز عبور اشتباه است' };
    }

    if (user.role !== 'radiologist' && user.role !== 'admin') {
      return { ok: false, error: 'دسترسی مجاز نیست' };
    }

    const token = signToken({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  @Get('me')
  async me(@Headers('authorization') auth?: string) {
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException('توکن ارسال نشده است');
    }
    const token = auth.slice('Bearer '.length);
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw new UnauthorizedException('توکن نامعتبر است');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub! },
    });
    if (!user) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}
