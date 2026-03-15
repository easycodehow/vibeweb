import { supabase } from './supabase.js';

const form     = document.getElementById('signupForm');
const msgEl    = document.getElementById('authMsg');

form.addEventListener('submit', async () => {
  const email    = document.getElementById('email').value.trim();
  const nickname = document.getElementById('nickname').value.trim();
  const password = document.getElementById('password').value;
  const confirm  = document.getElementById('passwordConfirm').value;

  // 입력값 검증
  if (!email || !nickname || !password || !confirm) {
    msgEl.textContent = '모든 항목을 입력해 주세요.';
    return;
  }
  if (password.length < 6) {
    msgEl.textContent = '비밀번호는 6자 이상이어야 합니다.';
    return;
  }
  if (password !== confirm) {
    msgEl.textContent = '비밀번호가 일치하지 않습니다.';
    return;
  }

  msgEl.textContent = '';

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname }
    }
  });

  if (error) {
    msgEl.textContent = '회원가입 실패: ' + error.message;
    return;
  }

  alert('회원가입이 완료되었습니다! 이메일을 확인해 인증을 완료해 주세요.');
  window.location.href = 'login.html';
});
