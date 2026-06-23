import pool from './db.js';

// 만료된 테스트 포스트를 주기적으로 삭제하는 백그라운드 작업
// 테스트 계정이 작성한 글에는 expires_at이 설정되며, 만료 후 이 함수가 정리함
export function startCleanupJob() {
  const run = async () => {
    try {
      // expires_at이 설정된 글 중 현재 시각을 지난 것을 삭제
      const [result] = await pool.execute(
        'DELETE FROM posts WHERE expires_at IS NOT NULL AND expires_at <= NOW()'
      );
      if (result.affectedRows > 0) {
        console.log(`[Cleanup] 테스트 포스트 ${result.affectedRows}개 삭제됨`);
      }
    } catch (err) {
      console.error('[Cleanup] 오류:', err.message);
    }
  };

  // 서버 시작 시 즉시 한 번 실행 후, 30초마다 반복
  run();
  return setInterval(run, 30_000);
}
