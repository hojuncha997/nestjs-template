import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guestbook } from './entities/guestbook.entity';
import { GuestbookStats } from './entities/guestbook-stats.entity';
import { GuestbookStatus } from '@common/enums/guestbook-status.enum';

@Injectable()
export class GuestbooksRepository extends Repository<Guestbook> {
    private readonly logger = new Logger(GuestbooksRepository.name);
    constructor(
        @InjectRepository(Guestbook)
        private readonly repository: Repository<Guestbook>
    ) {
        super(repository.target, repository.manager, repository.queryRunner);
    }

    async saveGuestbook(guestbook: Guestbook): Promise<Guestbook> {
        return await this.repository.save(guestbook);
    }

        async findAllGuestbooks(): Promise<Guestbook[]> {
        return await this.repository
            .createQueryBuilder('guestbook')
            .leftJoinAndSelect('guestbook.stats', 'stats')
            .getMany();
    }

    async findGuestbookByPublicId(public_id: string, withDeleted: boolean = false): Promise<Guestbook | null> {
        const query = this.repository
            .createQueryBuilder('guestbook')
            .leftJoinAndSelect('guestbook.author', 'author')
            .leftJoinAndSelect('guestbook.stats', 'stats')
            .leftJoinAndSelect('guestbook.meta', 'meta')
            .where('guestbook.public_id = :public_id', { public_id });

        if (withDeleted) {
            query.withDeleted();
        }

        const result = await query.getOne();
        this.logger.log('---------DEBUG--Raw Result:', result);

        return result;
    }

    async createGuestbook(guestbook: Guestbook): Promise<Guestbook> {
        const savedGuestbook = await this.save(guestbook);
        
        // GuestbookStats 생성
        const guestbookStats = new GuestbookStats();
        guestbookStats.guestbookId = savedGuestbook.id;
        await this.manager.getRepository(GuestbookStats).save(guestbookStats);
        
        return savedGuestbook;
    }

    async updateGuestbook(guestbook: Guestbook): Promise<Guestbook> {
        return await this.saveGuestbook(guestbook);
    }

    async deleteGuestbook(public_id: string): Promise<void> {
        await this.repository.manager.transaction(async (transactionalEntityManager) => {
            await transactionalEntityManager
                .createQueryBuilder()
                .update(Guestbook)
                .set({ status: GuestbookStatus.DELETED })
                .where('public_id = :public_id', { public_id })
                .execute();

            await transactionalEntityManager
                .softDelete(Guestbook, { public_id });
        });
    }

    async incrementViewCount(public_id: string): Promise<void> {
        const guestbook = await this.findGuestbookByPublicId(public_id);
        if (!guestbook) return;

        await this.manager.getRepository(GuestbookStats)
            .createQueryBuilder()
            .update(GuestbookStats)
            .set({
                viewCount: () => 'view_count + 1'
            })
            .where('guestbookId = :guestbookId', { guestbookId: guestbook.id })
            .execute();
    }

    async findEntityByPublicId(public_id: string): Promise<Guestbook | null> {
        return await this.repository
            .createQueryBuilder('guestbook')
            .leftJoinAndSelect('guestbook.stats', 'stats')
            .where('guestbook.public_id = :public_id', { public_id })
            .getOne();
    }
} 