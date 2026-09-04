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
import { AdminUserController } from './admin-user.controller';
import { AdminDoctorController } from './admin-doctor.controller';
import { AdminImagingCenterController } from './admin-imaging-center.controller';
import { AdminOrganizationController } from './admin-organization.controller';
import { AdminShopController } from './admin-shop.controller';
import { AdminOrderController } from './admin-order.controller';
import { AdminTeleReportController } from './admin-tele-report.controller';
import { AdminAiTariffController } from './admin-ai-tariff.controller';
import { AdminRoutingController } from './admin-routing.controller';
import { AdminContentController } from './admin-content.controller';
import { AdminNotificationController } from './admin-notification.controller';
import { AdminDiscountController } from './admin-discount.controller';
import { AdminReportController } from './admin-report.controller';
import { AdminSettingsController } from './admin-settings.controller';

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
    AdminUserController,
    AdminDoctorController,
    AdminImagingCenterController,
    AdminOrganizationController,
    AdminShopController,
    AdminOrderController,
    AdminTeleReportController,
    AdminAiTariffController,
    AdminRoutingController,
    AdminContentController,
    AdminNotificationController,
    AdminDiscountController,
    AdminReportController,
    AdminSettingsController,
  ],
  providers: [PrismaService],
})
export class AppModule {}
