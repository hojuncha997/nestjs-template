// dataSource.ts

// TypeORM CLI에서 데코레이터를 사용하기 위해서는 reflect-metadata를 명시적으로 임포트해야 함
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as path from 'path';

// TypeORM CLI에서도 tsconfig.json의 path alias를 인식하기 위해 필요
require('ts-node').register({
    project: path.join(__dirname, 'tsconfig.json'),
    transpileOnly: true,
    require: ['tsconfig-paths/register']
});

// .env.local이 있다면 그걸 먼저 로드하고, 없다면 .env를 로드
config({ path: '.env.local' });
config();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    // entities: ['src/**/*.entity{.ts,.js}'], 모든 엔티티 검사
    // 엔티티 검사 범위를 좁히기 위해 각 모듈의 엔티티 경로를 지정
    // entities: ['src/guestbook/**/*.entity{.ts,.js}'],
    
    // 특정 엔티티 파일만 명시적으로 지정
    entities: [
        'src/guestbook/entities/guestbook.entity.ts',
        'src/members/entities/member.entity.ts',
        'src/auth/entities/refresh-token.entity.ts',
        'src/posts/entities/post.entity.ts',
        'src/posts/entities/post-stats.entity.ts',
        'src/posts/entities/post-meta.entity.ts',
        'src/posts/entities/post-curation.entity.ts',
        'src/category/entities/post-category.entity.ts'
    ],
    migrations: ['src/migrations/*{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
});

export default dataSource;