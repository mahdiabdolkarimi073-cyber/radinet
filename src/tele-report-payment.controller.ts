import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

type PaymentGateway = {
  id: string;
  name: string;
  description: string;
  logoText: string;
  countries: string[];
};

const gateways: PaymentGateway[] = [
  { id: 'zarinpal', name: 'زرین‌پال', description: 'پرداخت ریالی ایران', logoText: 'Z', countries: ['IR'] },
  { id: 'qi-card', name: 'Qi Card', description: 'پرداخت محلی عراق', logoText: 'Q', countries: ['IQ'] },
  { id: 'm-paisa', name: 'M-Paisa', description: 'پرداخت محلی افغانستان', logoText: 'M', countries: ['AF'] },
  { id: 'stripe', name: 'Stripe', description: 'پرداخت بین‌المللی', logoText: 'S', countries: ['TR', 'AE', 'DE', 'GB', 'US'] },
];

const countryPricing: Record<string, { name: string; currency: string; amount: number; currencyLabel: string }> = {
  IR: { name: 'ایران', currency: 'IRR', amount: 39000000, currencyLabel: 'تومان' },
  AF: { name: 'افغانستان', currency: 'AFN', amount: 3900, currencyLabel: 'افغانی' },
  IQ: { name: 'عراق', currency: 'IQD', amount: 52000, currencyLabel: 'دینار' },
  TR: { name: 'ترکیه', currency: 'TRY', amount: 1250, currencyLabel: 'لیر' },
  AE: { name: 'امارات', currency: 'AED', amount: 330, currencyLabel: 'درهم' },
  DE: { name: 'آلمان', currency: 'EUR', amount: 85, currencyLabel: 'یورو' },
  GB: { name: 'انگلستان', currency: 'GBP', amount: 75, currencyLabel: 'پوند' },
  US: { name: 'آمریکا', currency: 'USD', amount: 95, currencyLabel: 'دلار' },
};

class PaymentConfigQueryDto {
  @IsOptional() @IsString() @Length(2, 2) country?: string;
}

class StartPaymentDto {
  @IsString() @Length(2, 80) requestNumber!: string;
  @IsString() @Length(2, 2) country!: string;
  @IsString() @IsIn(['zarinpal', 'qi-card', 'm-paisa', 'stripe']) paymentMethod!: string;
}

function getConfig(countryCode = 'IR') {
  const country = countryPricing[countryCode.toUpperCase()] ?? countryPricing.IR;
  const availableGateways = gateways.filter((gateway) => gateway.countries.includes(countryCode.toUpperCase()) || gateway.id === 'stripe');
  return {
    country: country.name,
    countryCode: countryCode.toUpperCase() in countryPricing ? countryCode.toUpperCase() : 'IR',
    currency: country.currency,
    currencyLabel: country.currencyLabel,
    amount: country.amount,
    formattedAmount: country.amount.toLocaleString('fa-IR'),
    gateways: availableGateways,
  };
}

@Controller('tele-report/payments')
export class TeleReportPaymentController {
  @Get('config')
  getPaymentConfig(@Query() query: PaymentConfigQueryDto) {
    return getConfig(query.country);
  }

  @Post('start')
  startPayment(@Body() body: StartPaymentDto) {
    const config = getConfig(body.country);
    const gateway = config.gateways.find((item) => item.id === body.paymentMethod);
    if (!gateway) throw new BadRequestException('درگاه انتخاب‌شده برای این کشور در دسترس نیست');

    return {
      requestNumber: body.requestNumber,
      paymentStatus: 'pending',
      paymentMethod: gateway.id,
      amount: config.amount,
      currency: config.currency,
      checkoutUrl: null,
      message: 'درگاه پرداخت هنوز به سامانه متصل نشده است. این درخواست برای اتصال آینده آماده شد.',
    };
  }
}
