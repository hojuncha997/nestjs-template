// 카테고리 엔티티
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Guestbook } from './guestbook.entity';

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

    @OneToMany(() => Guestbook, (guestbook) => guestbook.category) // 카테고리와 게시글 관계 설정
    guestbooks: Guestbook[];

    @Column({
        type: 'text',
        name: 'description',
        nullable: true,
    })
    description: string;
}
