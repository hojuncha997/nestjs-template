import { ProjectStatus } from '@common/enums/project-status.enum';
import { Entity, PrimaryGeneratedColumn, OneToOne, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, BeforeInsert, Index, ManyToOne, JoinColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Member } from '@members/entities/member.entity';
import { init } from '@paralleldrive/cuid2';
import { ProjectStats } from './project-stats.entity';
import { ProjectMeta } from './project-meta.entity';
import { ProjectCategory } from '@category/entities/project-category.entity';

const createId = init({ length: 10 });

@Entity('project')
@Index(['public_id'], { unique: true })
@Index(['status'])
export class Project {
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

    @ManyToOne(() => ProjectCategory)
    @JoinColumn({ name: 'category_id' })
    category: ProjectCategory;

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
        enum: ProjectStatus,
        default: ProjectStatus.PUBLISHED
    })
    status: ProjectStatus;
    
    @Column({nullable: true})
    thumbnail: string;

    @Column('simple-json', { default: '[]' })
    tags: string[];

    @OneToOne(() => ProjectStats, stats => stats.project)
    stats: ProjectStats;

    @OneToOne(() => ProjectMeta, meta => meta.project)
    meta: ProjectMeta;

    @Column({default: false})
    isFeatured: boolean;

    @Column({default: false})
    isSecret: boolean;
} 