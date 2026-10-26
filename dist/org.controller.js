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
exports.OrgController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const bcrypt = __importStar(require("bcryptjs"));
const jwt = __importStar(require("jsonwebtoken"));
const prisma_service_1 = require("./prisma.service");
const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';
async function verifyOrgUser(auth, prisma) {
    if (!auth?.startsWith('Bearer '))
        throw new common_1.UnauthorizedException('توکن ارسال نشده است');
    let payload;
    try {
        payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET);
    }
    catch {
        throw new common_1.UnauthorizedException('توکن نامعتبر است');
    }
    if (payload.role !== 'ORG_ADMIN' && payload.role !== 'ORG_STAFF') {
        throw new common_1.ForbiddenException('دسترسی به پنل سازمان مجاز نیست');
    }
    const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, organizationId: true, role: true, fullName: true, email: true },
    });
    if (!user)
        throw new common_1.UnauthorizedException('کاربر یافت نشد');
    if (!user.organizationId)
        throw new common_1.ForbiddenException('شما به هیچ سازمانی متصل نیستید');
    return { payload, user };
}
function requireAdmin(role) {
    if (role !== 'ORG_ADMIN')
        throw new common_1.ForbiddenException('این بخش فقط برای مدیر سازمان قابل دسترسی است');
}
// ── DTOs ──
class CreateStaffDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], CreateStaffDto.prototype, "password", void 0);
class UpdateStaffDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateStaffDto.prototype, "status", void 0);
class CreateRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "patientName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "requestType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "description", void 0);
class UpdateOrgDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOrgDto.prototype, "logo", void 0);
class UpdatePermissionsDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "staffCanSubmit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdatePermissionsDto.prototype, "staffCanViewReports", void 0);
class RequestQueryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RequestQueryDto.prototype, "limit", void 0);
let OrgController = class OrgController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── Dashboard Stats ──
    async dashboardStats(auth) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        const [totalRequests, staffCount, pendingInvoices, recentRequests, requestsByType, monthlyData] = await Promise.all([
            this.prisma.teleReportRequest.count({
                where: { user: { organizationId: orgId } },
            }),
            this.prisma.user.count({
                where: { organizationId: orgId, role: { in: ['ORG_ADMIN', 'ORG_STAFF'] } },
            }),
            this.prisma.orgInvoice.count({
                where: {
                    contract: { organizationId: orgId },
                    status: { in: ['unpaid', 'overdue'] },
                },
            }),
            this.prisma.teleReportRequest.findMany({
                where: { user: { organizationId: orgId } },
                orderBy: { createdAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    requestNumber: true,
                    patientFirstName: true,
                    patientLastName: true,
                    imagingType: true,
                    status: true,
                    createdAt: true,
                    user: { select: { fullName: true } },
                },
            }),
            this.prisma.teleReportRequest.groupBy({
                by: ['imagingType'],
                where: { user: { organizationId: orgId } },
                _count: { id: true },
            }),
            this.getMonthlyRequestData(orgId),
        ]);
        return {
            totalRequests,
            staffCount,
            pendingInvoices,
            recentRequests,
            requestsByType: requestsByType.map((r) => ({ name: r.imagingType, value: r._count.id })),
            monthlyData,
        };
    }
    async getMonthlyRequestData(orgId) {
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = await this.prisma.teleReportRequest.count({
                where: {
                    user: { organizationId: orgId },
                    createdAt: { gte: start, lt: end },
                },
            });
            const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            months.push({ month: monthNames[start.getMonth()], count });
        }
        return months;
    }
    // ── User Management ──
    async listUsers(auth) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        const users = await this.prisma.user.findMany({
            where: { organizationId: orgId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                status: true,
                country: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return { items: users };
    }
    async createUser(auth, dto) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.BadRequestException('این ایمیل قبلاً ثبت شده است');
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const newStaff = await this.prisma.user.create({
            data: {
                fullName: dto.fullName,
                email: dto.email,
                passwordHash,
                role: 'ORG_STAFF',
                organizationId: orgId,
            },
            select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
        });
        return { ok: true, user: newStaff };
    }
    async updateUser(auth, id, dto) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        if (target.organizationId !== orgId)
            throw new common_1.ForbiddenException('این کاربر متعلق به سازمان شما نیست');
        const data = {};
        if (dto.fullName)
            data.fullName = dto.fullName;
        if (dto.email) {
            const emailExists = await this.prisma.user.findUnique({ where: { email: dto.email } });
            if (emailExists && emailExists.id !== id)
                throw new common_1.BadRequestException('این ایمیل قبلاً ثبت شده است');
            data.email = dto.email;
        }
        if (dto.password)
            data.passwordHash = await bcrypt.hash(dto.password, 10);
        if (dto.status)
            data.status = dto.status;
        const updated = await this.prisma.user.update({
            where: { id },
            data,
            select: { id: true, fullName: true, email: true, role: true, status: true, createdAt: true },
        });
        return { ok: true, user: updated };
    }
    async deleteUser(auth, id) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const target = await this.prisma.user.findUnique({ where: { id } });
        if (!target)
            throw new common_1.NotFoundException('کاربر یافت نشد');
        if (target.organizationId !== orgId)
            throw new common_1.ForbiddenException('این کاربر متعلق به سازمان شما نیست');
        if (target.id === user.id)
            throw new common_1.BadRequestException('نمی‌توانید حساب خود را حذف کنید');
        await this.prisma.user.delete({ where: { id } });
        return { ok: true };
    }
    // ── Requests ──
    async listRequests(auth, query) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
        const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);
        const where = {};
        // ORG_STAFF sees only own requests; ORG_ADMIN sees all org requests
        if (user.role === 'ORG_STAFF') {
            where.userId = user.id;
        }
        else {
            where.user = { organizationId: orgId };
        }
        if (query.status && query.status !== 'all')
            where.status = query.status;
        if (query.type && query.type !== 'all')
            where.imagingType = query.type;
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate)
                where.createdAt.gte = new Date(query.startDate);
            if (query.endDate)
                where.createdAt.lte = new Date(query.endDate);
        }
        const [total, requests] = await Promise.all([
            this.prisma.teleReportRequest.count({ where }),
            this.prisma.teleReportRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    requestNumber: true,
                    patientFirstName: true,
                    patientLastName: true,
                    imagingType: true,
                    imagingArea: true,
                    status: true,
                    createdAt: true,
                    user: { select: { id: true, fullName: true } },
                },
            }),
        ]);
        return { items: requests, total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) };
    }
    async createRequest(auth, dto) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        // Check staff permissions
        if (user.role === 'ORG_STAFF') {
            const settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
            if (settings && settings.settings && typeof settings.settings === 'object') {
                const s = settings.settings;
                if (s.staffCanSubmit === false)
                    throw new common_1.ForbiddenException('ثبت درخواست برای کارکنان غیرفعال است');
            }
        }
        const requestNumber = `ORG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const parts = dto.patientName.trim().split(' ');
        const patientFirstName = parts[0] ?? '';
        const patientLastName = parts.slice(1).join(' ') ?? '';
        const request = await this.prisma.teleReportRequest.create({
            data: {
                requestNumber,
                userId: user.id,
                country: 'IR',
                language: 'fa',
                patientFirstName,
                patientLastName,
                phone: '',
                city: '',
                gender: 'unknown',
                clinicalHistory: dto.description ?? '',
                symptoms: '',
                imagingType: dto.requestType,
                imagingArea: '',
                status: 'new',
            },
        });
        // Log initial status
        await this.prisma.orgRequestStatusLog.create({
            data: {
                requestId: request.id,
                status: 'new',
                note: 'درخواست توسط پنل سازمان ثبت شد',
                createdBy: user.id,
            },
        });
        return { ok: true, request };
    }
    async getRequestDetail(auth, id) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        const request = await this.prisma.teleReportRequest.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                attachments: true,
                reports: { select: { id: true, status: true, findings: true, conclusion: true, signed: true, createdAt: true } },
            },
        });
        if (!request)
            throw new common_1.NotFoundException('درخواست یافت نشد');
        // Access control
        if (user.role === 'ORG_STAFF' && request.userId !== user.id) {
            throw new common_1.ForbiddenException('شما فقط می‌توانید درخواست‌های خود را مشاهده کنید');
        }
        if (user.role === 'ORG_ADMIN') {
            const requestUser = await this.prisma.user.findUnique({ where: { id: request.userId ?? '' }, select: { organizationId: true } });
            if (!requestUser || requestUser.organizationId !== orgId)
                throw new common_1.ForbiddenException('این درخواست متعلق به سازمان شما نیست');
        }
        const statusLogs = await this.prisma.orgRequestStatusLog.findMany({
            where: { requestId: id },
            orderBy: { createdAt: 'asc' },
            include: { user: { select: { fullName: true } } },
        });
        return { request, statusLogs };
    }
    // ── Reports ──
    async getReports(auth, startDate, endDate) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        const dateWhere = {};
        if (startDate)
            dateWhere.gte = new Date(startDate);
        if (endDate)
            dateWhere.lte = new Date(endDate);
        const baseWhere = { createdAt: Object.keys(dateWhere).length ? dateWhere : undefined };
        if (user.role === 'ORG_STAFF') {
            baseWhere.userId = user.id;
        }
        else {
            baseWhere.user = { organizationId: orgId };
        }
        const [byUser, byType, byDate] = await Promise.all([
            this.prisma.teleReportRequest.groupBy({
                by: ['userId'],
                where: baseWhere,
                _count: { id: true },
            }).then(async (groups) => {
                const userIds = groups.map((g) => g.userId).filter(Boolean);
                const users = await this.prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, fullName: true },
                });
                return groups.map((g) => ({
                    name: users.find((u) => u.id === g.userId)?.fullName ?? 'ناشناس',
                    count: g._count.id,
                }));
            }),
            this.prisma.teleReportRequest.groupBy({
                by: ['imagingType'],
                where: baseWhere,
                _count: { id: true },
            }).then((groups) => groups.map((g) => ({ name: g.imagingType, count: g._count.id }))),
            this.getDailyReportData(baseWhere),
        ]);
        return { byUser, byType, byDate };
    }
    async getDailyReportData(baseWhere) {
        const now = new Date();
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
            const count = await this.prisma.teleReportRequest.count({
                where: { ...baseWhere, createdAt: { gte: day, lt: nextDay } },
            });
            days.push({ date: `${day.getMonth() + 1}/${day.getDate()}`, count });
        }
        return days;
    }
    // ── Contracts & Payments ──
    async listContracts(auth) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const contracts = await this.prisma.organizationContract.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: {
                center: { select: { id: true, name: true } },
                _count: { select: { invoices: true } },
            },
        });
        return { items: contracts };
    }
    async listInvoices(auth) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const invoices = await this.prisma.orgInvoice.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' },
            include: {
                contract: { select: { id: true, contractNumber: true, title: true } },
                _count: { select: { payments: true } },
            },
        });
        // Auto-mark overdue
        const now = new Date();
        for (const inv of invoices) {
            if (inv.status === 'unpaid' && new Date(inv.dueDate) < now) {
                await this.prisma.orgInvoice.update({ where: { id: inv.id }, data: { status: 'overdue' } });
                inv.status = 'overdue';
            }
        }
        return { items: invoices };
    }
    async listPayments(auth) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const payments = await this.prisma.orgPayment.findMany({
            where: { invoice: { contract: { organizationId: orgId } } },
            orderBy: { paidAt: 'desc' },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        contract: { select: { id: true, contractNumber: true } },
                    },
                },
            },
        });
        return { items: payments };
    }
    // ── Settings ──
    async getSettings(auth) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        const orgId = user.organizationId;
        const org = await this.prisma.organization.findUnique({
            where: { id: orgId },
            select: { id: true, name: true, slug: true, email: true, phone: true, address: true, logo: true, city: true, province: true },
        });
        if (!org)
            throw new common_1.NotFoundException('سازمان یافت نشد');
        let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
        if (!settings) {
            settings = await this.prisma.orgSettings.create({
                data: { orgId, settings: { staffCanSubmit: true, staffCanViewReports: true } },
            });
        }
        return { org, settings };
    }
    async updateSettings(auth, dto) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        const data = {};
        if (dto.name)
            data.name = dto.name;
        if (dto.address !== undefined)
            data.address = dto.address;
        if (dto.phone !== undefined)
            data.phone = dto.phone;
        if (dto.email !== undefined)
            data.email = dto.email;
        if (dto.logo !== undefined)
            data.logo = dto.logo;
        const org = await this.prisma.organization.update({ where: { id: orgId }, data });
        return { ok: true, org };
    }
    async updatePermissions(auth, dto) {
        const { user } = await verifyOrgUser(auth, this.prisma);
        requireAdmin(user.role);
        const orgId = user.organizationId;
        let settings = await this.prisma.orgSettings.findUnique({ where: { orgId } });
        if (!settings) {
            settings = await this.prisma.orgSettings.create({
                data: { orgId, settings: {} },
            });
        }
        const current = (settings.settings ?? {});
        if (dto.staffCanSubmit !== undefined)
            current.staffCanSubmit = dto.staffCanSubmit;
        if (dto.staffCanViewReports !== undefined)
            current.staffCanViewReports = dto.staffCanViewReports;
        const updated = await this.prisma.orgSettings.update({
            where: { orgId },
            data: { settings: current },
        });
        return { ok: true, settings: updated };
    }
};
exports.OrgController = OrgController;
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "dashboardStats", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateStaffDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, UpdateStaffDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('requests'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, RequestQueryDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Post)('requests'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateRequestDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)('requests/:id'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getRequestDetail", null);
__decorate([
    (0, common_1.Get)('reports'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('contracts'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listContracts", null);
__decorate([
    (0, common_1.Get)('contracts/invoices'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('contracts/payments'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "listPayments", null);
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)('settings'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateOrgDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Put)('settings/permissions'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePermissionsDto]),
    __metadata("design:returntype", Promise)
], OrgController.prototype, "updatePermissions", null);
exports.OrgController = OrgController = __decorate([
    (0, common_1.Controller)('org'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrgController);
