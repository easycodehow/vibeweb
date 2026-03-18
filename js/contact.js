import { supabase } from './supabase.js';

const form = document.getElementById('contactForm');
const msgEl = document.getElementById('contactMsg');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name    = document.getElementById('contactName').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  const email   = document.getElementById('contactEmail').value.trim();

  if (!message) {
    msgEl.style.color = '#E07B39';
    msgEl.textContent = '메시지를 입력해 주세요.';
    return;
  }

  const btn = form.querySelector('.btn-submit');
  btn.disabled = true;
  btn.textContent = '전송 중...';
  msgEl.textContent = '';

  const { error } = await supabase.from('contacts').insert({
    name: name || null,
    message,
    email: email || null,
  });

  if (error) {
    msgEl.style.color = '#E07B39';
    msgEl.textContent = '전송에 실패했습니다. 다시 시도해 주세요.';
    btn.disabled = false;
    btn.textContent = '문의 보내기';
    return;
  }

  msgEl.style.color = '#3a7c3a';
  msgEl.textContent = '문의가 접수되었습니다. 감사합니다!';
  form.reset();
  btn.disabled = false;
  btn.textContent = '문의 보내기';
});
