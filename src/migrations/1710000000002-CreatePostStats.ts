import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostStats1710000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. post_stats 테이블 생성
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "post_stats" (
                "post_id" INTEGER PRIMARY KEY,
                "view_count" INTEGER NOT NULL DEFAULT 0,
                "like_count" INTEGER NOT NULL DEFAULT 0,
                "comment_count" INTEGER NOT NULL DEFAULT 0,
                "view_time_in_seconds" INTEGER NOT NULL DEFAULT 0,
                CONSTRAINT "fk_post" 
                    FOREIGN KEY ("post_id") 
                    REFERENCES "post"("id") 
                    ON DELETE CASCADE
            );

            -- 기존 post의 ID를 사용하여 stats 레코드 생성
            INSERT INTO "post_stats" ("post_id")
            SELECT "id" FROM "post"
            ON CONFLICT ("post_id") DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "post_stats" CASCADE;
        `);
    }
} 