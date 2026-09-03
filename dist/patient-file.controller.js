"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientFileController = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
function extractUserId(auth) {
    if (!auth?.startsWith('Bearer '))
        return null;
    try {
        const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
        return payload.sub ?? null;
    }
    catch {
        return null;
    }
}
let PatientFileController = class PatientFileController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPatientFile(id, auth) {
        const userId = extractUserId(auth);
        if (!userId)
            throw new common_1.UnauthorizedException('احراز هویت الزامی است');
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
        if (!request)
            throw new common_1.BadRequestException('پرونده بیمار پیدا نشد');
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
};
exports.PatientFileController = PatientFileController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PatientFileController.prototype, "getPatientFile", null);
exports.PatientFileController = PatientFileController = __decorate([
    (0, common_1.Controller)('dashboard/patients'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PatientFileController);
