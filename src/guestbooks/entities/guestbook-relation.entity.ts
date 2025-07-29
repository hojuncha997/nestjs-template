import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Guestbook } from './guestbook.entity';

@Entity('guestbook_relations')
export class GuestbookRelation {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Guestbook, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'guestbook_id' })
    guestbook: Guestbook;

    @ManyToOne(() => Guestbook, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'related_guestbook_id' })
    relatedGuestbook: Guestbook;

    @Column()
    type: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 