import {
  Body,
  Controller,
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
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
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

class TeleReportQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() imagingType?: string;
  @IsOptional() @IsString() assignedDoctorId?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class AssignDoctorDto {
  @IsString() doctorId!: string;
}

class CreateTariffDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() imagingType!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() aiAnalysisEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) aiAnalysisPrice?: number;
  @IsOptional() @IsBoolean() rushEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) rushPrice?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

class UpdateTariffDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() imagingType?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsBoolean() aiAnalysisEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) aiAnalysisPrice?: number;
  @IsOptional() @IsBoolean() rushEnabled?: boolean;
  @IsOptional() @IsNumber() @Min(0) rushPrice?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() @Min(0) displayOrder?: number;
}

@Controller('admin/tele-reports')
export class AdminTeleReportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listRequests(@Headers('authorization') auth: string, @Query() query: TeleReportQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.TeleReportRequestWhereInput = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.imagingType && query.imagingType !== 'all') where.imagingType = query.imagingType;
    if (query.assignedDoctorId && query.assignedDoctorId !== 'all') {
      const reports = await this.prisma.radiologyReport.findMany({
        where: { authorId: query.assignedDoctorId },
        select: { requestId: true },
      });
      where.id = { in: reports.map((r) => r.requestId) };
    }
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { requestNumber: { contains: value, mode: 'insensitive' } },
        { patientFirstName: { contains: value, mode: 'insensitive' } },
        { patientLastName: { contains: value, mode: 'insensitive' } },
        { phone: { contains: value, mode: 'insensitive' } },
        { nationalId: { contains: value, mode: 'insensitive' } },
        { city: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, requests] = await Promise.all([
      this.prisma.teleReportRequest.count({ where }),
      this.prisma.teleReportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          attachments: {
            select: { id: true, originalName: true, mimeType: true, size: true },
          },
          reports: {
            select: {
              id: true,
              status: true,
              signed: true,
              authorId: true,
              author: { select: { id: true, fullName: true } },
            },
          },
          _count: { select: { infoRequests: true } },
        },
      }),
    ]);

    return {
      items: requests,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':id')
  async getRequest(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id },
      include: {
        attachments: true,
        reports: {
          include: {
            author: { select: { id: true, fullName: true } },
            images: true,
          },
        },
        infoRequests: {
          include: {
            author: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('درخواست یافت نشد');
    return request;
  }

  @Patch(':id/assign-doctor')
  async assignDoctor(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: AssignDoctorDto,
  ) {
    verifyAdmin(auth);

    const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('درخواست یافت نشد');

    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: dto.doctorId },
      include: { user: true },
    });
    if (!doctor) throw new NotFoundException('پزشک یافت نشد');
    if (!doctor.isActive || doctor.collaborationStatus !== 'approved') {
      throw new BadRequestException('پزشک فعال یا تأییدشده نیست');
    }

    const existingReport = await this.prisma.radiologyReport.findFirst({
      where: { requestId: id, authorId: doctor.userId },
    });

    if (existingReport) {
      return this.prisma.radiologyReport.update({
        where: { id: existingReport.id },
        data: { status: 'draft' },
        include: { author: { select: { id: true, fullName: true } } },
      });
    }

    const report = await this.prisma.radiologyReport.create({
      data: {
        requestId: id,
        authorId: doctor.userId,
        status: 'draft',
        findings: '',
        conclusion: '',
      },
      include: { author: { select: { id: true, fullName: true } } },
    });

    await this.prisma.teleReportRequest.update({
      where: { id },
      data: { status: 'assigned' },
    });

    return report;
  }

  @Patch(':id/status')
  async updateRequestStatus(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    verifyAdmin(auth);

    const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('درخواست یافت نشد');

    return this.prisma.teleReportRequest.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, requestNumber: true, status: true, updatedAt: true },
    });
  }

  @Get(':id/reports')
  async getRequestReports(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('درخواست یافت نشد');

    return this.prisma.radiologyReport.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, fullName: true } },
        images: true,
      },
    });
  }

  // ── Tariffs ──

  @Get('tariffs/list')
  async listTariffs(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.teleReportTariff.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  @Post('tariffs')
  async createTariff(@Headers('authorization') auth: string, @Body() dto: CreateTariffDto) {
    verifyAdmin(auth);

    return this.prisma.teleReportTariff.create({
      data: {
        name: dto.name,
        imagingType: dto.imagingType,
        description: dto.description ?? '',
        price: dto.price,
        currency: dto.currency ?? 'IRR',
        aiAnalysisEnabled: dto.aiAnalysisEnabled ?? false,
        aiAnalysisPrice: dto.aiAnalysisPrice ?? 0,
        rushEnabled: dto.rushEnabled ?? false,
        rushPrice: dto.rushPrice ?? 0,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  @Patch('tariffs/:id')
  async updateTariff(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateTariffDto) {
    verifyAdmin(auth);

    const tariff = await this.prisma.teleReportTariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('تعرفه یافت نشد');

    return this.prisma.teleReportTariff.update({
      where: { id },
      data: dto,
    });
  }

  @Patch('tariffs/:id/approve-ai')
  async approveAiAnalysis(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const tariff = await this.prisma.teleReportTariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('تعرفه یافت نشد');

    return this.prisma.teleReportTariff.update({
      where: { id },
      data: { aiAnalysisEnabled: true },
      select: { id: true, name: true, aiAnalysisEnabled: true, updatedAt: true },
    });
  }

  @Patch('tariffs/:id/reject-ai')
  async rejectAiAnalysis(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const tariff = await this.prisma.teleReportTariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException('تعرفه یافت نشد');

    return this.prisma.teleReportTariff.update({
      where: { id },
      data: { aiAnalysisEnabled: false },
      select: { id: true, name: true, aiAnalysisEnabled: true, updatedAt: true },
    });
  }
}
