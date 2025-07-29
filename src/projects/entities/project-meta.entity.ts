import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_meta')
export class ProjectMeta {
    @PrimaryColumn({ name: 'project_id' })
    projectId: number;

    @OneToOne(() => Project, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

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