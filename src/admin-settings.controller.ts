import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
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

// ── General Settings DTOs ──

class UpdateGeneralSettingsDto {
  @IsOptional() @IsString() siteName?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() emailHost?: string;
  @IsOptional() @IsString() emailPort?: string;
  @IsOptional() @IsString() emailUser?: string;
  @IsOptional() @IsString() emailFrom?: string;
  @IsOptional() @IsString() smsProvider?: string;
  @IsOptional() @IsString() smsApiKey?: string;
  @IsOptional() @IsString() smsSenderNumber?: string;
}

// ── Country Config DTOs ──

class CreateCountryConfigDto {
  @IsString() @MinLength(2) code!: string;
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsString() currencySymbol?: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() phonePrefix?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() displayOrder?: string;
}

class UpdateCountryConfigDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() currencyCode?: string;
  @IsOptional() @IsString() currencySymbol?: string;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsString() phonePrefix?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() displayOrder?: string;
}

// ── Payment Gateway DTOs ──

class CreatePaymentGatewayDto {
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) code!: string;
  @IsString() provider!: string;
  @IsOptional() @IsString() merchantId?: string;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsString() callbackUrl?: string;
  @IsOptional() @IsBoolean() sandboxMode?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdatePaymentGatewayDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() provider?: string;
  @IsOptional() @IsString() merchantId?: string;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsString() callbackUrl?: string;
  @IsOptional() @IsBoolean() sandboxMode?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// ── Security Settings DTOs ──

