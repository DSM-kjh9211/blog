import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import passport from '../config/passport.js';
import { requireAuth, requireAuthApi } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

// ES Module에는 __dirname이 없으므로 직접 계산
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 관리자 HTML 페이지 디렉터리
const pagesDir = path.join(__dirname, '../pages/admin');

const router = express.Router();

// --- OAuth (Discord) ---
// Discord 로그인 시작 → Discord 인증 화면으로 리다이렉트
router.get('/auth/discord', passport.authenticate('discord'));
// Discord 인증 후 콜백: 성공 시 관리자 대시보드로, 실패 시 로그인 페이지로
router.get(
  '/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/admin/login' }),
  (req, res) => res.redirect('/admin')
);

// --- Local 로그인 (테스트 계정) ---
// 커스텀 콜백 방식: 인증 결과에 따라 직접 응답 처리 (flash 메시지 대신 JSON 반환)
router.post('/auth/local', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || '로그인 실패' });
    req.logIn(user, err => {
      if (err) return next(err);
      res.json({ success: true });
    });
  })(req, res, next);
});

// --- 페이지 ---
// 인증이 필요 없는 로그인 페이지
router.get('/login', (req, res) => res.sendFile(path.join(pagesDir, 'login.html')));
// 인증이 필요한 관리자 페이지들
router.get('/', requireAuth, (req, res) => res.sendFile(path.join(pagesDir, 'index.html')));
router.get('/posts/new', requireAuth, (req, res) => res.sendFile(path.join(pagesDir, 'post-form.html')));
router.get('/posts/:id/edit', requireAuth, (req, res) => res.sendFile(path.join(pagesDir, 'post-form.html')));

// --- API (모두 인증 필요) ---
router.get('/api/me', requireAuthApi, adminController.me);                          // 현재 로그인 사용자 정보
router.post('/api/logout', requireAuthApi, adminController.logout);                 // 로그아웃
router.post('/api/upload/image', requireAuthApi, adminController.uploadImageHandler); // 이미지 업로드
router.get('/api/posts', requireAuthApi, adminController.listPosts);                // 포스트 목록
router.get('/api/posts/:id', requireAuthApi, adminController.getPost);              // 포스트 단건 조회
router.post('/api/posts', requireAuthApi, adminController.createPost);              // 포스트 생성
router.put('/api/posts/:id', requireAuthApi, adminController.updatePost);           // 포스트 수정
router.delete('/api/posts/:id', requireAuthApi, adminController.deletePost);        // 포스트 삭제

export default router;
