import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateShippingMethodDto {
  @IsString() code!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsString() estimatedDays?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() displayOrder?: number;
}

class CreateCategoryDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsString() aboutTitle?: string;
  @IsOptional() @IsString() aboutDescription?: string;
  @IsOptional() @IsString() aboutImageUrl?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() colorTheme?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsNumber() displayOrder?: number;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() heroImageUrl?: string;
  @IsOptional() @IsString() aboutTitle?: string;
  @IsOptional() @IsString() aboutDescription?: string;
  @IsOptional() @IsString() aboutImageUrl?: string;
  @IsOptional() @IsString() iconKey?: string;
  @IsOptional() @IsString() colorTheme?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsNumber() displayOrder?: number;
}

class CreateProductDto {
  @IsString() name!: string;
  @IsString() slug!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() technicalSpecifications?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() sku?: string;
  @IsNumber() price!: number;
  @IsOptional() @IsNumber() oldPrice?: number;
  @IsOptional() @IsNumber() discountPercent?: number;
  @IsOptional() @IsNumber() stock?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

class UpdateProductDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() shortDescription?: string;
  @IsOptional() @IsString() technicalSpecifications?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsNumber() price?: number;
  @IsOptional() @IsNumber() oldPrice?: number;
  @IsOptional() @IsNumber() discountPercent?: number;
  @IsOptional() @IsNumber() stock?: number;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

class CreateOrderItemDto {
  @IsString() productId!: string;
  @IsNumber() @Min(1) quantity!: number;
}

class CreateOrderDto {
  @IsString() customerName!: string;
  @IsString() customerPhone!: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsString() shippingAddress?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
  @IsOptional() @IsString() discountCode?: string;
  // Checkout fields
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() shippingMethod?: string;
  @IsOptional() @IsBoolean() needInvoice?: boolean;
  @IsOptional() @IsString() companyNationalId?: string;
  @IsOptional() @IsString() companyEconomicCode?: string;
  @IsOptional() @IsString() companyRegistrationNumber?: string;
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() paymentMethod?: string;
}

@Controller('shop')
export class ShopController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categories ──
  @Get('categories')
  async categories(@Query('includeInactive') includeInactive?: string) {
    return this.prisma.shopCategory.findMany({
      where: includeInactive === 'true' ? undefined : { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
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

  @Patch('categories/:slug')
  async updateCategory(@Param('slug') slug: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.prisma.shopCategory.findUnique({ where: { slug } });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return this.prisma.shopCategory.update({
      where: { id: category.id },
      data: dto,
      include: { children: true, parent: true },
    });
  }

  @Get('categories/:slug')
  async categoryBySlug(@Param('slug') slug: string) {
    const category = await this.prisma.shopCategory.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return category;
  }

  // ── Cart configuration ──
  @Get('cart/config')
  async cartConfig() {
    const setting = await this.prisma.siteSetting.findUnique({ where: { settingKey: 'shop_checkout' } });
    const value = setting?.settingValue;
    const config = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    return {
      taxRate: typeof config.taxRate === 'number' ? config.taxRate : 0,
      shippingCost: typeof config.shippingCost === 'number' ? config.shippingCost : 0,
      freeShippingThreshold: typeof config.freeShippingThreshold === 'number' ? config.freeShippingThreshold : 0,
    };
  }

  // ── Products ──
  @Get('products')
  async products(
    @Query('categorySlug') categorySlug?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
    @Query('sort') sort?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('pageSize', new ParseIntPipe({ optional: true })) pageSize?: number,
    @Query('includeInactive') includeInactive?: string,
    @Query('minPrice', new ParseIntPipe({ optional: true })) minPrice?: number,
    @Query('maxPrice', new ParseIntPipe({ optional: true })) maxPrice?: number,
    @Query('inStock') inStock?: string,
    @Query('brand') brand?: string,
    @Query('brands') brands?: string,
    @Query('hasDiscount') hasDiscount?: string,
    @Query('outOfStock') outOfStock?: string,
  ) {
    const where: any = {};
    if (includeInactive !== 'true') where.isActive = true;
    if (featured === 'true') where.isFeatured = true;
    if (inStock === 'true') where.stock = { gt: 0 };
    if (outOfStock === 'true') where.stock = { equals: 0 };
    if (hasDiscount === 'true') where.discountPercent = { gt: 0 };
    if (brand) where.brand = brand;
    if (brands) {
      const brandList = brands.split(',').map((b) => b.trim()).filter(Boolean);
      if (brandList.length === 1) where.brand = brandList[0];
      else if (brandList.length > 1) where.brand = { in: brandList };
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }
    if (categorySlug) {
      const cat = await this.prisma.shopCategory.findUnique({ where: { slug: categorySlug } });
      if (cat) where.categoryId = cat.id;
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
    const order: any = {};
    if (sort === 'price-asc') order.price = 'asc';
    else if (sort === 'price-desc') order.price = 'desc';
    else if (sort === 'sales') order.salesCount = 'desc';
    else if (sort === 'rating') order.rating = 'desc';
    else if (sort === 'newest') order.createdAt = 'desc';
    else order.createdAt = 'desc';

    const take = Math.min(pageSize ?? 20, 100);
    const skip = ((page ?? 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.shopProduct.findMany({ where, orderBy: order, take, skip, include: { category: true } }),
      this.prisma.shopProduct.count({ where }),
    ]);
    return { items, total, page: page ?? 1, pageSize: take };
  }

  @Get('products/brands')
  async productBrands() {
    const rows = await this.prisma.shopProduct.findMany({
      where: { isActive: true, brand: { not: '' } },
      select: { brand: true },
      distinct: ['brand'],
      orderBy: { brand: 'asc' },
    });
    return rows.map((r) => r.brand);
  }

  @Get('products/featured')
  async featuredProducts() {
    return this.prisma.shopProduct.findMany({
      where: { isFeatured: true, isActive: true, stock: { gt: 0 } },
      orderBy: { salesCount: 'desc' },
      take: 8,
      include: { category: true },
    });
  }

  @Get('products/:slug')
  async productBySlug(@Param('slug') slug: string) {
    const product = await this.prisma.shopProduct.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('محصول یافت نشد');

    let related: any[] = [];
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

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
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

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    const product = await this.prisma.shopProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('محصول یافت نشد');
    return this.prisma.shopProduct.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  // ── Shipping methods ──
  @Get('shipping-methods')
  async shippingMethods() {
    return this.prisma.shopShippingMethod.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('shipping-methods')
  async createShippingMethod(@Body() dto: CreateShippingMethodDto) {
    return this.prisma.shopShippingMethod.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description ?? '',
        price: dto.price,
        estimatedDays: dto.estimatedDays,
        iconKey: dto.iconKey ?? 'truck',
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
  }

  // ── Orders ──
  @Post('orders')
  async createOrder(@Body() dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }
    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.shopProduct.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('یک یا چند محصول یافت نشد');
    }
    for (const item of dto.items) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) throw new BadRequestException('محصول نامعتبر');
      if (p.stock < item.quantity) {
        throw new BadRequestException(`موجودی ناکافی برای: ${p.name}`);
      }
    }
    let discountTotal = 0;
    let appliedDiscount: any = null;
    if (dto.discountCode) {
      const discount = await this.prisma.shopDiscount.findUnique({ where: { code: dto.discountCode } });
      if (!discount || !discount.isActive) throw new BadRequestException('کد تخفیف نامعتبر است');
      const now = new Date();
      if (discount.startsAt && now < discount.startsAt) throw new BadRequestException('کد تخفیف هنوز فعال نشده');
      if (discount.endsAt && now > discount.endsAt) throw new BadRequestException('کد تخفیف منقضی شده');
      if (discount.usageLimit && discount.usedCount >= discount.usageLimit) throw new BadRequestException('سقف استفاده از کد تخفیف پر شده');
      appliedDiscount = discount;
    }
    const items: any[] = dto.items.map((item) => {
      const p = products.find((x) => x.id === item.productId)!;
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
    let shippingCost = 0;
    let shippingMethodName: string | null = null;
    if (dto.shippingMethod) {
      const sm = await this.prisma.shopShippingMethod.findUnique({ where: { code: dto.shippingMethod } });
      if (sm && sm.isActive) {
        shippingCost = Number(sm.price);
        shippingMethodName = sm.name;
      }
    }
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
        firstName: dto.firstName,
        lastName: dto.lastName,
        province: dto.province,
        city: dto.city,
        postalCode: dto.postalCode,
        shippingMethod: dto.shippingMethod,
        shippingMethodName,
        needInvoice: dto.needInvoice ?? false,
        companyNationalId: dto.companyNationalId,
        companyEconomicCode: dto.companyEconomicCode,
        companyRegistrationNumber: dto.companyRegistrationNumber,
        companyName: dto.companyName,
        paymentMethod: dto.paymentMethod,
        items: { create: items.map((i) => ({ productId: i.productId, productName: i.productName, unitPrice: i.unitPrice, quantity: i.quantity, lineTotal: i.lineTotal })) },
      },
      include: { items: true },
    });
    await Promise.all(
      dto.items.map((item) =>
        this.prisma.shopProduct.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        }),
      ),
    );
    if (appliedDiscount) {
      await this.prisma.shopDiscount.update({
        where: { id: appliedDiscount.id },
        data: { usedCount: { increment: 1 } },
      });
    }
    return order;
  }

