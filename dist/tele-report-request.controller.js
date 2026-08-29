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
exports.TeleReportRequestController = void 0;
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const path_1 = require("path");
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const multer_1 = require("multer");
const prisma_service_1 = require("./prisma.service");
const uploadDirectory = (0, path_1.join)(process.cwd(), 'uploads', 'tele-report');
const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/dicom',
    'application/octet-stream',
]);
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.pdf', '.dcm', '.dicom']);
(0, fs_1.mkdirSync)(uploadDirectory, { recursive: true });
class CheckPatientDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(10, 10),
    __metadata("design:type", String)
], CheckPatientDto.prototype, "nationalId", void 0);
class CreateTeleReportRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 40),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "patientFirstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "patientLastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 30),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "nationalId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 40),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "passportNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(7, 30),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(130),
    __metadata("design:type", Number)
], CreateTeleReportRequestDto.prototype, "age", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['male', 'female']),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 5000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "clinicalHistory", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 5000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "symptoms", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 100),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "imagingType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 120),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "imagingArea", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "studyDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "pacsUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 2000),
    __metadata("design:type", String)
], CreateTeleReportRequestDto.prototype, "cloudUrl", void 0);
function fileFilter(_request, file, callback) {
    const extension = (0, path_1.extname)(file.originalname).toLowerCase();
    if (!allowedMimeTypes.has(file.mimetype) || !allowedExtensions.has(extension)) {
        callback(new common_1.BadRequestException('فرمت فایل مجاز نیست'), false);
        return;
    }
    callback(null, true);
}
let TeleReportRequestController = class TeleReportRequestController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async checkPatient(body) {
        const patient = await this.prisma.teleReportRequest.findFirst({
            where: { nationalId: body.nationalId.trim() },
            select: { id: true },
        });
        return { hasHistory: Boolean(patient) };
    }
    async create(body, files = []) {
        if (!body.nationalId && !body.passportNumber) {
            throw new common_1.BadRequestException('کد ملی یا شماره پاسپورت الزامی است');
        }
        if (!body.pacsUrl && !body.cloudUrl && files.length === 0) {
            throw new common_1.BadRequestException('حداقل یک فایل یا لینک تصویربرداری وارد کنید');
        }
        const requestNumber = `TR-${Date.now().toString(36).toUpperCase()}-${(0, crypto_1.randomUUID)().slice(0, 6).toUpperCase()}`;
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
    async findOne(requestNumber) {
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { requestNumber },
            select: { requestNumber: true, status: true, createdAt: true, updatedAt: true },
        });
        if (!request)
            throw new common_1.BadRequestException('درخواست پیدا نشد');
        return request;
    }
};
exports.TeleReportRequestController = TeleReportRequestController;
__decorate([
    (0, common_1.Post)('check-patient'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CheckPatientDto]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "checkPatient", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, {
        storage: (0, multer_1.diskStorage)({
            destination: uploadDirectory,
            filename: (_request, file, callback) => {
                callback(null, `${(0, crypto_1.randomUUID)()}${(0, path_1.extname)(file.originalname).toLowerCase()}`);
            },
        }),
        fileFilter,
        limits: { fileSize: 25 * 1024 * 1024, files: 20, fieldSize: 2 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateTeleReportRequestDto, Array]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':requestNumber'),
    __param(0, (0, common_1.Param)('requestNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeleReportRequestController.prototype, "findOne", null);
exports.TeleReportRequestController = TeleReportRequestController = __decorate([
    (0, common_1.Controller)('tele-report/requests'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeleReportRequestController);
