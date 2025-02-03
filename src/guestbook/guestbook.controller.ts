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
    UseGuards
} from '@nestjs/common';
import { GuestbookService } from './guestbook.service';
import { CreateGuestbookDto } from './dtos/create-guestbook.dto';
import { UpdateGuestbookDto } from './dtos/update-guestbook.dto';
import { GetGuestbooksQueryDto } from './dtos/get-guestbook-query.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { Public } from '../decorators/auth/public.decorator';


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
    @Get(':uuid')
    async getGuestbook(@Param('uuid') uuid: string) {
        return await this.guestbookService.findGuestbookByUuid(uuid);
    }

    // -- @public() 데코레이터가 없는 경우 { "message": "Unauthorized", "statusCode": 401 }반환
    
    @Post()
    async createGuestbook(@Body() guestbook: CreateGuestbookDto) {
        return await this.guestbookService.createGuestbook(guestbook);
    }

    @Put(':uuid')
    async updateGuestbook(@Param('uuid') uuid: string, @Body() guestbook: UpdateGuestbookDto) {
        return await this.guestbookService.updateGuestbook(uuid, guestbook);
    }

    @Delete(':uuid')
    async deleteGuestbook(@Param('uuid') uuid: string) {
        return await this.guestbookService.deleteGuestbook(uuid);
    }
}
