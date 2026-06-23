import pool from '../config/db.js';
import { uploadImage } from '../config/upload.js';

// 제목 문자열을 URL 친화적인 slug로 변환
// 예: "안녕 World!" → "안녕-world"
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')  // 영문/숫자/한글/공백/하이픈만 남김
    .replace(/\s+/g, '-')               // 공백을 하이픈으로
    .replace(/-+/g, '-')               // 연속 하이픈을 단일 하이픈으로
    .replace(/^-|-$/g, '');            // 앞뒤 하이픈 제거
}

// 충돌 없는 고유한 slug를 생성
// 이미 존재하는 slug면 "-2", "-3" 형식으로 번호를 붙임
// excludeId: 수정 시 자기 자신은 제외하고 검사
async function uniqueSlug(base, excludeId = null) {
  let slug = base;
  let n = 1;
  while (true) {
    const query = excludeId
      ? 'SELECT id FROM posts WHERE slug = ? AND id != ?'
      : 'SELECT id FROM posts WHERE slug = ?';
    const params = excludeId ? [slug, excludeId] : [slug];
    const [rows] = await pool.execute(query, params);
    if (!rows.length) return slug;  // 중복 없으면 현재 slug 사용
    slug = `${base}-${++n}`;       // 중복이면 번호 증가 후 재시도
  }
}

// 현재 로그인한 사용자 정보 반환
export function me(req, res) {
  res.json({ user: req.user });
}

// 로그아웃: Passport 세션 해제 후 세션 자체를 삭제
export async function logout(req, res, next) {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => res.json({ success: true }));
  });
}

// 관리자 포스트 목록 (모든 포스트, 최신순, 만료 포함)
export async function listPosts(req, res, next) {
  try {
    const [posts] = await pool.execute(
      'SELECT id, title, slug, content_type, published, created_at, expires_at FROM posts ORDER BY created_at DESC'
    );
    res.json({ posts });
  } catch (err) {
    next(err);
  }
}

// 포스트 단건 조회 (관리자용: 비공개/만료 글도 조회 가능)
export async function getPost(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: '포스트를 찾을 수 없습니다.' });
    res.json({ post: rows[0] });
  } catch (err) {
    next(err);
  }
}

// 포스트 생성
// 테스트 계정(isTest: true)이 작성한 글은 5분 후 자동 삭제를 위해 expires_at 설정
export async function createPost(req, res, next) {
  const { title, content, content_type, published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
  }
  try {
    const slug = await uniqueSlug(slugify(title));
    // 테스트 계정이 작성한 글은 5분 후 자동 삭제
    const expiresAt = req.user?.isTest ? new Date(Date.now() + 5 * 60 * 1000) : null;

    const [result] = await pool.execute(
      'INSERT INTO posts (title, slug, content, content_type, published, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [title, slug, content, content_type || 'markdown', published ? 1 : 0, expiresAt]
    );
    res.json({ post: { id: result.insertId, slug } });
  } catch (err) {
    next(err);
  }
}

// 포스트 수정 (slug도 제목에 맞게 재생성)
export async function updatePost(req, res, next) {
  const { id } = req.params;
  const { title, content, content_type, published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '제목과 내용을 입력해주세요.' });
  }
  try {
    // 자기 자신(excludeId=id)을 제외하고 slug 중복 검사
    const slug = await uniqueSlug(slugify(title), id);
    await pool.execute(
      'UPDATE posts SET title = ?, slug = ?, content = ?, content_type = ?, published = ? WHERE id = ?',
      [title, slug, content, content_type || 'markdown', published ? 1 : 0, id]
    );
    res.json({ post: { id, slug } });
  } catch (err) {
    next(err);
  }
}

// 포스트 삭제
export async function deletePost(req, res, next) {
  try {
    await pool.execute('DELETE FROM posts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// 이미지 업로드 처리
// multer 미들웨어를 수동으로 실행하여 에러를 컨트롤러 내에서 처리
export function uploadImageHandler(req, res) {
  uploadImage(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '파일이 없습니다.' });
    // 업로드 성공 시 공개 URL 반환
    res.json({ url: `/uploads/${req.file.filename}` });
  });
}
