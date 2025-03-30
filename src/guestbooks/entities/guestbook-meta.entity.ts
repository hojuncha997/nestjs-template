import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Guestbook } from './guestbook.entity';

@Entity('guestbook_meta')
export class GuestbookMeta {
    @PrimaryColumn({ name: 'guestbook_id' })
    guestbookId: number;

    @OneToOne(() => Guestbook, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'guestbook_id' })
    guestbook: Guestbook;

    @Column({ length: 50, nullable: true })
    description: string;

    @Column({ length: 300, nullable: true })
    excerpt: string;

    @Column({ type: 'int', nullable: true })
    readingTime: number;

    @Column({ nullable: true })
    coverImageAlt: string;

    @Column({ length: 160, nullable: true })
    metaDescription: string;
} 