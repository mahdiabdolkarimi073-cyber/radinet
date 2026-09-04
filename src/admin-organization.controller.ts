import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsDateString, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
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

class CreateOrganizationDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) slug!: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() nationalId?: string;
  @IsOptional() @IsString() economicCode?: string;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdateOrganizationDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() slug?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() nationalId?: string;
  @IsOptional() @IsString() economicCode?: string;
  @IsOptional() @IsString() registrationNumber?: string;
  @IsOptional() @IsString() contactPerson?: string;
  @IsOptional() @IsString() contactPhone?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class OrganizationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
}

class CreateContractDto {
  @IsString() organizationId!: string;
  @IsOptional() @IsString() centerId?: string;
  @IsString() @MinLength(2) contractNumber!: string;
  @IsString() title!: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
  @IsDateString() startDate!: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() terms?: string;
  @IsOptional() @IsInt() @Min(0) discountPercent?: number;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsString() signedBy?: string;
  @IsOptional() @IsDateString() signedAt?: string;
  @IsOptional() @IsString() notes?: string;
}

class UpdateContractDto {
  @IsOptional() @IsString() centerId?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() terms?: string;
  @IsOptional() @IsInt() @Min(0) discountPercent?: number;
  @IsOptional() @IsNumber() creditLimit?: number;
  @IsOptional() @IsString() signedBy?: string;
  @IsOptional() @IsDateString() signedAt?: string;
  @IsOptional() @IsString() notes?: string;
}

@Controller('admin/organizations')
export class AdminOrganizationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listOrganizations(@Headers('authorization') auth: string, @Query() query: OrganizationQueryDto) {
    verifyAdmin(auth);

    const page = Math.max(Number.parseInt(query.page ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit ?? '10', 10) || 10, 1), 50);

    const where: Prisma.OrganizationWhereInput = {};
    if (query.status === 'active') where.isActive = true;
    else if (query.status === 'inactive') where.isActive = false;
    if (query.type && query.type !== 'all') where.type = query.type;
    if (query.search?.trim()) {
      const value = query.search.trim();
      where.OR = [
        { name: { contains: value, mode: 'insensitive' } },
        { slug: { contains: value, mode: 'insensitive' } },
        { nationalId: { contains: value, mode: 'insensitive' } },
        { economicCode: { contains: value, mode: 'insensitive' } },
        { contactPerson: { contains: value, mode: 'insensitive' } },
      ];
    }

    const [total, orgs] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { contracts: true } },
        },
      }),
    ]);

    return {
      items: orgs,
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
    };
  }

  @Get(':id')
  async getOrganization(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        contracts: {
          include: {
            center: { select: { id: true, name: true, slug: true } },
          },
        },
        _count: { select: { contracts: true } },
      },
    });

    if (!org) throw new NotFoundException('سازمان یافت نشد');
    return org;
  }

  @Post()
  async createOrganization(@Headers('authorization') auth: string, @Body() dto: CreateOrganizationDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new BadRequestException('این شناسه (slug) قبلاً ثبت شده است');

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        type: dto.type ?? 'company',
        description: dto.description ?? '',
        address: dto.address ?? '',
        phone: dto.phone ?? '',
        email: dto.email ?? '',
        city: dto.city ?? '',
        province: dto.province ?? '',
        nationalId: dto.nationalId,
        economicCode: dto.economicCode,
        registrationNumber: dto.registrationNumber,
        contactPerson: dto.contactPerson,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch(':id')
  async updateOrganization(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    verifyAdmin(auth);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('سازمان یافت نشد');

    if (dto.slug && dto.slug !== org.slug) {
      const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
      if (existing) throw new BadRequestException('این شناسه (slug) قبلاً ثبت شده است');
    }

    return this.prisma.organization.update({
      where: { id },
      data: dto,
    });
  }

  @Delete(':id')
  async deleteOrganization(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('سازمان یافت نشد');

    await this.prisma.organization.delete({ where: { id } });
    return { ok: true };
  }

  // ── Contracts ──

  @Get(':id/contracts')
  async listContracts(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('سازمان یافت نشد');

    return this.prisma.organizationContract.findMany({
      where: { organizationId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        center: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  @Post(':id/contracts')
  async createContract(@Headers('authorization') auth: string, @Param('id') id: string, @Body() dto: CreateContractDto) {
    verifyAdmin(auth);

    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) throw new NotFoundException('سازمان یافت نشد');

    const existingContract = await this.prisma.organizationContract.findUnique({
      where: { contractNumber: dto.contractNumber },
    });
    if (existingContract) throw new BadRequestException('شماره قرارداد تکراری است');

    return this.prisma.organizationContract.create({
      data: {
        organizationId: id,
        centerId: dto.centerId,
        contractNumber: dto.contractNumber,
        title: dto.title,
        type: dto.type ?? 'service',
        status: dto.status ?? 'active',
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        terms: dto.terms ?? '',
        discountPercent: dto.discountPercent ?? 0,
        creditLimit: dto.creditLimit,
        signedBy: dto.signedBy,
        signedAt: dto.signedAt ? new Date(dto.signedAt) : null,
        notes: dto.notes,
      },
      include: {
        organization: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } },
      },
    });
  }

  @Patch(':id/contracts/:contractId')
  async updateContract(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Param('contractId') contractId: string,
    @Body() dto: UpdateContractDto,
  ) {
    verifyAdmin(auth);

    const contract = await this.prisma.organizationContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('قرارداد یافت نشد');
    if (contract.organizationId !== id) throw new BadRequestException('قرارداد متعلق به این سازمان نیست');

    const data: Record<string, unknown> = {};
    if (dto.centerId !== undefined) data.centerId = dto.centerId;
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.terms !== undefined) data.terms = dto.terms;
    if (dto.discountPercent !== undefined) data.discountPercent = dto.discountPercent;
    if (dto.creditLimit !== undefined) data.creditLimit = dto.creditLimit;
    if (dto.signedBy !== undefined) data.signedBy = dto.signedBy;
    if (dto.signedAt !== undefined) data.signedAt = dto.signedAt ? new Date(dto.signedAt) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;

    return this.prisma.organizationContract.update({
      where: { id: contractId },
      data,
      include: {
        organization: { select: { id: true, name: true } },
        center: { select: { id: true, name: true } },
      },
    });
  }

  @Delete(':id/contracts/:contractId')
  async deleteContract(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Param('contractId') contractId: string,
  ) {
    verifyAdmin(auth);

    const contract = await this.prisma.organizationContract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('قرارداد یافت نشد');
    if (contract.organizationId !== id) throw new BadRequestException('قرارداد متعلق به این سازمان نیست');

    await this.prisma.organizationContract.delete({ where: { id: contractId } });
    return { ok: true };
  }
}
