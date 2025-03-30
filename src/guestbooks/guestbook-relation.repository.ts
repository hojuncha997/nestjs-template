import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GuestbookRelation } from './entities/guestbook-relation.entity';

@Injectable()
export class GuestbookRelationRepository extends Repository<GuestbookRelation> {
    constructor(private dataSource: DataSource) {
        super(GuestbookRelation, dataSource.createEntityManager());
    }

    async findByGuestbookId(guestbookId: string): Promise<GuestbookRelation[]> {
        return this.find({
            where: { guestbook: { public_id: guestbookId } }
        });
    }

    async createRelation(guestbookId: string, relatedGuestbookId: string, type: string): Promise<void> {
        const relation = new GuestbookRelation();
        relation.guestbook = { public_id: guestbookId } as any;
        relation.relatedGuestbook = { public_id: relatedGuestbookId } as any;
        relation.type = type;
        await this.save(relation);
    }

    async removeRelation(guestbookId: string, relatedGuestbookId: string): Promise<void> {
        await this.delete({
            guestbook: { public_id: guestbookId },
            relatedGuestbook: { public_id: relatedGuestbookId }
        });
    }
} 