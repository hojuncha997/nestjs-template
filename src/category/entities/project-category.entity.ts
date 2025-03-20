import { Column, Entity, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity({ name: 'project_category' })
export class ProjectCategory {
    // 카테고리 아이디
    @PrimaryGeneratedColumn({
        type: 'integer',
        name: 'id',
    })
    id: number;

    // 카테고리 코드
    @Column({
        type: 'varchar',
        name: 'slug',
        length: 255,
        nullable: false,
        unique: true,
    })
    slug: string;

    // 카테고리 이름
    @Column({
        type: 'varchar',
        name: 'name',
        length: 255,
        nullable: false,
    })
    name: string;

    // 카테고리 설명
    @Column({   
        type: 'text',
        name: 'description',
        nullable: true,
    })
    description: string;
    
    // 부모 카테고리 아이디
    @Column({
        type: 'integer',
        name: 'parent_id',
        nullable: true,
    })
    parentId: number;

    // 계층 깊이
    @Column({
        type: 'integer',
        name: 'depth',
        default: 0,
    })
    depth: number;

    // 계층 구조를 표현하는 경로
    @Column({
        type: 'varchar',
        name: 'path',
        length: 255,
        nullable: true,
    })
    path: string;

    // 부모 카테고리
    @ManyToOne(() => ProjectCategory, category => category.children, {
        onDelete: 'SET NULL'
    })
    @JoinColumn({ name: 'parent_id' })
    parent: ProjectCategory;

    // 하위 카테고리
    @OneToMany(() => ProjectCategory, category => category.parent)
    children: ProjectCategory[];

    // 프로젝트
    @OneToMany(() => Project, project => project.category)
    projects: Project[];
    
    // 표시 순서
    @Column({
        type: 'integer',
        name: 'display_order',
        default: 0,
    })
    displayOrder: number;
    
    // 활성화 여부
    @Column({
        type: 'boolean',
        name: 'is_active',
        default: true,
    })
    isActive: boolean;
    
    // 생성일
    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
    })
    createdAt: Date;
    
    // 수정일
    @UpdateDateColumn({
        type: 'timestamp',
        name: 'updated_at',
    })
    updatedAt: Date;

    @BeforeInsert()
    @BeforeUpdate()
    async generatePath() {
        if (this.parentId) {
            const parent = await this.parent;
            if (parent) {
                this.path = parent.path ? `${parent.path}/${this.id}` : `${this.id}`;
                this.depth = parent.depth + 1;
            } else {
                this.path = `${this.id}`;
                this.depth = 0;
            }
        } else {
            this.path = `${this.id}`;
            this.depth = 0;
        }
    }
} 