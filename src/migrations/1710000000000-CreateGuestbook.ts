import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGuestbook1710000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. 기존 테이블이 있는지 확인
        const tableExists = await queryRunner.hasTable('guestbook');

        if (!tableExists) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "guestbook" (
                    "id" SERIAL PRIMARY KEY,
                    "public_id" VARCHAR(10),  -- 처음에는 NULL 허용
                    "slug" VARCHAR NOT NULL,  -- NOT NULL 제약조건 추가
                    "category" VARCHAR NOT NULL DEFAULT 'uncategorized',
                    "title" VARCHAR NOT NULL,
                    "is_secret" BOOLEAN NOT NULL DEFAULT false,
                    "author_id" INTEGER,
                    "author_display_name" VARCHAR NOT NULL,
                    "current_author_name" VARCHAR NOT NULL,
                    "content" JSONB NOT NULL,  -- JSON 대신 JSONB 사용
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "status" VARCHAR NOT NULL DEFAULT 'PUBLISHED' 
                        CHECK (status IN ('DRAFT', 'PUBLISHED', 'PRIVATE', 'DELETED')),  -- 문자열로 저장하되 유효성 체크
                    "thumbnail" VARCHAR,
                    "tags" JSONB NOT NULL DEFAULT '[]',  -- JSON 대신 JSONB 사용
                    "view_count" INTEGER NOT NULL DEFAULT 0,
                    "like_count" INTEGER NOT NULL DEFAULT 0,
                    "comment_count" INTEGER NOT NULL DEFAULT 0,
                    "is_featured" BOOLEAN NOT NULL DEFAULT false
                );

                -- 인덱스 생성
                CREATE INDEX "IDX_GUESTBOOK_STATUS" ON "guestbook" ("status");
                CREATE INDEX "IDX_GUESTBOOK_CATEGORY" ON "guestbook" ("category");
                CREATE INDEX "IDX_GUESTBOOK_CREATED_AT" ON "guestbook" ("created_at" DESC);

                -- public_id에 대한 값 설정 후 UNIQUE 제약조건 추가
                ALTER TABLE "guestbook" 
                    ALTER COLUMN "public_id" SET NOT NULL,
                    ADD CONSTRAINT "UQ_GUESTBOOK_PUBLIC_ID" UNIQUE ("public_id");
            `);
        } else {
            // 기존 테이블 구조 변경 시에는 더 안전한 방식으로 처리
            await queryRunner.query(`
                -- NOT NULL이 아닌 상태로 먼저 컬럼 추가
                ALTER TABLE "guestbook" 
                ADD COLUMN IF NOT EXISTS "public_id" VARCHAR(10),
                ADD COLUMN IF NOT EXISTS "status" VARCHAR DEFAULT 'PUBLISHED';

                -- 기존 데이터에 대한 처리가 필요한 경우 여기서 수행
                
                -- 제약조건 추가
                ALTER TABLE "guestbook" 
                ALTER COLUMN "status" SET NOT NULL,
                ADD CONSTRAINT "CHK_GUESTBOOK_STATUS" 
                    CHECK (status IN ('DRAFT', 'PUBLISHED', 'PRIVATE', 'DELETED'));
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "guestbook" CASCADE;
        `);
    }
}