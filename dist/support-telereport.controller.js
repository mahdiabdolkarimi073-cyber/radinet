"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportTelereportController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
const support_auth_1 = require("./support-auth");
class TelereportQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelereportQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TelereportQueryDto.prototype, "search", void 0);
class StatusDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['new', 'pending', 'coordinating', 'scheduled', 'completed', 'cancelled']),
    __metadata("design:type", String)
], StatusDto.prototype, "status", void 0);
class NotifyDto {
}
__decorate([
    (0, class_validator_1.IsIn)(['patient', 'doctor', 'both']),
    __metadata("design:type", String)
], NotifyDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], NotifyDto.prototype, "message", void 0);
class CoordinateDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CoordinateDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CoordinateDto.prototype, "scheduledAt", void 0);
let SupportTelereportController = class SupportTelereportController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(auth, query) {
        (0, support_auth_1.verifySupportToken)(auth);
        return this.prisma.teleReportRequest.findMany({ where: { ...(query.status && query.status !== 'all' ? { status: query.status } : {}), ...(query.search?.trim() ? { OR: [{ requestNumber: { contains: query.search.trim(), mode: 'insensitive' } }, { patientFirstName: { contains: query.search.trim(), mode: 'insensitive' } }, { patientLastName: { contains: query.search.trim(), mode: 'insensitive' } }] } : {}) }, include: { reports: { select: { id: true, status: true } }, _count: { select: { attachments: true, infoRequests: true } } }, orderBy: { createdAt: 'desc' } });
    }
    async detail(auth, id) {
        (0, support_auth_1.verifySupportToken)(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id }, include: { attachments: true, reports: true, infoRequests: true } });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        const notifications = await this.prisma.telereportNotification.findMany({ where: { requestId: id }, orderBy: { sentAt: 'desc' } });
        return { ...request, notifications };
    }
    async status(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        return this.prisma.teleReportRequest.update({ where: { id }, data: { status: dto.status } });
    }
    async notify(auth, id, dto) {
        const identity = (0, support_auth_1.verifySupportToken)(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        const notification = await this.prisma.telereportNotification.create({ data: { requestId: id, recipient: dto.recipient, message: dto.message, sentBy: identity.id } });
        return { ok: true, notification };
    }
    async coordinate(auth, id, dto) {
        (0, support_auth_1.verifySupportToken)(auth);
        const request = await this.prisma.teleReportRequest.findUnique({ where: { id } });
        if (!request)
            throw new common_1.NotFoundException('درخواست تله‌ریپورت یافت نشد');
        return this.prisma.teleReportRequest.update({ where: { id }, data: { status: 'coordinating', ...(dto.notes !== undefined ? { clinicalHistory: `${request.clinicalHistory}\n[پشتیبانی] ${dto.notes}` } : {}), ...(dto.scheduledAt ? { studyDate: new Date(dto.scheduledAt) } : {}) } });
    }
};
exports.SupportTelereportController = SupportTelereportController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TelereportQueryDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, StatusDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "status", null);
__decorate([
    (0, common_1.Post)(':id/notify'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, NotifyDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "notify", null);
__decorate([
    (0, common_1.Patch)(':id/coordinate'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, CoordinateDto]),
    __metadata("design:returntype", Promise)
], SupportTelereportController.prototype, "coordinate", null);
exports.SupportTelereportController = SupportTelereportController = __decorate([
    (0, common_1.Controller)('support/telereports'),
    (0, common_1.UseGuards)(support_auth_1.SupportExpertGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupportTelereportController);
