// src/config/database.config.ts
// 데이터베이스 연결 정보를 관리하는 파일
import { registerAs } from '@nestjs/config';

// 순수 데이터베이스 연결 정보만 관리
export default registerAs('database', () => ({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
}));
