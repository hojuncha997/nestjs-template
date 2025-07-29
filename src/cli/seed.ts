import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { seedProjectCategories } from '../category/seeds/project-category.seed';

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
    entities: [
        'src/**/*.entity{.ts,.js}'
    ],
    migrations: ['src/migrations/*{.ts,.js}'],
});

async function seed() {
    try {
        await dataSource.initialize();
        console.log('데이터베이스 연결 성공');

        // 프로젝트 카테고리 시드 데이터 실행
        await seedProjectCategories(dataSource);
        console.log('프로젝트 카테고리 시드 데이터 생성 완료');

        await dataSource.destroy();
        console.log('데이터베이스 연결 종료');
    } catch (error) {
        console.error('시드 데이터 생성 중 오류 발생:', error);
        process.exit(1);
    }
}

seed(); 