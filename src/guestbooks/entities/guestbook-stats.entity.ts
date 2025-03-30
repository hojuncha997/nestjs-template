import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Guestbook } from './guestbook.entity';
import { Logger } from '@nestjs/common';

@Entity('guestbook_stats')
export class GuestbookStats {
    private readonly logger = new Logger(GuestbookStats.name);

    @PrimaryColumn({ name: 'guestbook_id' })
    guestbookId: number;

    @OneToOne(() => Guestbook, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'guestbook_id' })
    guestbook: Guestbook;

    @Column({type: 'integer', default: 0})
    viewCount: number;

    @Column({type: 'integer', default: 0})
    likeCount: number;

    @Column({type: 'integer', default: 0})
    commentCount: number;

    @Column({type: 'integer', default: 0})
    viewTimeInSeconds: number;
} 