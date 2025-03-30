import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GuestbookMeta } from './entities/guestbook-meta.entity';

@Injectable()
export class GuestbookMetaRepository extends Repository<GuestbookMeta> {
    constructor(private dataSource: DataSource) {
        super(GuestbookMeta, dataSource.createEntityManager());
    }

    async findByGuestbookId(guestbookId: string): Promise<GuestbookMeta | null> {
        return this.findOne({
            where: { guestbook: { public_id: guestbookId } }
        });
    }

    async updateMetaData(guestbookId: string, metaData: Partial<GuestbookMeta>): Promise<void> {
            await this.update({ guestbook: { public_id: guestbookId } }, metaData);
    }
} 