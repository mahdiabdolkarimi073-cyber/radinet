import { PrismaService } from './prisma.service';
declare class ConsultationDto {
    name: string;
    phone: string;
    email?: string;
    message?: string;
}
export declare class ConsultationController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(body: ConsultationDto): any;
    list(): any;
}
export {};
