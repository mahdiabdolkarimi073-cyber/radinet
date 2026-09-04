import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function verifyAdmin(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new UnauthorizedException('دسترسی مجاز نیست');
    return payload;
  } catch {
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class CreateUserDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsString() @MinLength(3) email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsIn(['admin', 'radiologist', 'user']) role!: string;
  @IsOptional() @IsString() country?: string;
}

class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsIn(['admin', 'radiologist', 'user']) role?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() status?: string;
}

class UserQueryDto {
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

const bcrypt = require('bcryptjs');

@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listUsers(@Headers('authorization') auth: string, @Query() query: UserQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);

    const where: Prisma.UserWhereInput = {};
    if (query.role && query.role !== 'all') where.role = query.role;
    if (query.status && query.status !== 'all') {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { fullName: { contains: value, mode: 'insensitive' } },
        { email: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          status: true,
          country: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reports: true,
              infoRequests: true,
            },
          },
          doctorProfile: {
            select: { specialty: true, workplace: true },
          },
        },
      }),
    ]);

    return {
      items: users,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':id')
  async getUser(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        country: true,
        createdAt: true,
        updatedAt: true,
        doctorProfile: true,
        _count: {
          select: {
            reports: true,
            infoRequests: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const recentReports = await this.prisma.radiologyReport.findMany({
      where: { authorId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        signed: true,
        createdAt: true,
        updatedAt: true,
        request: { select: { requestNumber: true, patientFirstName: true, patientLastName: true } },
      },
    });

    const recentInfoRequests = await this.prisma.infoRequest.findMany({
      where: { authorId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        request: { select: { requestNumber: true } },
      },
    });

    return {
      user,
      activity: {
        reports: recentReports,
        infoRequests: recentInfoRequests,
      },
    };
  }

  @Post()
  async createUser(@Headers('authorization') auth: string, @Body() dto: CreateUserDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('این ایمیل قبلاً ثبت شده است');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        country: dto.country ?? 'IR',
        status: 'active',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        country: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  @Patch(':id')
  async updateUser(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    verifyAdmin(auth);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        country: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  @Delete(':id')
  async deleteUser(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
