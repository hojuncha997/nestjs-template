//src/posts/guestbook.module.ts

import { GuestbookController } from './guestbook.controller';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guestbook } from './entities/guestbook.entity';
import { GuestbookService } from './guestbook.service';
import { GuestbookRepository } from './guestbook.repository';
import { GuestbookMapper } from './mappers/guestbook.mapper';

@Module({
    imports: [TypeOrmModule.forFeature([Guestbook])],
    providers: [GuestbookService, GuestbookRepository, GuestbookMapper],
    controllers: [GuestbookController],
    // exports: [GuestbookService],
})
export class GuestbookModule {}