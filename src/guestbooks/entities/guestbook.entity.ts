import { Entity, PrimaryGeneratedColumn, OneToOne, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '@members/entities/member.entity';
import { init } from '@paralleldrive/cuid2';
import { GuestbookStats } from './guestbook-stats.entity';
import { GuestbookMeta } from './guestbook-meta.entity';
import { GuestbookCategory } from '@category/entities/guestbook-category.entity';
import { GuestbookStatus } from '@common/enums/guestbook-status.enum';
const createId = init({ length: 10 });

@Entity('guestbook')
@Index(['public_id'], { unique: true })
@Index(['status'])
export class Guestbook {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, length: 10, nullable: true })
    public_id: string;

    @Column({ length: 100, nullable: true })
    slug: string;

    @BeforeInsert()
    generatePublicIdAndSlug() {
        this.public_id = createId();
        
        if (!this.slug && this.title) {
            this.slug = this.title
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w\-가-힣]/g, '')
                .toLowerCase()
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 100);
        }
    }

    @ManyToOne(() => Member, { nullable: false })
    @JoinColumn({ name: 'author_id' })
    author: Member;

    @Column({ name: 'current_author_name' })
    current_author_name: string;

    @ManyToOne(() => GuestbookCategory)
    @JoinColumn({ name: 'category_id' })
    category: GuestbookCategory;

    @Column()
    title: string;

    @Column('json')
    content: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({type: 'timestamp', nullable: true})
    publishedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    scheduledAt: Date;

    @Column({
        type: 'enum',
        enum: GuestbookStatus,
        default: GuestbookStatus.PUBLISHED
    })
    status: GuestbookStatus;
    
    @Column({nullable: true})
    thumbnail: string;

    @Column('simple-json', { default: '[]' })
    tags: string[];

    @OneToOne(() => GuestbookStats, stats => stats.guestbook)
    stats: GuestbookStats;

    @OneToOne(() => GuestbookMeta, meta => meta.guestbook)
    meta: GuestbookMeta;

    @Column({default: false})
    isFeatured: boolean;

    @Column({default: false})
    isSecret: boolean;
} 