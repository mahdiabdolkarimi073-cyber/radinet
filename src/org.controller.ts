import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

type OrgPayload = {
  sub: string;
  email: string;
  role: string;
  name: string;
  organizationId?: string;
};

async function verifyOrgUser(
  auth: string | undefined,
  prisma: PrismaService,
): Promise<{ payload: OrgPayload; user: { id: string; organizationId: string | null; role: string; fullName: string; email: string } }> {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  let payload: OrgPayload;
  try {
    payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as OrgPayload;
  } catch {
    throw new UnauthorizedException('توکن نامعتبر است');
  }
  if (payload.role !== 'ORG_ADMIN' && payload.role !== 'ORG_STAFF') {
    throw new ForbiddenException('دسترسی به پنل سازمان مجاز نیست');
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, organizationId: true, role: true, fullName: true, email: true },
  });
  if (!user) throw new UnauthorizedException('کاربر یافت نشد');
  if (!user.organizationId) throw new ForbiddenException('شما به هیچ سازمانی متصل نیستید');
  return { payload, user };
}

function requireAdmin(role: string) {
  if (role !== 'ORG_ADMIN') throw new ForbiddenException('این بخش فقط برای مدیر سازمان قابل دسترسی است');
}

// ── DTOs ──

class CreateStaffDto {
  @IsString() @MinLength(2) fullName!: string;
  @IsEmail() email!: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @MinLength(6) password!: string;
}

class UpdateStaffDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsString() status?: string;
}

class CreateRequestDto {
  @IsString() patientName!: string;
  @IsString() requestType!: string;
  @IsOptional() @IsString() description?: string;
}

class UpdateOrgDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() logo?: string;
}

class UpdatePermissionsDto {
  @IsOptional() staffCanSubmit?: boolean;
  @IsOptional() staffCanViewReports?: boolean;
}

class RequestQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

