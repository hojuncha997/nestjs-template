import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('project_category')
export class ProjectCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ nullable: true })
    path: string;

    @ManyToOne(() => ProjectCategory, category => category.children, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent: ProjectCategory;

    @OneToMany(() => ProjectCategory, category => category.parent)
    children: ProjectCategory[];

    @OneToMany(() => Project, project => project.category)
    projects: Project[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
} 