import { Controller, Get, Post, Put, Delete, Param, Body, Query, BadRequestException, DefaultValuePipe, ParseIntPipe, Logger } from '@nestjs/common';
import { GuestbooksService } from './guestbooks.service';
import { CreateGuestbookDto } from './dtos/create-guestbook.dto';
import { UpdateGuestbookDto } from './dtos/update-guestbook.dto';
import { GetGuestbooksQueryDto } from './dtos/get-guestbook-query.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Public } from '@decorators/auth/public.decorator';
import { GetMember } from '@decorators/auth/get-member.decorator';
import { Member } from '@members/entities/member.entity';
import { GuestbookListResponseDto } from './dtos/guestbook-list-response.dto';
import { ListResponse } from '@common/types/list-response.types';

@Controller('guestbooks')
export class GuestbooksController {
    private readonly logger = new Logger(GuestbooksController.name);
        constructor(private readonly guestbooksService: GuestbooksService) {}

    @Public()
    @Get()
    async getGuestbooks(@Query() query: GetGuestbooksQueryDto): Promise<ListResponse<GuestbookListResponseDto>> {
        this.logger.log('---------!!!--방명록 목록 조회');
        const result = await this.guestbooksService.findGuestbookList(query);
        return result;
    }

    @Get(':slugAndId')
    @Public()
    @UseGuards(JwtAuthGuard)
    async getGuestbook(
        @Param('slugAndId') slugAndId: string,
        @GetMember(true) member: Member | null
    ) {
        const requestId = Date.now();
            this.logger.log(`---------!!!--방명록 상세 조회 Request ID: ${requestId}`);
        this.logger.log('---------!!!--member:', member);

        const decodedSlugAndId = decodeURIComponent(slugAndId);
        const lastHyphenIndex = decodedSlugAndId.lastIndexOf('-');
        const publicId = decodedSlugAndId.substring(lastHyphenIndex + 1);
        
        if (!publicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        return await this.guestbooksService.findGuestbookByPublicId(publicId, member);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createGuestbook(
        @GetMember() member: Member,
        @Body() guestbook: CreateGuestbookDto
    ) {
        return await this.guestbooksService.createGuestbook(guestbook, member);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':public_id')
    async updateGuestbook(
        @GetMember() member: Member,
        @Param('public_id') public_id: string,
        @Body() guestbook: UpdateGuestbookDto
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }
        this.logger.log('---------!!!--방명록 수정');
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--member:', member.email);

        return await this.guestbooksService.updateGuestbook(public_id, guestbook, member);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':public_id')
    async deleteGuestbook(
        @GetMember() member: Member,
        @Param('public_id') public_id: string
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!decodedPublicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        this.logger.log('---------!!!--방명록 삭제');
        this.logger.log('---------!!!--public_id:', public_id);
        this.logger.log('---------!!!--member:', member.email);
        return await this.guestbooksService.deleteGuestbook(decodedPublicId, member);
    }

    @Public()
    @Post(':public_id/views')
    async incrementViewCount(
        @Param('public_id') public_id: string
    ) {
        const decodedPublicId = decodeURIComponent(public_id);
        
        if (!public_id?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }

        await this.guestbooksService.incrementViewCount(public_id);
        return { success: true };
    }
} 