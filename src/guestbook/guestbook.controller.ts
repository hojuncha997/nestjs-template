import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Param, 
    Body, 
    Query, 
    Headers,
    UseGuards,
    BadRequestException
} from '@nestjs/common';
import { GuestbookService } from './guestbook.service';
import { CreateGuestbookDto } from './dtos/create-guestbook.dto';
import { UpdateGuestbookDto } from './dtos/update-guestbook.dto';
import { GetGuestbooksQueryDto } from './dtos/get-guestbook-query.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Public } from '../decorators/auth/public.decorator';
import { GetMember } from '../decorators/auth/get-member.decorator';
import { Member } from '../members/entities/member.entity';


@Controller('guestbooks')
@UseGuards(JwtAuthGuard)
export class GuestbookController {
    constructor(private readonly guestbookService: GuestbookService) {}

    @Public()
    @Get()
    async getGuestbooks(@Query() query: GetGuestbooksQueryDto) {
        return await this.guestbookService.findGuestbooks(query);
    }

    @Public()
    @Get(':slugAndId')
    async getGuestbook(@Param('slugAndId') slugAndId: string) {
        const publicId = slugAndId.split('-').pop();
        if (!publicId?.match(/^[a-z0-9]{10}$/i)) {
            throw new BadRequestException('Invalid public_id format');
        }
        return await this.guestbookService.findGuestbookByPublicId(publicId);
    }

    // -- @public() 데코레이터가 없는 경우 { "message": "Unauthorized", "statusCode": 401 }반환
    
    @Post()
    async createGuestbook(
        @GetMember() member: Member,
        @Body() guestbook: CreateGuestbookDto
    ) {
        return await this.guestbookService.createGuestbook(guestbook, member);
    }

    @Put(':public_id')
    async updateGuestbook(
        @GetMember() member: Member,
        @Param('public_id') public_id: string,
        @Body() guestbook: UpdateGuestbookDto
    ) {
        return await this.guestbookService.updateGuestbook(public_id, guestbook, member);
    }

    @Delete(':public_id')
    async deleteGuestbook(
        @GetMember() member: Member,
        @Param('public_id') public_id: string
    ) {
        return await this.guestbookService.deleteGuestbook(public_id, member);
    }

    // @Put(':slugAndId')
    // async updateGuestbook(
    //     @GetMember() member: Member,
    //     @Param('slugAndId') slugAndId: string,
    //     @Body() guestbook: UpdateGuestbookDto
    // ) {
    //     const [slug, public_id] = slugAndId.split('-').reverse();
    //     return await this.guestbookService.updateGuestbook(public_id, guestbook, member);
    // }

    // @Delete(':slugAndId')
    // async deleteGuestbook(
    //     @GetMember() member: Member,
    //     @Param('slugAndId') slugAndId: string
    // ) {
    //     const [slug, public_id] = slugAndId.split('-').reverse();
    //     return await this.guestbookService.deleteGuestbook(public_id, member);
    // }
}
