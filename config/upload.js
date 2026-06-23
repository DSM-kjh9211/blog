import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

// ES Module에는 __dirname이 없으므로 직접 계산
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 디스크 저장 전략 설정
const storage = multer.diskStorage({
  // 업로드 파일이 저장될 경로
  destination: path.join(__dirname, '../public/uploads'),
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // 랜덤 24자 hex 문자열로 파일명 생성 → 충돌 방지 및 원본 파일명 노출 방지
    const name = crypto.randomBytes(12).toString('hex');
    cb(null, `${name}${ext}`);
  },
});

// 허용할 이미지 확장자 목록
function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('이미지 파일(jpg, png, gif, webp)만 업로드할 수 있습니다.'));
}

// 이미지 단일 업로드 미들웨어 (필드명: 'image', 최대 10MB)
export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('image');
