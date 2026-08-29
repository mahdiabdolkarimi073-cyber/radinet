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
exports.TeleReportPaymentController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const gateways = [
    { id: 'zarinpal', name: 'زرین‌پال', description: 'پرداخت ریالی ایران', logoText: 'Z', countries: ['IR'] },
    { id: 'qi-card', name: 'Qi Card', description: 'پرداخت محلی عراق', logoText: 'Q', countries: ['IQ'] },
    { id: 'm-paisa', name: 'M-Paisa', description: 'پرداخت محلی افغانستان', logoText: 'M', countries: ['AF'] },
    { id: 'stripe', name: 'Stripe', description: 'پرداخت بین‌المللی', logoText: 'S', countries: ['TR', 'AE', 'DE', 'GB', 'US'] },
];
const countryPricing = {
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
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], PaymentConfigQueryDto.prototype, "country", void 0);
class StartPaymentDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 80),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "requestNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 2),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "country", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['zarinpal', 'qi-card', 'm-paisa', 'stripe']),
    __metadata("design:type", String)
], StartPaymentDto.prototype, "paymentMethod", void 0);
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
let TeleReportPaymentController = class TeleReportPaymentController {
    getPaymentConfig(query) {
        return getConfig(query.country);
    }
    startPayment(body) {
        const config = getConfig(body.country);
        const gateway = config.gateways.find((item) => item.id === body.paymentMethod);
        if (!gateway)
            throw new common_1.BadRequestException('درگاه انتخاب‌شده برای این کشور در دسترس نیست');
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
};
exports.TeleReportPaymentController = TeleReportPaymentController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PaymentConfigQueryDto]),
    __metadata("design:returntype", void 0)
], TeleReportPaymentController.prototype, "getPaymentConfig", null);
__decorate([
    (0, common_1.Post)('start'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [StartPaymentDto]),
    __metadata("design:returntype", void 0)
], TeleReportPaymentController.prototype, "startPayment", null);
exports.TeleReportPaymentController = TeleReportPaymentController = __decorate([
    (0, common_1.Controller)('tele-report/payments')
], TeleReportPaymentController);
