import pool from '../config/db.js';
import { marked } from 'marked';
import hljs from 'highlight.js';

// GitHub Flavored Markdown 활성화, 줄바꿈(\n)을 <br>로 변환
marked.use({ gfm: true, breaks: true });

// 코드 블록 렌더러 커스터마이징: highlight.js로 구문 강조 적용
const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }) {
  // 지정된 언어가 highlight.js에 없으면 'plaintext'로 폴백
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext';
  const highlighted = hljs.highlight(text, { language }).value;
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
};
marked.use({ renderer });

// 한 페이지에 표시할 게시글 수
const PAGE_SIZE = 10;

// 공개 포스트 목록 (published=1, 만료되지 않은 글만, 페이지네이션)
export async function listPosts(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    // offset 계산 후 확실하게 정수형(Number)으로 확정 지어줍니다.
    const offset = Number((page - 1) * PAGE_SIZE);
    const limit = Number(PAGE_SIZE);

    // 전체 공개 포스트 수를 먼저 조회하여 총 페이지 수 계산
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM posts WHERE published = 1 AND (expires_at IS NULL OR expires_at > NOW())'
    );
    const totalPages = Math.ceil(total / PAGE_SIZE);

    // 쿼리 매개변수에 명시적으로 형변환된 limit과 offset을 넣습니다.
    // content 전체 대신 앞 200자만 excerpt로 반환하여 목록 응답 크기 최소화
    const [posts] = await pool.query(
      'SELECT id, title, slug, content_type, LEFT(content, 200) AS excerpt, created_at FROM posts WHERE published = 1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({ posts, page, totalPages });
  } catch (err) {
    next(err);
  }
}

// "{slug}.{id}" 형식의 파라미터에서 ID(숫자)와 slug를 분리합니다.
// 마지막 점(.) 뒤가 순수 숫자면 ID로, 그렇지 않으면 전체를 slug로 처리합니다.
// 예: "hello-world.42" → { id: 42, slug: "hello-world" }
//     "my.post.title"  → { id: null, slug: "my.post.title" }
function parseSlugId(param) {
  const lastDot = param.lastIndexOf('.');
  if (lastDot !== -1) {
    const tail = param.slice(lastDot + 1);
    if (/^\d+$/.test(tail)) {
      return { id: parseInt(tail, 10), slug: param.slice(0, lastDot) };
    }
  }
  return { id: null, slug: param };
}

// 공개 포스트 단건 조회
// ID가 있으면 ID로 조회 (slug는 SEO용 장식), 없으면 slug로 조회 (하위 호환)
export async function getPost(req, res, next) {
  try {
    const { id, slug } = parseSlugId(req.params.slug);

    // ID가 있으면 ID로 조회 (slug는 SEO용 장식), 없으면 slug로 조회 (하위 호환)
    const [rows] = await pool.query(
      id !== null
        ? 'SELECT * FROM posts WHERE id = ? AND published = 1 AND (expires_at IS NULL OR expires_at > NOW())'
        : 'SELECT * FROM posts WHERE slug = ? AND published = 1 AND (expires_at IS NULL OR expires_at > NOW())',
      [id ?? slug]
    );
    if (!rows.length) return res.status(404).json({ error: '포스트를 찾을 수 없습니다.' });

    const post = rows[0];
    // markdown 타입인 경우 HTML로 변환, html 타입은 그대로 반환
    post.renderedContent = post.content_type === 'markdown' ? marked(post.content) : post.content;

    res.json({ post });
  } catch (err) {
    next(err);
  }
}
