// 페이지 라우트용 인증 미들웨어: 비로그인 시 로그인 페이지로 리다이렉트
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/admin/login');
}

// API 라우트용 인증 미들웨어: 비로그인 시 401 JSON 응답 반환
export function requireAuthApi(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: '로그인이 필요합니다.' });
}
