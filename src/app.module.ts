import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AboutController } from './about.controller';
import { ConsultationController } from './consultation.controller';
import { ContactController } from './contact.controller';
import { LegalController } from './legal.controller';
import { ShopController } from './shop.controller';
import { TeleReportController } from './tele-report.controller';
import { TeleReportRequestController } from './tele-report-request.controller';
import { TeleReportPaymentController } from './tele-report-payment.controller';
import { AuthController } from './auth.controller';
import { DashboardController } from './dashboard.controller';
import { PatientFileController } from './patient-file.controller';
import { ReportController } from './report.controller';
import { InfoRequestController } from './info-request.controller';
import { ReportArchiveController } from './report-archive.controller';
import { DoctorProfileController } from './doctor-profile.controller';
import { AdminDashboardController } from './admin-dashboard.controller';

@Module({
  controllers: [
    AboutController,
    ConsultationController,
    ContactController,
    LegalController,
    ShopController,
    TeleReportController,
    TeleReportRequestController,
    TeleReportPaymentController,
    AuthController,
    DashboardController,
    PatientFileController,
    ReportController,
    InfoRequestController,
    ReportArchiveController,
    DoctorProfileController,
    AdminDashboardController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
