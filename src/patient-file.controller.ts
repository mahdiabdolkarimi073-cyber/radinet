import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function extractUserId(auth?: string): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

@Controller('dashboard/patients')
export class PatientFileController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(':id')
  async getPatientFile(@Param('id') id: string, @Headers('authorization') auth?: string) {
    const userId = extractUserId(auth);
    if (!userId) throw new UnauthorizedException('احراز هویت الزامی است');

    const request = await this.prisma.teleReportRequest.findUnique({
      where: { id },
      include: {
        attachments: {
          orderBy: { createdAt: 'asc' },
        },
        reports: {
          include: {
            author: { select: { id: true, fullName: true } },
            images: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request) throw new BadRequestException('پرونده بیمار پیدا نشد');

    return {
      patient: {
        id: request.id,
        requestNumber: request.requestNumber,
        firstName: request.patientFirstName,
        lastName: request.patientLastName,
        nationalId: request.nationalId,
        passportNumber: request.passportNumber,
        phone: request.phone,
        age: request.age,
        gender: request.gender,
        country: request.country,
        city: request.city,
        language: request.language,
      },
      clinical: {
        clinicalHistory: request.clinicalHistory,
        symptoms: request.symptoms,
        imagingType: request.imagingType,
        imagingArea: request.imagingArea,
        studyDate: request.studyDate,
        pacsUrl: request.pacsUrl,
        cloudUrl: request.cloudUrl,
        referralPath: request.referralPath,
        referredAt: request.referredAt,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
      attachments: request.attachments.map((att) => ({
        id: att.id,
        originalName: att.originalName,
        storedName: att.storedName,
        mimeType: att.mimeType,
        size: att.size,
        storagePath: att.storagePath,
        createdAt: att.createdAt,
      })),
      reports: request.reports.map((report) => ({
        id: report.id,
        status: report.status,
        signed: report.signed,
        signatureName: report.signatureName,
        signedAt: report.signedAt,
        authorName: report.author?.fullName ?? null,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      })),
    };
  }
}
