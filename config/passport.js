import 'dotenv/config';
import passport from 'passport';
import { Strategy as DiscordStrategy, Scope } from 'passport-discord-auth';
import { Strategy as LocalStrategy } from 'passport-local';

// Discord OAuth2 전략: 실제 관리자 인증에 사용
// Discord에서 돌아온 profile.id가 ADMIN_DISCORD_ID와 일치할 때만 허용
passport.use(
  new DiscordStrategy(
    {
      "clientId": process.env.DISCORD_CLIENT_ID,
      "clientSecret": process.env.DISCORD_CLIENT_SECRET,
      "callbackUrl": process.env.DISCORD_CALLBACK_URL,
      "scope": [Scope.Identify],  // 사용자 ID/이름만 요청 (이메일, 서버 등은 요청 안 함)
    },
    (accessToken, refreshToken, profile, done) => {
      // 환경 변수로 지정된 관리자 ID가 아니면 인증 거부
      if (profile.id !== process.env.ADMIN_DISCORD_ID) {
        return done(null, false);
      }
      return done(null, { id: profile.id, username: profile.username, isTest: false });
    }
  )
);

// Local 전략: 테스트용 더미 계정 로그인 (ID/비밀번호 직접 입력)
// 환경 변수 TEST_USERNAME, TEST_PASSWORD가 설정되어 있어야 활성화됨
passport.use(
  new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    (username, password, done) => {
      const validUser = process.env.TEST_USERNAME;
      const validPass = process.env.TEST_PASSWORD;

      // 테스트 계정 환경 변수가 없으면 로그인 불가
      if (!validUser || !validPass) {
        return done(null, false, { message: '테스트 계정이 설정되지 않았습니다.' });
      }
      if (username === validUser && password === validPass) {
        // isTest: true — 이 플래그로 작성 글의 자동 삭제 여부를 결정
        return done(null, { id: 'test', username, isTest: true });
      }
      return done(null, false, { message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
  )
);

// 세션에 전체 사용자 객체 저장 (isTest 플래그 보존)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((data, done) => {
  // 구버전 세션 호환 (Discord ID 문자열이 저장된 경우)
  if (typeof data !== 'object') return done(null, { id: data, isTest: false });
  done(null, data);
});

export default passport;
