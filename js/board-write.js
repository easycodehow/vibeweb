import { supabase } from './supabase.js';

const btnLogin = document.getElementById('btnLogin');
const writeForm = document.getElementById('writeForm');
const postTitle = document.getElementById('postTitle');
const postContent = document.getElementById('postContent');
const writeMsg = document.getElementById('writeMsg');

let currentSession = null;

// 로그인 상태 감지
supabase.auth.onAuthStateChange((event, session) => {
  currentSession = session;

  if (!session) {
    window.location.href = 'login.html';
  } else {
    btnLogin.textContent = '로그아웃';
    btnLogin.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = 'index.html';
    };
  }
});

// 저장
writeForm.addEventListener('submit', async () => {
  const title = postTitle.value.trim();
  const content = postContent.value.trim();

  if (!title) { writeMsg.textContent = '제목을 입력해주세요.'; postTitle.focus(); return; }
  if (!content) { writeMsg.textContent = '내용을 입력해주세요.'; postContent.focus(); return; }

  writeMsg.textContent = '';
  const btn = writeForm.querySelector('.btn-save');
  btn.disabled = true;
  btn.textContent = '저장 중...';

  const { error } = await supabase.from('posts').insert({
    title,
    content,
    author_id: currentSession.user.id,
    author_email: currentSession.user.email,
  });

  if (error) {
    writeMsg.textContent = '저장 중 오류가 발생했습니다.';
    btn.disabled = false;
    btn.textContent = '저장';
    return;
  }

  window.location.href = 'board.html';
});
