// 카테고리 엔티티
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Post } from './post.entity';

@Entity()
export class Category {
    @PrimaryGeneratedColumn({
        type: 'integer',
        name: 'id',
    })
    id: number;

    @Column({
        type: 'varchar',
        name: 'code',
        length: 255,
        nullable: false,
        unique: true,
    })
    code: string;

    @Column({
        type: 'varchar',
        name: 'name',
        length: 255,
        nullable: false,
    })
    name: string;

    @OneToMany(() => Post, (post) => post.category) // 카테고리와 게시글 관계 설정
    posts: Post[];

    @Column({
        type: 'text',
        name: 'description',
        nullable: true,
    })
    description: string;
}
