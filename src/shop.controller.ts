import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
  @IsString() productId: string;
  @IsNumber() @Min(1) quantity: number;
}

class CreateOrderDto {
  @IsString() customerName: string;
  @IsString() customerPhone: string;
  @IsOptional() @IsString() customerEmail?: string;
  @IsOptional() @IsString() shippingAddress?: string;
  @IsOptional() @IsString() notes?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
  @IsOptional() @IsString() discountCode?: string;
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

  @Get('categories/:slug')
  async categoryBySlug(@Param('slug') slug: string) {
    const category = await this.prisma.shopCategory.findUnique({
      where: { slug },
      include: { children: true, parent: true },
    });
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد');
    return category;
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
    @Query('hasDiscount') hasDiscount?: string,
  ) {
    const where: any = {};
    if (includeInactive !== 'true') where.isActive = true;
    if (featured === 'true') where.isFeatured = true;
    if (inStock === 'true') where.stock = { gt: 0 };
    if (hasDiscount === 'true') where.discountPercent = { gt: 0 };
    if (brand) where.brand = brand;
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
        { brand: { contains: search, mode: 'insensitive' } },
      ];
    }
    const order: any = {};
    if (sort === 'price-asc') order.price = 'asc';
    else if (sort === 'price-desc') order.price = 'desc';
    else if (sort === 'sales') order.salesCount = 'desc';
    else if (sort === 'rating') order.rating = 'desc';
    else order.createdAt = 'desc';

    const take = Math.min(pageSize ?? 20, 100);
    const skip = ((page ?? 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.shopProduct.findMany({ where, orderBy: order, take, skip, include: { category: true } }),
      this.prisma.shopProduct.count({ where }),
    ]);
    return { items, total, page: page ?? 1, pageSize: take };
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
    return product;
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
    const items = dto.items.map((item) => {
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
      include: { items: true },
    });
    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  @Get('orders/phone/:phone')
  async ordersByPhone(@Param('phone') phone: string) {
    return this.prisma.shopOrder.findMany({
      where: { customerPhone: phone },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
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
}