@Controller('org')
export class OrgController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Dashboard Stats ──

  @Get('dashboard/stats')
  async dashboardStats(@Headers('authorization') auth: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    const [totalRequests, staffCount, pendingInvoices, recentRequests, requestsByType, monthlyData] = await Promise.all([
      this.prisma.teleReportRequest.count({
        where: { user: { organizationId: orgId } },
      }),
      this.prisma.user.count({
        where: { organizationId: orgId, role: { in: ['ORG_ADMIN', 'ORG_STAFF'] } },
      }),
      this.prisma.orgInvoice.count({
        where: {
          contract: { organizationId: orgId },
          status: { in: ['unpaid', 'overdue'] },
        },
      }),
      this.prisma.teleReportRequest.findMany({
        where: { user: { organizationId: orgId } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          requestNumber: true,
          patientFirstName: true,
          patientLastName: true,
          imagingType: true,
          status: true,
          createdAt: true,
          user: { select: { fullName: true } },
        },
      }),
      this.prisma.teleReportRequest.groupBy({
        by: ['imagingType'],
        where: { user: { organizationId: orgId } },
        _count: { id: true },
      }),
      this.getMonthlyRequestData(orgId),
    ]);

    return {
      totalRequests,
      staffCount,
      pendingInvoices,
      recentRequests,
      requestsByType: requestsByType.map((r) => ({ name: r.imagingType, value: r._count.id })),
      monthlyData,
    };
  }

  private async getMonthlyRequestData(orgId: string) {
    const now = new Date();
    const months: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const count = await this.prisma.teleReportRequest.count({
        where: {
          user: { organizationId: orgId },
          createdAt: { gte: start, lt: end },
        },
      });
      const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
      months.push({ month: monthNames[start.getMonth()], count });
    }
    return months;
  }

  // ── User Management ──

  @Get('users')
  async listUsers(@Headers('authorization') auth: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    const users = await this.prisma.user.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { items: users };
  }

  @Post('users')
  async createUser(@Headers('authorization') auth: string, @Body() dto: CreateStaffDto) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('این ایمیل قبلاً ثبت شده است');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newStaff = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        passwordHash,
        role: 'ORG_STAFF',
        organizationId: orgId,
      },
      select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
    });

    return { ok: true, user: newStaff };
  }

  @Put('users/:id')
  async updateUser(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateStaffDto) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('کاربر یافت نشد');
    if (target.organizationId !== orgId) throw new ForbiddenException('این کاربر متعلق به سازمان شما نیست');

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.email) {
      const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (emailExists && emailExists.id !== id) throw new BadRequestException('این ایمیل قبلاً ثبت شده است');
      data.email = dto.email;
    }
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
    if (dto.status) data.status = dto.status;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
    });

    return { ok: true, user: updated };
  }

  @Delete('users/:id')
  async deleteUser(@Headers('authorization') auth: string, @Param('id') id: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('کاربر یافت نشد');
    if (target.organizationId !== orgId) throw new ForbiddenException('این کاربر متعلق به سازمان شما نیست');
    if (target.id === user.id) throw new BadRequestException('نمی‌توانید حساب خود را حذف کنید');

    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  // ── Requests ──

  @Get('requests')
  async listRequests(@Headers('authorization') auth: string, @Query() query: RequestQueryDto) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.TeleReportRequestWhereInput = {};

    // ORG_STAFF sees only own requests; ORG_ADMIN sees all org requests
    if (user.role === 'ORG_STAFF') {
      where.userId = user.id;
    } else {
      where.user = { organizationId: orgId };
    }

    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.type && query.type !== 'all') where.imagingType = query.type;
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    const [total, requests] = await Promise.all([
      this.prisma.teleReportRequest.count({ where }),
      this.prisma.teleReportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          requestNumber: true,
          patientFirstName: true,
          patientLastName: true,
          imagingType: true,
          imagingArea: true,
          status: true,
          createdAt: true,
          user: { select: { id: true, fullName: true } },
        },
      }),
    ]);

    return { items: requests, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
  }

  @Post('requests')
  async createRequest(@Headers('authorization') auth: string, @Body() dto: CreateRequestDto) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    // Check staff permissions
    if (user.role === 'ORG_STAFF') {
      const settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
      if (settings && settings.settings && typeof settings.settings === 'object') {
        const s = settings.settings as Record<string, boolean>;
        if (s.staffCanSubmit === false) throw new ForbiddenException('ثبت درخواست برای کارکنان غیرفعال است');
      }
    }

    const requestNumber = `ORG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const parts = dto.patientName.trim().split(' ');
    const patientFirstName = parts[0] ?? '';
    const patientLastName = parts.slice(1).join(' ') ?? '';

    const request = await this.prisma.teleReportRequest.create({
      data: {
        requestNumber,
        userId: user.id,
        country: 'IR',
        language: 'fa',
        patientFirstName,
        patientLastName,
        phone: '',
        city: '',
        gender: 'unknown',
        clinicalHistory: dto.description ?? '',
        symptoms: '',
        imagingType: dto.requestType,
        imagingArea: '',
        status: 'new',
      },
    });

    // Log initial status
    await this.prisma.orgRequestStatusLog.create({
      data: {
        requestId: request.id,
        status: 'new',
        note: 'درخواست توسط پنل سازمان ثبت شد',
        createdBy: user.id,
      },
    });

    return { ok: true, request };
  }

  @Get('requests/:id')
  async getRequestDetail(@Headers('authorization') auth: string, @Param('id') id: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        attachments: true,
        reports: { select: { id: true, status: true, findings: true, conclusion: true, signed: true, createdAt: true } },
      },
    });

    if (!request) throw new NotFoundException('درخواست یافت نشد');

    // Access control
    if (user.role === 'ORG_STAFF' && request.userId !== user.id) {
      throw new ForbiddenException('شما فقط می‌توانید درخواست‌های خود را مشاهده کنید');
    }
    if (user.role === 'ORG_ADMIN') {
      const requestUser = await this.prisma.user.findUnique({ where: { id: request.userId ?? '' }, select: { organizationId: true } });
      if (!requestUser || requestUser.organizationId !== orgId) throw new ForbiddenException('این درخواست متعلق به سازمان شما نیست');
    }

    const statusLogs = await this.prisma.orgRequestStatusLog.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { fullName: true } } },
    });

    return { request, statusLogs };
  }

  // ── Reports ──

  @Get('reports')
  async getReports(
    @Headers('authorization') auth: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    const dateWhere: Prisma.TeleReportRequestWhereInput['createdAt'] = {};
    if (startDate) dateWhere.gte = new Date(startDate);
    if (endDate) dateWhere.lte = new Date(endDate);

    const baseWhere: Prisma.TeleReportRequestWhereInput = { createdAt: Object.keys(dateWhere).length ? dateWhere : undefined };
    if (user.role === 'ORG_STAFF') {
      baseWhere.userId = user.id;
    } else {
      baseWhere.user = { organizationId: orgId };
    }

    const [byUser, byType, byDate] = await Promise.all([
      this.prisma.teleReportRequest.groupBy({
        by: ['userId'],
        where: baseWhere,
        _count: { id: true },
      }).then(async (groups) => {
        const userIds = groups.map((g) => g.userId).filter(Boolean) as string[];
        const users = await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, fullName: true },
        });
        return groups.map((g) => ({
          name: users.find((u) => u.id === g.userId)?.fullName ?? 'ناشناس',
          count: g._count.id,
        }));
      }),
      this.prisma.teleReportRequest.groupBy({
        by: ['imagingType'],
        where: baseWhere,
        _count: { id: true },
      }).then((groups) => groups.map((g) => ({ name: g.imagingType, count: g._count.id }))),
      this.getDailyReportData(baseWhere),
    ]);

    return { byUser, byType, byDate };
  }

  private async getDailyReportData(baseWhere: Prisma.TeleReportRequestWhereInput) {
    const now = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      const count = await this.prisma.teleReportRequest.count({
        where: { ...baseWhere, createdAt: { gte: day, lt: nextDay } },
      });
      days.push({ date: `${day.getMonth() + 1}/${day.getDate()}`, count });
    }
    return days;
  }

  // ── Contracts & Payments ──

  @Get('contracts')
  async listContracts(@Headers('authorization') auth: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const contracts = await this.prisma.organizationContract.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        center: { select: { id: true, name: true } },
        _count: { select: { invoices: true } },
      },
    });

    return { items: contracts };
  }

  @Get('contracts/invoices')
  async listInvoices(@Headers('authorization') auth: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const invoices = await this.prisma.orgInvoice.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        contract: { select: { id: true, contractNumber: true, title: true } },
        _count: { select: { payments: true } },
      },
    });

    // Auto-mark overdue
    const now = new Date();
    for (const inv of invoices) {
      if (inv.status === 'unpaid' && new Date(inv.dueDate) < now) {
        await this.prisma.orgInvoice.update({ where: { id: inv.id }, data: { status: 'overdue' } });
        inv.status = 'overdue';
      }
    }

    return { items: invoices };
  }

  @Get('contracts/payments')
  async listPayments(@Headers('authorization') auth: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const payments = await this.prisma.orgPayment.findMany({
      where: { invoice: { contract: { organizationId: orgId } } },
      orderBy: { paidAt: 'desc' },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            contract: { select: { id: true, contractNumber: true } },
          },
        },
      },
    });

    return { items: payments };
  }

  // ── Settings ──

  @Get('settings')
  async getSettings(@Headers('authorization') auth: string) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    const orgId = user.organizationId!;

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true, email: true, phone: true, address: true, logo: true, city: true, province: true },
    });

    if (!org) throw new NotFoundException('سازمان یافت نشد');

    let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
    if (!settings) {
      settings = await this.prisma.orgSettings.create({
        data: { orgId, settings: { staffCanSubmit: true, staffCanViewReports: true } as unknown as Prisma.JsonObject },
      });
    }

    return { org, settings };
  }

  @Put('settings')
  async updateSettings(@Headers('authorization') auth: string, @Body() dto: UpdateOrgDto) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    const data: Prisma.OrganizationUpdateInput = {};
    if (dto.name) data.name = dto.name;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.logo !== undefined) data.logo = dto.logo;

    const org = await this.prisma.organization.update({ where: { id: orgId }, data });

    return { ok: true, org };
  }

  @Put('settings/permissions')
  async updatePermissions(@Headers('authorization') auth: string, @Body() dto: UpdatePermissionsDto) {
    const { user } = await verifyOrgUser(auth, this.prisma);
    requireAdmin(user.role);
    const orgId = user.organizationId!;

    let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
    if (!settings) {
      settings = await this.prisma.orgSettings.create({
        data: { orgId, settings: {} as Prisma.JsonObject },
      });
    }

    const current = (settings.settings ?? {}) as Record<string, boolean>;
    if (dto.staffCanSubmit !== undefined) current.staffCanSubmit = dto.staffCanSubmit;
    if (dto.staffCanViewReports !== undefined) current.staffCanViewReports = dto.staffCanViewReports;

    const updated = await this.prisma.orgSettings.update({
      where: { orgId },
      data: { settings: current as Prisma.JsonObject },
    });

    return { ok: true, settings: updated };
  }
}
