import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import * as jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

const JWT_SECRET = process.env.JWT_SECRET ?? 'radinet-dev-secret-change-me';

function verifyAdmin(auth?: string) {
  if (!auth?.startsWith('Bearer ')) throw new UnauthorizedException('توکن ارسال نشده است');
  try {
    const payload = jwt.verify(auth.slice('Bearer '.length), JWT_SECRET) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new UnauthorizedException('دسترسی مجاز نیست');
    return payload;
  } catch {
    throw new UnauthorizedException('توکن نامعتبر است');
  }
}

class OrderQueryDto {
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class UpdateOrderStatusDto {
  @IsIn(['pending', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'cancelled'])
  status!: string;
  @IsOptional() @IsString() trackingCode?: string;
  @IsOptional() @IsString() paymentStatus?: string;
  @IsOptional() @IsString() note?: string;
}

@Controller('admin/orders')
export class AdminOrderController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listOrders(@Headers('authorization') auth: string, @Query() query: OrderQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '20', 10) || 20, 1), 100);

    const where: Prisma.ShopOrderWhereInput = {};
    if (query.status && query.status !== 'all') where.status = query.status;
    if (query.paymentStatus && query.paymentStatus !== 'all') where.paymentStatus = query.paymentStatus;
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { orderNumber: { contains: value, mode: 'insensitive' } },
        { customerName: { contains: value, mode: 'insensitive' } },
        { customerPhone: { contains: value, mode: 'insensitive' } },
        { customerEmail: { contains: value, mode: 'insensitive' } },
        { trackingCode: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.shopOrder.count({ where }),
      this.prisma.shopOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, slug: true, imageUrl: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      items: orders,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':orderNumber')
  async getOrder(@Headers('authorization') auth: string, @Param('orderNumber') orderNumber: string) {
    verifyAdmin(auth);

    const order = await this.prisma.shopOrder.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, imageUrl: true, sku: true },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('سفارش یافت نشد');
    return order;
  }

  @Patch(':orderNumber/status')
  async updateOrderStatus(
    @Headers('authorization') auth: string,
    @Param('orderNumber') orderNumber: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    verifyAdmin(auth);

    const order = await this.prisma.shopOrder.findUnique({ where: { orderNumber } });
    if (!order) throw new NotFoundException('سفارش یافت نشد');

    const data: Prisma.ShopOrderUpdateInput = { status: dto.status };
    if (dto.trackingCode !== undefined) data.trackingCode = dto.trackingCode;
    if (dto.paymentStatus !== undefined) data.paymentStatus = dto.paymentStatus;

    const updated = await this.prisma.shopOrder.update({
      where: { orderNumber },
      data,
      include: { items: true },
    });

    return {
      order: updated,
      notification: dto.status === 'shipped' && dto.trackingCode
        ? `کد رهگیری ${dto.trackingCode} برای مشتری ارسال شد`
        : null,
    };
  }

  @Get('stats/summary')
  async getOrderStats(@Headers('authorization') auth: string) {
    verifyAdmin(auth);

    const [
      total,
      pending,
      processing,
      readyToShip,
      shipped,
      delivered,
      cancelled,
      paidRevenue,
    ] = await Promise.all([
      this.prisma.shopOrder.count(),
      this.prisma.shopOrder.count({ where: { status: 'pending' } }),
      this.prisma.shopOrder.count({ where: { status: 'processing' } }),
      this.prisma.shopOrder.count({ where: { status: 'ready_to_ship' } }),
      this.prisma.shopOrder.count({ where: { status: 'shipped' } }),
      this.prisma.shopOrder.count({ where: { status: 'delivered' } }),
      this.prisma.shopOrder.count({ where: { status: 'cancelled' } }),
      this.prisma.shopOrder.aggregate({
        where: { paymentStatus: 'paid' },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      byStatus: { pending, processing, readyToShip, shipped, delivered, cancelled },
      paidRevenue: Number(paidRevenue._sum.total ?? 0),
    };
  }
}
