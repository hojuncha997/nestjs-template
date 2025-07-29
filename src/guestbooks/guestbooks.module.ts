import { GuestbooksController } from './guestbooks.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Guestbook } from './entities/guestbook.entity';
import { GuestbooksService } from './guestbooks.service';
import { GuestbooksRepository } from './guestbooks.repository';
import { GuestbooksMapper } from './mappers/guestbooks.mapper';
import { MembersModule } from '../members/members.module';
import { GuestbookRelationRepository } from './guestbook-relation.repository';
import { GuestbookStats } from './entities/guestbook-stats.entity';
import { GuestbookStatsRepository } from './guestbook-stats.repository';
import { GuestbookMetaRepository } from './guestbook-meta.repository';
import { GuestbookMeta } from './entities/guestbook-meta.entity';
import { CategoryModule } from '@category/category.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Guestbook, GuestbookStats, GuestbookMeta]),
        MembersModule,
        CategoryModule,
    ],
    providers: [
        GuestbooksService,
        GuestbooksRepository,
        GuestbooksMapper,
        GuestbookRelationRepository,
        GuestbookStatsRepository,
        GuestbookMetaRepository,
    ],
    controllers: [GuestbooksController],
    exports: [GuestbooksService],
})
export class GuestbooksModule {} 