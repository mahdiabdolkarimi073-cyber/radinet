"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({ origin: true });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads/' });
    await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
