import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { PrismaService } from './prisma.service';
import { SupportExpertGuard, verifySupportToken } from './support-auth';

class TelereportQueryDto { @IsOptional() @IsString() status?: string; @IsOptional() @IsString() search?: string; }
class StatusDto { @IsIn(['new', 'pending', 'coordinating', 'scheduled', 'completed', 'cancelled']) status!: string; }
class NotifyDto { @IsIn(['patient', 'doctor', 'both']) recipient!: string; @IsString() @MinLength(1) message!: string; }
class CoordinateDto { @IsOptional() @IsString() notes?: string; @IsOptional() @IsString() scheduledAt?: string; }

@Controller('support/telereports')
@UseGuards(SupportExpertGuard)
export class SupportTelereportController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Headers('authorization') auth: string, @Query() query: TelereportQueryDto) {
    verifySupportToken(auth);
    return this.prisma.teleReportRequest.findMany({ where: { ...(query.status && query.status !== 'all' ? { status: query.status } : {}), ...(query.search?.trim() ? { OR: [{ requestNumber: { contains: query.search.trim(), mode: 'insensitive' } }, { patientFirstName: { contains: query.search.trim(), mode: 'insensitive' } }, { patientLastName: { contains: query.search.trim(), mode: 'insensitive' } }] } : {}) }, include: { reports: { select: { id: true, status: true } }, _count: { select: { attachments: true, infoRequests: true } } }, orderBy: { createdAt: 'desc' } });
  }

  @Get(':id')
  async detail(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifySupportToken(auth);
    const request = await this.prisma.teleReportRequest.findUnique({ where: { id }, include: { attachments: true, reports: true, infoRequests: true } });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    const notifications = await this.prisma.telereportNotification.findMany({ where: { requestId: id }, orderBy: { sentAt: 'desc' } });
    return { ...request, notifications };
  }

  @Patch(':id/status')
  async status(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: StatusDto) {
    verifySupportToken(auth);
    const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    return this.prisma.teleReportRequest.update({ where: { id }, data: { status: dto.status } });
  }

  @Post(':id/notify')
  async notify(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: NotifyDto) {
    const identity = verifySupportToken(auth);
    const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    const notification = await this.prisma.telereportNotification.create({ data: { requestId: id, recipient: dto.recipient, message: dto.message, sentBy: identity.id } });
    return { ok: true, notification };
  }

  @Patch(':id/coordinate')
  async coordinate(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: CoordinateDto) {
    verifySupportToken(auth);
    const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('درخواست تله‌ریپورت یافت نشد');
    return this.prisma.teleReportRequest.update({ where: { id }, data: { status: 'coordinating', ...(dto.notes !== undefined ? { clinicalHistory: `${request.clinicalHistory}\n[پشتیبانی] ${dto.notes}` } : {}), ...(dto.scheduledAt ? { studyDate: new Date(dto.scheduledAt) } : {}) } });
  }
}
