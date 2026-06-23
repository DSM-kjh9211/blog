// 환경 변수(.env 파일)를 process.env에 로드
import {configDotenv} from 'dotenv';

configDotenv();

// 비동기 Promise 거부 처리 (try/catch로 잡히지 않은 경우)
process.on('unhandledRejection', (reason) => {
  console.error('❌ unhandledRejection:', reason);
});
// 동기 예외 중 try/catch로 잡히지 않은 경우
process.on('uncaughtException', (err) => {
  console.error('❌ uncaughtException:', err);
});

import express from 'express';
import session from 'express-session';
import { fileURLToPath } from 'url';
import path from 'path';
import passport from './config/passport.js';
import { startCleanupJob } from './config/cleanup.js';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';

// ES Module에는 __dirname이 없으므로 직접 계산
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// HTML 페이지 파일이 위치한 디렉터리
const pagesDir = path.join(__dirname, 'pages');

const app = express();

// public/ 폴더의 정적 파일(CSS, JS, 이미지 등) 제공
app.use(express.static(path.join(__dirname, 'public')));
// form 데이터(application/x-www-form-urlencoded) 파싱
app.use(express.urlencoded({ extended: true }));
// JSON 요청 바디 파싱
app.use(express.json());

// 세션 설정
app.use(
  session({
    secret: process.env.SESSION_SECRET,  // 세션 암호화 키
    resave: false,                        // 변경 없으면 세션 재저장 안 함
    saveUninitialized: false,             // 초기화되지 않은 세션은 저장 안 함
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // JS 접근 차단, 8시간 유효
  })
);

// Passport 인증 미들웨어 등록
app.use(passport.initialize());
// 세션에서 사용자 정보를 복원하는 미들웨어
app.use(passport.session());

// 페이지 라우트
app.get('/', (req, res) => res.sendFile(path.join(pagesDir, 'index.html')));
app.get('/post/:slug', (req, res) => res.sendFile(path.join(pagesDir, 'post.html')));

// API / 관리자
app.use('/api', apiRouter);
app.use('/admin', adminRouter);

// 404 처리: 일치하는 라우트가 없을 때
app.use((req, res) => {
  res.status(404).sendFile(path.join(pagesDir, '404.html'));
});

// 전역 오류 처리: 미들웨어에서 next(err)로 전달된 오류 처리
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 50080;
const server = app.listen(PORT, () => {
  console.log(`블로그 서버 실행 중: http://localhost:${PORT}`);
  console.log('활성 핸들 수:', process._getActiveHandles().length);
  // 만료된 테스트 포스트를 주기적으로 삭제하는 작업 시작
  startCleanupJob();
});

server.on('error', (err) => console.error('❌ 서버 오류:', err));
server.on('close', () => console.error('⚠️  서버가 닫혔습니다.'));
