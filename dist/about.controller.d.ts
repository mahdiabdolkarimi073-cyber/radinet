import { PrismaService } from './prisma.service';
declare class ContentDto {
    key: string;
    title: string;
    body: string;
    isActive?: boolean;
}
declare class MediaDto {
    kind: string;
    title: string;
    imageUrl: string;
    displayOrder?: number;
    isActive?: boolean;
}
export declare class AboutController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPublic(): Promise<{
        content: any;
        team: any;
        office: any;
        certificates: any;
    }>;
    createContent(body: ContentDto): any;
    updateContent(id: string, body: Partial<ContentDto>): any;
    deleteContent(id: string): any;
    createMedia(body: MediaDto): any;
    updateMedia(id: string, body: Partial<MediaDto>): any;
    deleteMedia(id: string): any;
    createCertificate(body: MediaDto): any;
    updateCertificate(id: string, body: Partial<MediaDto>): any;
    deleteCertificate(id: string): any;
}
export {};
