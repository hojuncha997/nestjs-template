// src/migrations/1710000000001-FillPublicIds.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class FillPublicIds1710000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 비어있는 public_id를 가진 레코드들에 대해 업데이트
        await queryRunner.query(`
            UPDATE "guestbook" 
            SET "public_id" = 'PUB' || LPAD(CAST("id" AS VARCHAR), 7, '0')
            WHERE "public_id" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // down 메서드는 필요한 경우에만 구현
    }
}