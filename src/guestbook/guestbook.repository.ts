import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Guestbook } from './entities/guestbook.entity';

@Injectable()
export class GuestbookRepository extends Repository<Guestbook> {
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
        return await this.repository.find();
    }

    async findGuestbookByUuid(uuid: string): Promise<Guestbook | null> {
        return await this.repository.findOne({ where: { uuid: uuid } });
    }

    async createGuestbook(guestbook: Guestbook): Promise<Guestbook> {
        return await this.save(guestbook);
    }

    async updateGuestbook(guestbook: Guestbook): Promise<Guestbook> {
        return await this.saveGuestbook(guestbook);
    }

    async deleteGuestbook(uuid: string): Promise<void> {
        await this.repository.delete(uuid);
    }
}