class UpdateSecuritySettingsDto {
  @IsOptional() @IsString() maxLoginAttempts?: string;
  @IsOptional() @IsString() sessionTimeoutMinutes?: string;
  @IsOptional() @IsString() passwordMinLength?: string;
  @IsOptional() @IsString() passwordRequireUppercase?: string;
  @IsOptional() @IsString() passwordRequireNumbers?: string;
  @IsOptional() @IsString() passwordRequireSymbols?: string;
  @IsOptional() @IsString() twoFactorRequired?: string;
  @IsOptional() @IsString() ipWhitelist?: string;
}

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly prisma: PrismaService) {}

  // ── General Settings ──

  @Get('general')
  async getGeneralSettings(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    const setting = await this.prisma.siteSetting.findUnique({
      where: { settingKey: 'general_settings' },
    });
    return setting?.settingValue ?? {};
  }

  @Patch('general')
  async updateGeneralSettings(@Headers('authorization') auth: string, @Body() dto: UpdateGeneralSettingsDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.siteSetting.findUnique({
      where: { settingKey: 'general_settings' },
    });

    const current = existing?.settingValue && typeof existing.settingValue === 'object' && !Array.isArray(existing.settingValue)
      ? existing.settingValue as Record<string, unknown>
      : {};

    const updated = { ...current, ...dto };

    await this.prisma.siteSetting.upsert({
      where: { settingKey: 'general_settings' },
      create: { settingKey: 'general_settings', settingValue: updated as Prisma.InputJsonValue },
      update: { settingValue: updated as Prisma.InputJsonValue },
    });

    return updated;
  }

  // ── Country Configs ──

  @Get('countries')
  async listCountries(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.countryConfig.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('countries')
  async createCountry(@Headers('authorization') auth: string, @Body() dto: CreateCountryConfigDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.countryConfig.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('این کشور قبلاً ثبت شده است');

    return this.prisma.countryConfig.create({
      data: {
        code: dto.code,
        name: dto.name,
        currencyCode: dto.currencyCode ?? 'IRR',
        currencySymbol: dto.currencySymbol ?? '﷼',
        language: dto.language ?? 'fa',
        phonePrefix: dto.phonePrefix ?? '+98',
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ? Number.parseInt(dto.displayOrder, 10) : 0,
      },
    });
  }

  @Patch('countries/:id')
  async updateCountry(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdateCountryConfigDto,
  ) {
    verifyAdmin(auth);
    const country = await this.prisma.countryConfig.findUnique({ where: { id } });
    if (!country) throw new NotFoundException('کشور یافت نشد');

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.currencyCode !== undefined) data.currencyCode = dto.currencyCode;
    if (dto.currencySymbol !== undefined) data.currencySymbol = dto.currencySymbol;
    if (dto.language !== undefined) data.language = dto.language;
    if (dto.phonePrefix !== undefined) data.phonePrefix = dto.phonePrefix;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.displayOrder !== undefined) data.displayOrder = Number.parseInt(dto.displayOrder, 10) || 0;

    return this.prisma.countryConfig.update({ where: { id }, data });
  }

  @Delete('countries/:id')
  async deleteCountry(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const country = await this.prisma.countryConfig.findUnique({ where: { id } });
    if (!country) throw new NotFoundException('کشور یافت نشد');

    await this.prisma.countryConfig.delete({ where: { id } });
    return { ok: true };
  }

  // ── Payment Gateways ──

  @Get('payment-gateways')
  async listPaymentGateways(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    return this.prisma.paymentGatewayConfig.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  @Post('payment-gateways')
  async createPaymentGateway(@Headers('authorization') auth: string, @Body() dto: CreatePaymentGatewayDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.paymentGatewayConfig.findUnique({ where: { code: dto.code } });
    if (existing) throw new BadRequestException('این کد درگاه قبلاً ثبت شده است');

    return this.prisma.paymentGatewayConfig.create({
      data: {
        name: dto.name,
        code: dto.code,
        provider: dto.provider,
        merchantId: dto.merchantId,
        apiKey: dto.apiKey,
        callbackUrl: dto.callbackUrl,
        sandboxMode: dto.sandboxMode ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  @Patch('payment-gateways/:id')
  async updatePaymentGateway(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentGatewayDto,
  ) {
    verifyAdmin(auth);
    const gateway = await this.prisma.paymentGatewayConfig.findUnique({ where: { id } });
    if (!gateway) throw new NotFoundException('درگاه پرداخت یافت نشد');

    return this.prisma.paymentGatewayConfig.update({ where: { id }, data: dto });
  }

  @Delete('payment-gateways/:id')
  async deletePaymentGateway(@Headers('authorization') auth: string, @Param('id') id: string) {
    verifyAdmin(auth);
    const gateway = await this.prisma.paymentGatewayConfig.findUnique({ where: { id } });
    if (!gateway) throw new NotFoundException('درگاه پرداخت یافت نشد');

    await this.prisma.paymentGatewayConfig.delete({ where: { id } });
    return { ok: true };
  }

  // ── Security Settings ──

  @Get('security')
  async getSecuritySettings(@Headers('authorization') auth: string) {
    verifyAdmin(auth);
    const setting = await this.prisma.securitySetting.findUnique({
      where: { settingKey: 'security_settings' },
    });
    return setting?.settingValue ?? {
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 60,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSymbols: false,
      twoFactorRequired: false,
      ipWhitelist: '',
    };
  }

  @Patch('security')
  async updateSecuritySettings(@Headers('authorization') auth: string, @Body() dto: UpdateSecuritySettingsDto) {
    verifyAdmin(auth);

    const existing = await this.prisma.securitySetting.findUnique({
      where: { settingKey: 'security_settings' },
    });

    const current = existing?.settingValue && typeof existing.settingValue === 'object' && !Array.isArray(existing.settingValue)
      ? existing.settingValue as Record<string, unknown>
      : {
          maxLoginAttempts: 5,
          sessionTimeoutMinutes: 60,
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSymbols: false,
          twoFactorRequired: false,
          ipWhitelist: '',
        };

    const data: Record<string, unknown> = { ...current };
    if (dto.maxLoginAttempts !== undefined) data.maxLoginAttempts = Number.parseInt(dto.maxLoginAttempts, 10) || 5;
    if (dto.sessionTimeoutMinutes !== undefined) data.sessionTimeoutMinutes = Number.parseInt(dto.sessionTimeoutMinutes, 10) || 60;
    if (dto.passwordMinLength !== undefined) data.passwordMinLength = Number.parseInt(dto.passwordMinLength, 10) || 8;
    if (dto.passwordRequireUppercase !== undefined) data.passwordRequireUppercase = dto.passwordRequireUppercase === 'true';
    if (dto.passwordRequireNumbers !== undefined) data.passwordRequireNumbers = dto.passwordRequireNumbers === 'true';
    if (dto.passwordRequireSymbols !== undefined) data.passwordRequireSymbols = dto.passwordRequireSymbols === 'true';
    if (dto.twoFactorRequired !== undefined) data.twoFactorRequired = dto.twoFactorRequired === 'true';
    if (dto.ipWhitelist !== undefined) data.ipWhitelist = dto.ipWhitelist;

    await this.prisma.securitySetting.upsert({
      where: { settingKey: 'security_settings' },
      create: { settingKey: 'security_settings', settingValue: data as Prisma.InputJsonValue },
      update: { settingValue: data as Prisma.InputJsonValue },
    });

    return data;
  }
}
