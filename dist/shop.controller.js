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
class CreateCategoryDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "heroImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "aboutTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "aboutDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "aboutImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "iconKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "colorTheme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateCategoryDto.prototype, "displayOrder", void 0);
class UpdateCategoryDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "heroImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "aboutTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "aboutDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "aboutImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "iconKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "colorTheme", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCategoryDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateCategoryDto.prototype, "displayOrder", void 0);
class CreateProductDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "shortDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "technicalSpecifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "oldPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProductDto.prototype, "isFeatured", void 0);
class UpdateProductDto {
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "shortDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "technicalSpecifications", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "categoryId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "brand", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "oldPrice", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "discountPercent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "stock", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "imageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isActive", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "isFeatured", void 0);
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
    async createCategory(dto) {
        return this.prisma.shopCategory.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description ?? '',
                imageUrl: dto.imageUrl ?? '',
                heroImageUrl: dto.heroImageUrl ?? '',
                aboutTitle: dto.aboutTitle ?? 'درباره این دسته‌بندی',
                aboutDescription: dto.aboutDescription ?? '',
                aboutImageUrl: dto.aboutImageUrl ?? '',
                iconKey: dto.iconKey ?? 'imaging-equipment',
                colorTheme: dto.colorTheme ?? 'blue',
                parentId: dto.parentId,
                displayOrder: dto.displayOrder ?? 0,
            },
            include: { children: true, parent: true },
        });
    }
    async updateCategory(slug, dto) {
        const category = await this.prisma.shopCategory.findUnique({ where: { slug } });
        if (!category)
            throw new common_1.NotFoundException('دسته‌بندی یافت نشد');
        return this.prisma.shopCategory.update({
            where: { id: category.id },
            data: dto,
            include: { children: true, parent: true },
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
    // ── Cart configuration ──
    async cartConfig() {
        const setting = await this.prisma.siteSetting.findUnique({ where: { settingKey: 'shop_checkout' } });
        const value = setting?.settingValue;
        const config = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        return {
            taxRate: typeof config.taxRate === 'number' ? config.taxRate : 0,
            shippingCost: typeof config.shippingCost === 'number' ? config.shippingCost : 0,
            freeShippingThreshold: typeof config.freeShippingThreshold === 'number' ? config.freeShippingThreshold : 0,
        };
    }
    // ── Products ──
    async products(categorySlug, search, featured, sort, page, pageSize, includeInactive, minPrice, maxPrice, inStock, brand, brands, hasDiscount, outOfStock) {
        const where = {};
        if (includeInactive !== 'true')
            where.isActive = true;
        if (featured === 'true')
            where.isFeatured = true;
        if (inStock === 'true')
            where.stock = { gt: 0 };
        if (outOfStock === 'true')
            where.stock = { equals: 0 };
        if (hasDiscount === 'true')
            where.discountPercent = { gt: 0 };
        if (brand)
            where.brand = brand;
        if (brands) {
            const brandList = brands.split(',').map((b) => b.trim()).filter(Boolean);
            if (brandList.length === 1)
                where.brand = brandList[0];
            else if (brandList.length > 1)
                where.brand = { in: brandList };
        }
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
                { technicalSpecifications: { contains: search, mode: 'insensitive' } },
                { brand: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
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
        else if (sort === 'newest')
            order.createdAt = 'desc';
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
    async productBrands() {
        const rows = await this.prisma.shopProduct.findMany({
            where: { isActive: true, brand: { not: '' } },
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
        });
        return rows.map((r) => r.brand);
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
        let related = [];
        if (product.categoryId) {
            related = await this.prisma.shopProduct.findMany({
                where: {
                    categoryId: product.categoryId,
                    isActive: true,
                    id: { not: product.id },
                },
                orderBy: { salesCount: 'desc' },
                take: 5,
                include: { category: true },
            });
        }
        if (related.length === 0) {
            related = await this.prisma.shopProduct.findMany({
                where: { isActive: true, id: { not: product.id } },
                orderBy: { salesCount: 'desc' },
                take: 5,
                include: { category: true },
            });
        }
        return { ...product, related };
    }
    async createProduct(dto) {
        return this.prisma.shopProduct.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description ?? '',
                shortDescription: dto.shortDescription ?? '',
                technicalSpecifications: dto.technicalSpecifications ?? '',
                categoryId: dto.categoryId,
                brand: dto.brand ?? '',
                sku: dto.sku ?? '',
                price: dto.price,
                oldPrice: dto.oldPrice,
                discountPercent: dto.discountPercent ?? 0,
                stock: dto.stock ?? 0,
                imageUrl: dto.imageUrl ?? '',
                isActive: dto.isActive ?? true,
                isFeatured: dto.isFeatured ?? false,
            },
            include: { category: true },
        });
    }
    async updateProduct(id, dto) {
        const product = await this.prisma.shopProduct.findUnique({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('محصول یافت نشد');
        return this.prisma.shopProduct.update({
            where: { id },
            data: dto,
            include: { category: true },
        });
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
                items: { create: items.map((i) => ({ productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal })) },
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
    (0, common_1.Post)('categories'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Patch)('categories/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateCategoryDto]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "updateCategory", null);
__decorate([
    (0, common_1.Get)('categories/:slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "categoryBySlug", null);
__decorate([
    (0, common_1.Get)('cart/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "cartConfig", null);
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
    __param(11, (0, common_1.Query)('brands')),
    __param(12, (0, common_1.Query)('hasDiscount')),
    __param(13, (0, common_1.Query)('outOfStock')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Number, Number, String, Number, Number, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "products", null);
__decorate([
    (0, common_1.Get)('products/brands'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "productBrands", null);
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
    (0, common_1.Post)('products'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateProductDto]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Put)('products/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateProductDto]),
    __metadata("design:returntype", Promise)
], ShopController.prototype, "updateProduct", null);
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
