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
exports.AboutController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("./prisma.service");
class ContentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentDto.prototype, "key", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContentDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ContentDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ContentDto.prototype, "displayOrder", void 0);
class MediaDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MediaDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MediaDto.prototype, "displayOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], MediaDto.prototype, "isActive", void 0);
let AboutController = class AboutController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPublic() { const [content, media, certificates] = await Promise.all([this.prisma.aboutContent.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }), this.prisma.aboutMedia.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } }), this.prisma.certificate.findMany({ where: { isActive: true }, orderBy: { displayOrder: 'asc' } })]); return { content, team: media.filter((item) => item.kind === 'team'), office: media.filter((item) => item.kind === 'office'), certificates }; }
    createContent(body) { return this.prisma.aboutContent.create({ data: body }); }
    updateContent(id, body) { return this.prisma.aboutContent.update({ where: { id }, data: body }); }
    deleteContent(id) { return this.prisma.aboutContent.delete({ where: { id } }); }
    createMedia(body) { return this.prisma.aboutMedia.create({ data: body }); }
    updateMedia(id, body) { return this.prisma.aboutMedia.update({ where: { id }, data: body }); }
    deleteMedia(id) { return this.prisma.aboutMedia.delete({ where: { id } }); }
    createCertificate(body) { return this.prisma.certificate.create({ data: body }); }
    updateCertificate(id, body) { return this.prisma.certificate.update({ where: { id }, data: body }); }
    deleteCertificate(id) { return this.prisma.certificate.delete({ where: { id } }); }
};
exports.AboutController = AboutController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AboutController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Post)('content'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ContentDto]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "createContent", null);
__decorate([
    (0, common_1.Patch)('content/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "updateContent", null);
__decorate([
    (0, common_1.Delete)('content/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "deleteContent", null);
__decorate([
    (0, common_1.Post)('media'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MediaDto]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "createMedia", null);
__decorate([
    (0, common_1.Patch)('media/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "updateMedia", null);
__decorate([
    (0, common_1.Delete)('media/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "deleteMedia", null);
__decorate([
    (0, common_1.Post)('certificates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [MediaDto]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "createCertificate", null);
__decorate([
    (0, common_1.Patch)('certificates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "updateCertificate", null);
__decorate([
    (0, common_1.Delete)('certificates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AboutController.prototype, "deleteCertificate", null);
exports.AboutController = AboutController = __decorate([
    (0, common_1.Controller)('about'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AboutController);
