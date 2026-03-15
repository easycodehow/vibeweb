import { supabase } from './supabase.js';

// ── 최근 게시물 (인덱스 페이지) ──
async function loadRecentPosts() {
  const container = document.getElementById('recentPosts');
  if (!container) return;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, author_id, created_at, views')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    if (!data || data.length === 0) {
      container.innerHTML = `
        <div class="board-list-head">
          <span>번호</span><span>제목</span><span>작성자</span><span>작성일</span><span>조회</span>
        </div>
        <div class="board-no-data">아직 게시글이 없습니다.</div>`;
      return;
    }

    const rows = data.map(post => `
      <div class="board-item">
        <span class="meta">${post.id}</span>
        <span><a href="post.html?id=${post.id}">${escapeHtml(post.title)}</a></span>
        <span class="meta">${escapeHtml(post.author_id || '익명')}</span>
        <span class="meta">${formatDate(post.created_at)}</span>
        <span class="meta">${post.views || 0}</span>
      </div>`).join('');

    container.innerHTML = `
      <div class="board-list-head">
        <span>번호</span><span>제목</span><span>작성자</span><span>작성일</span><span>조회</span>
      </div>
      ${rows}`;
  } catch {
    container.innerHTML = `
      <div class="board-list-head">
        <span>번호</span><span>제목</span><span>작성자</span><span>작성일</span><span>조회</span>
      </div>
      <div class="board-no-data">아직 게시글이 없습니다.</div>`;
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
