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
  @IsIn(['admin', 'radiologist', 'doctor', 'support_expert', 'SUPPORT_EXPERT', 'ORG_ADMIN', 'ORG_STAFF', 'user']) role!: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsString() imagingCenterId?: string;
}

class UpdateUserDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsIn(['admin', 'radiologist', 'doctor', 'support_expert', 'SUPPORT_EXPERT', 'ORG_ADMIN', 'ORG_STAFF', 'user']) role?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() organizationId?: string;
  @IsOptional() @IsString() imagingCenterId?: string;
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
        organizationId: true,
        imagingCenterId: true,
        organization: { select: { id: true, name: true, slug: true } },
        imagingCenter: { select: { id: true, name: true, slug: true } },
        createdAt: true,
        updatedAt: true,
        doctorProfile: true,
        _count: {
          select: {
            reports: true,
            infoRequests: true,
            shopOrders: true,
            teleReportRequests: true,
            tickets: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('کاربر یافت نشد');

    const [recentReports, recentInfoRequests, recentOrders, recentRequests, recentTickets] = await Promise.all([
      this.prisma.radiologyReport.findMany({
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
      }),
      this.prisma.infoRequest.findMany({
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
      }),
      this.prisma.shopOrder.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.teleReportRequest.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          requestNumber: true,
          imagingType: true,
          status: true,
          createdAt: true,
        },
      }),
      this.prisma.ticket.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      user,
      activity: {
        reports: recentReports,
        infoRequests: recentInfoRequests,
        orders: recentOrders,
        requests: recentRequests,
        tickets: recentTickets,
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
        organizationId: dto.organizationId || null,
        imagingCenterId: dto.imagingCenterId || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        country: true,
        status: true,
        organizationId: true,
        imagingCenterId: true,
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
    if (dto.organizationId !== undefined) data.organizationId = dto.organizationId || null;
    if (dto.imagingCenterId !== undefined) data.imagingCenterId = dto.imagingCenterId || null;

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
        organizationId: true,
        imagingCenterId: true,
        updatedAt: true,
      },
    });
  }

  @Delete(':id')
  async deleteUser(@Headers('authorization') auth: string, @Param('id') id: string) {
    const admin = verifyAdmin(auth);
    if (admin.sub === id) {
      throw new BadRequestException('امکان حذف حساب کاربری مدیر جاری وجود ندارد');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');

    await this.prisma.$transaction(async (tx) => {
      // Disconnect assigned tickets and chat sessions
      await tx.ticket.updateMany({ where: { assignedTo: id }, data: { assignedTo: null } });
      await tx.chatSession.updateMany({ where: { expertId: id }, data: { expertId: null } });
      // Set author to null on reports and info requests if authorId is nullable
      await tx.radiologyReport.updateMany({ where: { authorId: id }, data: { authorId: null } });
      await tx.infoRequest.updateMany({ where: { authorId: id }, data: { authorId: null } });
      // Delete user
      await tx.user.delete({ where: { id } });
    });

    return { ok: true };
  }
}
