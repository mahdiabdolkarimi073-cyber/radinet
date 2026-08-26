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
exports.ShopController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateOrderItemDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "quantity", void 0);
class CreateOrderDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerEmail", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "shippingAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateOrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "discountCode", void 0);
let ShopController = class ShopController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ── Categories ──
    async categories(includeInactive) {
        return this.prisma.shopCategory.findMany({
            where: includeInactive === 'true' ? undefined : { isActive: true },
            orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
            include: { _count: { select: { products: true } } },
        });
    }
    async categoryBySlug(slug) {
        const category = await this.prisma.shopCategory.findUnique({
            where: { slug },
            include: { children: true, parent: true },
        });
        if (!category)
            throw new common_1.NotFoundException('دسته‌بندی یافت نشد');
        return category;
    }
    // ── Products ──
    async products(categorySlug, search, featured, sort, page, pageSize, includeInactive, minPrice, maxPrice, inStock, brand, hasDiscount) {
        const where = {};
        if (includeInactive !== 'true')
            where.isActive = true;
        if (featured === 'true')
            where.isFeatured = true;
        if (inStock === 'true')
            where.stock = { gt: 0 };
        if (hasDiscount === 'true')
            where.discountPercent = { gt: 0 };
        if (brand)
            where.brand = brand;
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = minPrice;
            if (maxPrice)
                where.price.lte = maxPrice;
        }
        if (categorySlug) {
            const cat = await this.prisma.shopCategory.findUnique({ where: { slug: categorySlug } });
            if (cat)
                where.categoryId = cat.id;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { shortDescription: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
            ];
        }
        const order = {};
        if (sort === 'price-asc')
            order.price = 'asc';
        else if (sort === 'price-desc')
            order.price = 'desc';
        else if (sort === 'sales')
            order.salesCount = 'desc';
        else if (sort === 'rating')
            order.rating = 'desc';
        else
            order.createdAt = 'desc';
        const take = Math.min(pageSize ?? 20, 100);
        const skip = ((page ?? 1) - 1) * take;
        const [items, total] = await Promise.all([
            this.prisma.shopProduct.findMany({ where, orderBy: order, take, skip, include: { category: true } }),
            this.prisma.shopProduct.count({ where }),
        ]);
        return { items, total, page: page ?? 1, pageSize: take };
    }
    async featuredProducts() {
        return this.prisma.shopProduct.findMany({
            where: { isFeatured: true, isActive: true, stock: { gt: 0 } },
            orderBy: { salesCount: 'desc' },
            take: 8,
            include: { category: true },
        });
    }
    async productBySlug(slug) {
        const product = await this.prisma.shopProduct.findUnique({
            where: { slug },
            include: { category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('محصول یافت نشد');
        return product;
    }
    // ── Orders ──
    async createOrder(dto) {
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('سبد خرید خالی است');
        }
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.shopProduct.findMany({
            where: { id: { in: productIds } },
        });
        if (products.length !== productIds.length) {
            throw new common_1.BadRequestException('یک یا چند محصول یافت نشد');
        }
        for (const item of dto.items) {
            const p = products.find((x) => x.id === item.productId);
            if (!p)
                throw new common_1.BadRequestException('محصول نامعتبر');
            if (p.stock < item.quantity) {
                throw new common_1.BadRequestException(`موجودی ناکافی برای: ${p.name}`);
            }
        }
        let discountTotal = 0;
        let appliedDiscount = null;
        if (dto.discountCode) {
            const discount = await this.prisma.shopDiscount.findUnique({ where: { code: dto.discountCode } });
            if (!discount || !discount.isActive)
                throw new common_1.BadRequestException('کد تخفیف نامعتبر است');
            const now = new Date();
            if (discount.startsAt && now < discount.startsAt)
                throw new common_1.BadRequestException('کد تخفیف هنوز فعال نشده');
            if (discount.endsAt && now > discount.endsAt)
                throw new common_1.BadRequestException('کد تخفیف منقضی شده');
            if (discount.usageLimit && discount.usedCount >= discount.usageLimit)
                throw new common_1.BadRequestException('سقف استفاده از کد تخفیف پر شده');
            appliedDiscount = discount;
        }
        const items = dto.items.map((item) => {
            const p = products.find((x) => x.id === item.productId);
            const unit = Number(p.price);
            const line = unit * item.quantity;
            if (appliedDiscount && appliedDiscount.type === 'percent') {
                discountTotal += Math.round((line * Number(appliedDiscount.value)) / 100);
            }
            return {
                productId: p.id,
                productName: p.name,
                unitPrice: p.price,
                quantity: item.quantity,
                lineTotal: BigInt(line),
            };
        });
        const subtotal = items.reduce((s, i) => s + Number(i.lineTotal), 0);
        const shippingCost = 0;
        const total = subtotal - discountTotal + shippingCost;
        const orderNumber = `RAD-${Date.now().toString(36).toUpperCase()}`;
        const order = await this.prisma.shopOrder.create({
            data: {
                orderNumber,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                customerEmail: dto.customerEmail,
                shippingAddress: dto.shippingAddress ?? '',
                notes: dto.notes,
                subtotal,
                discountTotal,
                shippingCost,
                total,
                status: 'pending',
                paymentStatus: 'unpaid',
                items: { create: items.map((i) => ({ ...i, lineTotal: i.lineTotal })) },
            },
            include: { items: true },
        });
        await Promise.all(dto.items.map((item) => this.prisma.shopProduct.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        })));
        if (appliedDiscount) {
            await this.prisma.shopDiscount.update({
                where: { id: appliedDiscount.id },
                data: { usedCount: { increment: 1 } },
            });
        }
        return order;
    }
    async trackOrder(orderNumber) {
        const order = await this.prisma.shopOrder.findUnique({
            where: { orderNumber },
            include: { items: true },
        });
        if (!order)
            throw new common_1.NotFoundException('سفارش یافت نشد');
        return order;
    }
    async ordersByPhone(phone) {
        return this.prisma.shopOrder.findMany({
            where: { customerPhone: phone },
            orderBy: { createdAt: 'desc' },
            include: { items: true },
        });
    }
    // ── Discounts ──
    async validateDiscount(code) {
        const discount = await this.prisma.shopDiscount.findUnique({ where: { code } });
        if (!discount || !discount.isActive)
            throw new common_1.NotFoundException('کد تخفیف نامعتبر است');
        const now = new Date();
        if (discount.startsAt && now < discount.startsAt)
            throw new common_1.BadRequestException('کد تخفیف هنوز فعال نشده');
        if (discount.endsAt && now > discount.endsAt)
            throw new common_1.BadRequestException('کد تخفیف منقضی شده');
        if (discount.usageLimit && discount.usedCount >= discount.usageLimit)
            throw new common_1.BadRequestException('سقف استفاده پر شده');
        return discount;
    }
};
exports.ShopController = ShopController;
__decorate([
    (0, common_1.Get)('categories'),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "categories", null);
__decorate([
    (0, common_1.Get)('categories/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "categoryBySlug", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Query)('categorySlug')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('featured')),
    __param(3, (0, common_1.Query)('sort')),
    __param(4, (0, common_1.Query)('page', new common_1.ParseIntPipe({ optional: true }))),
    __param(5, (0, common_1.Query)('pageSize', new common_1.ParseIntPipe({ optional: true }))),
    __param(6, (0, common_1.Query)('includeInactive')),
    __param(7, (0, common_1.Query)('minPrice', new common_1.ParseIntPipe({ optional: true }))),
    __param(8, (0, common_1.Query)('maxPrice', new common_1.ParseIntPipe({ optional: true }))),
    __param(9, (0, common_1.Query)('inStock')),
    __param(10, (0, common_1.Query)('brand')),
    __param(11, (0, common_1.Query)('hasDiscount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number, String, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "products", null);
__decorate([
    (0, common_1.Get)('products/featured'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "featuredProducts", null);
__decorate([
    (0, common_1.Get)('products/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "productBySlug", null);
__decorate([
    (0, common_1.Post)('orders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateOrderDto]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('orders/:orderNumber'),
    __param(0, (0, common_1.Param)('orderNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "trackOrder", null);
__decorate([
    (0, common_1.Get)('orders/phone/:phone'),
    __param(0, (0, common_1.Param)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "ordersByPhone", null);
__decorate([
    (0, common_1.Get)('discounts/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "validateDiscount", null);
exports.ShopController = ShopController = __decorate([
    (0, common_1.Controller)('shop'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShopController);
