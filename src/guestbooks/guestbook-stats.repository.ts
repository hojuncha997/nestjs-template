import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GuestbookStats } from './entities/guestbook-stats.entity';

@Injectable()
export class GuestbookStatsRepository extends Repository<GuestbookStats> {
    constructor(private dataSource: DataSource) {
        super(GuestbookStats, dataSource.createEntityManager());
    }

    async findByGuestbookId(guestbookId: string): Promise<GuestbookStats | null> {
        return this.findOne({
            where: { guestbook: { public_id: guestbookId } }
        });
    }

    async incrementViewCount(guestbookId: string): Promise<void> {
        await this.increment({ guestbook: { public_id: guestbookId } }, 'viewCount', 1);
    }

    async incrementLikeCount(guestbookId: string): Promise<void> {
        await this.increment({ guestbook: { public_id: guestbookId } }, 'likeCount', 1);
    }

    async decrementLikeCount(guestbookId: string): Promise<void> {
        await this.decrement({ guestbook: { public_id: guestbookId } }, 'likeCount', 1);
    }
} 