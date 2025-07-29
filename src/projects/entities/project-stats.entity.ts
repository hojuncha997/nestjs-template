import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Project } from './project.entity';
import { Logger } from '@nestjs/common';

@Entity('project_stats')
export class ProjectStats {
    private readonly logger = new Logger(ProjectStats.name);

    @PrimaryColumn({ name: 'project_id' })
    projectId: number;

    @OneToOne(() => Project, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'project_id' })
    project: Project;

    @Column({type: 'integer', default: 0})
    viewCount: number;

    @Column({type: 'integer', default: 0})
    likeCount: number;

    @Column({type: 'integer', default: 0})
    commentCount: number;

    @Column({type: 'integer', default: 0})
    viewTimeInSeconds: number;
} 