import mysql from 'mysql2/promise';

// MySQL 연결 풀 생성: 매 요청마다 새 연결을 만들지 않고 풀에서 재사용
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,  // 풀이 꽉 찼을 때 연결 대기
  connectionLimit: 10,       // 동시 연결 최대 10개
  charset: 'utf8mb4',        // 이모지 포함 모든 유니코드 지원
});

export default pool;
