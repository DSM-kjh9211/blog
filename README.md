# Blog

## 소개

이 프로젝트는 실제 구동을 가정하여 제작된 프로젝트 입니다. 따라서 이 프로젝트엔 백엔드 코드가 포함되어있습니다.

## 구성

```tree
|   .env.example - 비밀정보작성방법
|   .gitignore - git이 무시할 파일 나열
|   app.js - 백엔드 메인코드
|   init-db.sql - 백엔드에 필요한 DB 설정 SQL문
|   mcp-server.js - ai 어시스턴트를 위한 mcp 서버(이 부분은 ai가 작업을 도와줌)
|   package-lock.json - 세부 종속성 파일
|   package.json - 프로젝트 정보 파일
|   README.md - 이 파일
|
+---config
|       cleanup.js - 삭제작업을 지우는 함수
|       db.js - 백엔드중, DB와 직접 연결하는 부분
|       passport.js - 로그인 관련 코드(Discord OAuth2, Local)
|       upload.js - 파일 업로드 제한 설정
|
+---controllers
|       adminController.js - 각종 관리자 도구를 위한 함수
|       publicController.js - 각종 공개 사용자 도구를 위한 함수
|
+---middleware
|       auth.js - 인증이 필요한지 확인 후 인증페이지로 fallback 또는 응답하는 함수
|
+---pages
|   |   404.html - 404응답때에 사용할 페이지
|   |   index.html - 글 목록 페이지
|   |   post.html - 글 내용 페이지
|   |
|   \---admin
|           index.html - 관리자 페이지
|           login.html - 로그인 페이지
|           post-form.html - 새 글 작성 페이지
|
+---public
|   +---css
|   |       style.css - 각종 css
|   |
|   +---js
|   |       editor.js - 글 작성기 부분 코드
|   |
|   \---uploads
|           .gitkeep - 폴더 추척용
|
\---routes
        admin.js - 관리자 페이지 연결을 위한 코드
        api.js - 일반 사용자 페이지 연결을 위한 코드
```

## 사용한 라이브러리

### BE

dotenv@17.4.2<br>
express-session@1.19.0<br>
express@5.2.1<br>
highlight.js@11.11.1<br>
marked@18.0.4<br>
multer@2.1.1<br>
mysql2@3.22.3<br>
nodemon@3.1.14<br>
passport-discord-auth@1.2.0<br>
passport-local@1.0.0<br>
passport@0.7.0<br>
zod@4.4.3

### AI

@modelcontextprotocol/sdk@1.29.0
