import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvironment(): void {
  const envCandidates = [
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env'),
  ];
  for (const envFile of envCandidates) {
    if (fs.existsSync(envFile)) {
      try {
        const raw = fs.readFileSync(envFile, 'utf8');
        for (const line of raw.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const key = trimmed.slice(0, idx).trim();
            let val = trimmed.slice(idx + 1).trim();
            if (
              (val.startsWith('"') && val.endsWith('"')) ||
              (val.startsWith("'") && val.endsWith("'"))
            ) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {
        // ignore read error
      }
      break;
    }
  }
}

async function main(): Promise<void> {
  loadEnvironment();

  const rawPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!rawPassword) {
    console.error('------------------------------------------------------------');
    console.error('خطا: متغیر محیطی ADMIN_PASSWORD تنظیم نشده است.');
    console.error('لطفاً قبل از اجرای Seed، متغیر ADMIN_PASSWORD را تنظیم نمایید.');
    console.error('مثال در Windows PowerShell:');
    console.error('  $env:ADMIN_PASSWORD="YourStrongPassword123!"');
    console.error('  npm run seed:admin');
    console.error('');
    console.error('مثال در Windows Command Prompt (CMD):');
    console.error('  set ADMIN_PASSWORD=YourStrongPassword123!');
    console.error('  npm run seed:admin');
    console.error('------------------------------------------------------------');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  const email = 'admin@radinet.ir';
  const fullName = 'مدیر ارشد رادینت';
  const role = 'admin';
  const status = 'active';

  try {
    console.log(`[Seed SuperAdmin] در حال بررسی و هش‌گذاری رمز عبور...`);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`[Seed SuperAdmin] کاربر ${email} از قبل موجود است. در حال به‌روزرسانی دسترسی و رمز عبور...`);
      const updated = await prisma.user.update({
        where: { email },
        data: {
          fullName,
          role,
          status,
          passwordHash,
          updatedAt: new Date(),
        },
      });

      console.log('✅ حساب سوپرادمین موجود با موفقیت به‌روزرسانی شد:');
      console.log(`   - شناسه: ${updated.id}`);
      console.log(`   - نام: ${updated.fullName}`);
      console.log(`   - ایمیل: ${updated.email}`);
      console.log(`   - نقش: ${updated.role}`);
      console.log(`   - وضعیت: ${updated.status}`);
    } else {
      console.log(`[Seed SuperAdmin] ایجاد حساب سوپرادمین جدید برای ${email}...`);
      const created = await prisma.user.create({
        data: {
          fullName,
          email,
          passwordHash,
          role,
          status,
          country: 'IR',
        },
      });

      console.log('✅ حساب سوپرادمین با موفقیت در دیتابیس ایجاد شد:');
      console.log(`   - شناسه: ${created.id}`);
      console.log(`   - نام: ${created.fullName}`);
      console.log(`   - ایمیل: ${created.email}`);
      console.log(`   - نقش: ${created.role}`);
      console.log(`   - وضعیت: ${created.status}`);
    }
  } catch (error: any) {
    console.error('❌ خطا در اتصال یا اجرای عملیات در دیتابیس:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
