import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignPostCategories1710000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 모든 NULL인 category_id를 programming 카테고리로 설정
        await queryRunner.query(`
            UPDATE post 
            SET category_id = (
                SELECT id FROM post_category WHERE slug = 'programming' LIMIT 1
            )
            WHERE category_id IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 필요한 경우 programming 카테고리의 포스트들을 NULL로 되돌림
        await queryRunner.query(`
            UPDATE post 
            SET category_id = NULL 
            WHERE category_id = (
                SELECT id FROM post_category WHERE slug = 'programming' LIMIT 1
            );
        `);
    }
} 