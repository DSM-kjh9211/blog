import express from 'express';
import * as publicController from '../controllers/publicController.js';

const router = express.Router();

// 공개 API: 인증 없이 접근 가능
router.get('/posts', publicController.listPosts);        // 게시글 목록 (페이지네이션)
router.get('/posts/:slug', publicController.getPost);    // 게시글 단건 조회 (slug 또는 slug.id 형식)

export default router;
