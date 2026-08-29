import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { diskStorage } from 'multer';
import { PrismaService } from './prisma.service';

const uploadDirectory = join(process.cwd(), 'uploads', 'tele-report');
const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/dicom',
  'application/octet-stream',
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.dcm', '.dicom']);

mkdirSync(uploadDirectory, { recursive: true });

class CheckPatientDto {
  @IsString() @Length(10, 10) nationalId!: string;
}

class CreateTeleReportRequestDto {
  @IsString() @Length(2, 80) country!: string;
  @IsString() @Length(2, 40) language!: string;
  @IsString() @Length(2, 80) patientFirstName!: string;
  @IsString() @Length(2, 80) patientLastName!: string;
  @IsOptional() @IsString() @Length(0, 30) nationalId?: string;
  @IsOptional() @IsString() @Length(0, 40) passportNumber?: string;
  @IsString() @Length(7, 30) phone!: string;
  @IsString() @Length(2, 80) city!: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(130) age?: number;
  @IsString() @IsIn(['male', 'female']) gender!: string;
  @IsString() @Length(2, 5000) clinicalHistory!: string;
  @IsString() @Length(2, 5000) symptoms!: string;
  @IsString() @Length(2, 100) imagingType!: string;
  @IsString() @Length(2, 120) imagingArea!: string;
  @IsOptional() @IsDateString() studyDate?: string;
  @IsOptional() @IsString() @Length(0, 2000) pacsUrl?: string;
  @IsOptional() @IsString() @Length(0, 2000) cloudUrl?: string;
}

class SetReferralPathDto {
  @IsString() @IsIn(['auto', 'smart', 'manual']) referralPath!: string;
}

function fileFilter(_request: Express.Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) {
  const extension = extname(file.originalname).toLowerCase();
  if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
    callback(new BadRequestException('فرمت فایل مجاز نیست'), false);
    return;
  }
  callback(null, true);
}

@Controller('tele-report/requests')
export class TeleReportRequestController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('check-patient')
  async checkPatient(@Body() body: CheckPatientDto) {
    const patient = await this.prisma.teleReportRequest.findFirst({
      where: { nationalId: body.nationalId.trim() },
      select: { id: true },
    });
    return { hasHistory: Boolean(patient) };
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', 20, {
    storage: diskStorage({
      destination: uploadDirectory,
      filename: (_request, file, callback) => {
        callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    fileFilter,
    limits: { fileSize: 25 * 1024 * 1024, files: 20, fieldSize: 2 * 1024 * 1024 },
  }))
  async create(
    @Body() body: CreateTeleReportRequestDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
  ) {
    if (!body.nationalId && !body.passportNumber) {
      throw new BadRequestException('کد ملی یا شماره پاسپورت الزامی است');
    }
    if (!body.pacsUrl && !body.cloudUrl && files.length === 0) {
      throw new BadRequestException('حداقل یک فایل یا لینک تصویربرداری وارد کنید');
    }

    const requestNumber = `TR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
    const request = await this.prisma.teleReportRequest.create({
      data: {
        requestNumber,
        country: body.country,
        language: body.language,
        patientFirstName: body.patientFirstName,
        patientLastName: body.patientLastName,
        nationalId: body.nationalId || null,
        passportNumber: body.passportNumber || null,
        phone: body.phone,
        city: body.city,
        age: body.age,
        gender: body.gender,
        clinicalHistory: body.clinicalHistory,
        symptoms: body.symptoms,
        imagingType: body.imagingType,
        imagingArea: body.imagingArea,
        studyDate: body.studyDate ? new Date(body.studyDate) : null,
        pacsUrl: body.pacsUrl || null,
        cloudUrl: body.cloudUrl || null,
        attachments: files.length ? {
          create: files.map((file) => ({
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            storagePath: file.path,
          })),
        } : undefined,
      },
      include: { attachments: true },
    });

    return { requestNumber: request.requestNumber, status: request.status, createdAt: request.createdAt };
  }

  @Get(':requestNumber')
  async findOne(@Param('requestNumber') requestNumber: string) {
    const request = await this.prisma.teleReportRequest.findUnique({
      where: { requestNumber },
      select: { requestNumber: true, status: true, referralPath: true, referredAt: true, createdAt: true, updatedAt: true },
    });
    if (!request) throw new BadRequestException('درخواست پیدا نشد');
    return request;
  }

  @Patch(':requestNumber/referral-path')
  async setReferralPath(
    @Param('requestNumber') requestNumber: string,
    @Body() body: SetReferralPathDto,
  ) {
    const request = await this.prisma.teleReportRequest.findUnique({
      where: { requestNumber },
      select: { id: true, status: true },
    });
    if (!request) throw new BadRequestException('درخواست پیدا نشد');

    if (body.referralPath !== 'auto') {
      throw new BadRequestException('مسیر انتخاب‌شده در حال حاضر قابل دسترسی نیست. در توسعه آینده امکان‌دسترسی خواهد بود.');
    }

    const updated = await this.prisma.teleReportRequest.update({
      where: { requestNumber },
      data: {
        referralPath: body.referralPath,
        referredAt: new Date(),
        status: 'referred',
      },
      select: { requestNumber: true, status: true, referralPath: true, referredAt: true },
    });

    return {
      requestNumber: updated.requestNumber,
      status: updated.status,
      referralPath: updated.referralPath,
      referredAt: updated.referredAt,
      message: 'ارجاع با موفقیت ثبت شد. تیم رادینت درخواست شما را دریافت کرد و به‌زودی گزارش را آماده خواهد کرد.',
    };
  }
}