  @Get('orders/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.prisma.shopOrder.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { select: { imageUrl: true, slug: true } } } } },
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  @Get('orders/phone/:phone')
  async ordersByPhone(@Param('phone') phone: string) {
    return this.prisma.shopOrder.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { imageUrl: true, slug: true } } } } },
    });
  }

  // ── Discounts ──
  @Get('discounts/:code')
  async validateDiscount(@Param('code') code: string) {
    const discount = await this.prisma.shopDiscount.findUnique({ where: { code } });
    if (!discount || !discount.isActive) throw new NotFoundException('کد تخفیف نامعتبر است');
    const now = new Date();
    if (discount.startsAt && now < discount.startsAt) throw new BadRequestException('کد تخفیف هنوز فعال نشده');
    if (discount.endsAt && now > discount.endsAt) throw new BadRequestException('کد تخفیف منقضی شده');
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) throw new BadRequestException('سقف استفاده پر شده');
    return discount;
  }

  // ── Order status (admin) ──
  @Patch('orders/:orderNumber/status')
  async updateOrderStatus(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { status?: string; trackingCode?: string; paymentStatus?: string },
  ) {
    const order = await this.prisma.shopOrder.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return this.prisma.shopOrder.update({
      where: { orderNumber },
      data: {
        status: body.status,
        trackingCode: body.trackingCode,
        paymentStatus: body.paymentStatus,
      },
      include: { items: true },
    });
  }

  @Get('orders')
  async allOrders() {
    return this.prisma.shopOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 100,
    });
  }
}
