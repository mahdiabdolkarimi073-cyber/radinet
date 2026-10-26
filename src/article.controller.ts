import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Controller('articles')
export class ArticleController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getPublishedArticles(
    @Query('limit') limit?: string,
    @Query('category') category?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : undefined;
    const where: any = { isPublished: true };
    if (category) {
      where.category = category;
    }

    return (this.prisma as any).article.findMany({
      where,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take,
    });
  }

  @Get('stats')
  async getRealStats() {
    const [requestCount, doctorCount, centerCount, activeUserCount] = await Promise.all([
      this.prisma.teleReportRequest.count(),
      this.prisma.doctorProfile.count(),
      this.prisma.imagingCenter.count(),
      this.prisma.user.count({ where: { status: 'active' } }),
    ]);

    return {
      requests: requestCount,
      doctors: doctorCount,
      centers: centerCount,
      activeUsers: activeUserCount,
    };
  }

  @Get(':slug')
  async getArticleBySlug(@Param('slug') slug: string) {
    let article = await (this.prisma as any).article.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublished: true,
      },
    });

    if (!article) {
      throw new NotFoundException('مقاله مورد نظر یافت نشد');
    }

    return article;
  }
}
