// 텍스트 영역의 현재 커서 위치에 텍스트를 삽입하는 유틸리티 함수
function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  // 선택 영역을 삽입 텍스트로 대체
  textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
  // 커서를 삽입된 텍스트 끝으로 이동
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
  textarea.focus();
}

document.addEventListener('DOMContentLoaded', () => {
  const titleInput = document.getElementById('title');
  const slugDisplay = document.getElementById('slug-display');
  const contentTypeRadios = document.querySelectorAll('input[name="content_type"]');
  const editorHint = document.getElementById('editor-mode-hint');

  // 콘텐츠 타입별 힌트 메시지
  const hints = {
    markdown: '마크다운 형식으로 작성합니다.',
    html: 'HTML 형식으로 작성합니다.',
  };

  // 선택된 콘텐츠 타입에 따라 에디터 힌트 텍스트 업데이트
  function updateHint() {
    const selected = document.querySelector('input[name="content_type"]:checked');
    if (selected && editorHint) {
      editorHint.textContent = hints[selected.value] || '';
    }
  }

  // 라디오 버튼 변경 시마다 힌트 업데이트
  contentTypeRadios.forEach(radio => radio.addEventListener('change', updateHint));
  updateHint();  // 페이지 로드 시 초기값 표시

  // 제목을 URL 친화적인 slug로 변환 (서버의 slugify와 동일한 로직)
  function toSlug(str) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // 이미지 업로드 UI 요소
  const imgBtn = document.getElementById('img-upload-btn');
  const imgInput = document.getElementById('img-file-input');
  const imgStatus = document.getElementById('img-upload-status');
  const contentArea = document.getElementById('content');

  if (imgBtn && imgInput && contentArea) {
    // 업로드 버튼 클릭 시 숨겨진 파일 인풋 트리거
    imgBtn.addEventListener('click', () => imgInput.click());

    imgInput.addEventListener('change', async () => {
      const file = imgInput.files[0];
      if (!file) return;

      // 업로드 중 버튼 비활성화로 중복 전송 방지
      imgBtn.disabled = true;
      imgStatus.textContent = '업로드 중...';

      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await fetch('/admin/api/upload/image', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '업로드 실패');

        // 현재 선택된 콘텐츠 타입에 따라 삽입 태그 형식 결정
        const contentType = document.querySelector('input[name="content_type"]:checked')?.value;
        const tag = contentType === 'html'
          ? `<img src="${data.url}" alt="${file.name}">`   // HTML 형식
          : `![${file.name}](${data.url})`;               // 마크다운 형식

        // 커서 위치에 이미지 태그 삽입
        insertAtCursor(contentArea, tag);
        imgStatus.textContent = '업로드 완료!';
        // 2초 후 상태 메시지 초기화
        setTimeout(() => { imgStatus.textContent = ''; }, 2000);
      } catch (err) {
        imgStatus.textContent = `오류: ${err.message}`;
      } finally {
        imgBtn.disabled = false;
        imgInput.value = '';  // 같은 파일을 다시 업로드할 수 있도록 초기화
      }
    });
  }

  // 신규 포스트일 때만 제목 입력에 따라 slug 자동 생성 (수정 시에는 기존 slug 유지)
  const isNew = document.getElementById('post-form')?.dataset.mode !== 'edit';

  if (titleInput && slugDisplay && isNew) {
    titleInput.addEventListener('input', () => {
      slugDisplay.value = toSlug(titleInput.value);
    });
  }
});
