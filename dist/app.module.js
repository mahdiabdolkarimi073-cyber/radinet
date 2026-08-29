"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const about_controller_1 = require("./about.controller");
const consultation_controller_1 = require("./consultation.controller");
const contact_controller_1 = require("./contact.controller");
const legal_controller_1 = require("./legal.controller");
const shop_controller_1 = require("./shop.controller");
const tele_report_controller_1 = require("./tele-report.controller");
const tele_report_request_controller_1 = require("./tele-report-request.controller");
const tele_report_payment_controller_1 = require("./tele-report-payment.controller");
const auth_controller_1 = require("./auth.controller");
const dashboard_controller_1 = require("./dashboard.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({ controllers: [about_controller_1.AboutController, consultation_controller_1.ConsultationController, contact_controller_1.ContactController, legal_controller_1.LegalController, shop_controller_1.ShopController, tele_report_controller_1.TeleReportController, tele_report_request_controller_1.TeleReportRequestController, tele_report_payment_controller_1.TeleReportPaymentController, auth_controller_1.AuthController, dashboard_controller_1.DashboardController], providers: [prisma_service_1.PrismaService] })
], AppModule);
