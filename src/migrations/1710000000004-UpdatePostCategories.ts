import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostCategories1710000000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. 먼저 카테고리 ID 조회
        const categories = await queryRunner.query(`
            SELECT id, slug FROM post_category 
            WHERE slug IN ('programming', 'javascript', 'python', 'review')
        `);

        const categoryMap = categories.reduce((acc, cat) => {
            acc[cat.slug] = cat.id;
            return acc;
        }, {});

        // 2. 포스트들을 적절히 분배
        await queryRunner.query(`
            UPDATE post 
            SET category_id = $1
            WHERE id % 3 = 0;
        `, [categoryMap.javascript]);  // 3으로 나눈 나머지가 0인 포스트는 javascript

        await queryRunner.query(`
            UPDATE post 
            SET category_id = $1
            WHERE id % 3 = 1;
        `, [categoryMap.python]);  // 3으로 나눈 나머지가 1인 포스트는 python

        await queryRunner.query(`
            UPDATE post 
            SET category_id = $1
            WHERE id % 3 = 2;
        `, [categoryMap.review]);  // 나머지는 review
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 모든 포스트를 programming 카테고리로 되돌림
        await queryRunner.query(`
            UPDATE post 
            SET category_id = (
                SELECT id FROM post_category WHERE slug = 'programming' LIMIT 1
            );
        `);
    }
} 