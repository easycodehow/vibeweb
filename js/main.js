import { supabase } from './supabase.js';

// ── 최근 게시물 (인덱스 페이지) ──
async function loadRecentPosts() {
  const container = document.getElementById('recentPosts');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, author_email, created_at, views')
      .eq('category', 'free')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="board-item"><span class="post-title-link">아직 게시글이 없습니다.</span></div>';
      return;
    }

    container.innerHTML = data.map((post, i) => `
      <div class="board-item">
        <span class="post-num">${i + 1}</span>
        <a href="board-detail.html?id=${post.id}" class="post-title-link">${escapeHtml(post.title)}</a>
        <span class="post-date">${formatDate(post.created_at)}</span>
      </div>`).join('');
  } catch {
    container.innerHTML = '<div class="board-item"><span class="post-title-link">게시글을 불러올 수 없습니다.</span></div>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

loadRecentPosts();
loadRecentNotices();

async function loadRecentNotices() {
  const container = document.getElementById('recentNotices');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('category', 'notice')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="board-item"><span class="post-title-link">아직 공지사항이 없습니다.</span></div>';
      return;
    }

    container.innerHTML = data.map((post, i) => `
      <div class="board-item">
        <span class="post-num">${i + 1}</span>
        <a href="notice-detail.html?id=${post.id}" class="post-title-link">${escapeHtml(post.title)}</a>
        <span class="post-date">${formatDate(post.created_at)}</span>
      </div>`).join('');
  } catch {
    container.innerHTML = '<div class="board-item"><span class="post-title-link">공지사항을 불러올 수 없습니다.</span></div>';
  }
}

// 헤더 로그인/로그아웃 버튼
const btnLogin = document.getElementById('btnLogin');
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    btnLogin.textContent = '로그아웃';
    btnLogin.onclick = async () => {
      await supabase.auth.signOut();
      window.location.reload();
    };
  } else {
    btnLogin.textContent = '로그인';
    btnLogin.onclick = () => { window.location.href = 'login.html'; };
  }
});
