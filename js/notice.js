import { supabase } from './supabase.js';

const PAGE_SIZE = 10;
let currentPage = 1;
let totalCount = 0;
let searchQuery = { type: 'title', keyword: '' };

const btnLogin = document.getElementById('btnLogin');
const btnWrite = document.getElementById('btnWrite');

async function checkAdmin(email) {
  if (!email) return false;
  const { data } = await supabase.from('admins').select('id').eq('email', email).single();
  return !!data;
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    btnLogin.textContent = '로그아웃';
    btnLogin.onclick = async () => { await supabase.auth.signOut(); window.location.reload(); };
  } else {
    btnLogin.textContent = '로그인';
    btnLogin.onclick = () => { window.location.href = 'login.html'; };
    btnWrite.style.display = 'none';
  }
});

async function setupAdminBtn() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const admin = await checkAdmin(session.user.email);
  if (admin) {
    btnWrite.style.display = '';
    btnWrite.onclick = () => { window.location.href = 'notice-write.html'; };
  }
}

setupAdminBtn();

async function loadPosts(page = 1) {
  const tbody = document.getElementById('postList');
  tbody.innerHTML = '<tr><td colspan="5" class="board-empty">불러오는 중...</td></tr>';

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  try {
    let query = supabase
      .from('posts')
      .select('id, title, author_email, created_at, views', { count: 'exact' })
      .eq('category', 'notice')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (searchQuery.keyword) {
      if (searchQuery.type === 'title')   query = query.ilike('title', `%${searchQuery.keyword}%`);
      if (searchQuery.type === 'content') query = query.ilike('content', `%${searchQuery.keyword}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    totalCount = count || 0;
    document.getElementById('totalCount').textContent = totalCount;

    if (!data || data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="board-empty">공지사항이 없습니다.</td></tr>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = data.map(post => `
      <tr>
        <td>${post.id}</td>
        <td class="col-title">
          <a href="notice-detail.html?id=${post.id}">${escapeHtml(post.title)}</a>
        </td>
        <td>${escapeHtml(post.author_email ? post.author_email.split('@')[0] : '관리자')}</td>
        <td>${formatDate(post.created_at)}</td>
        <td>${post.views || 0}</td>
      </tr>`).join('');

    renderPagination(page);
  } catch {
    tbody.innerHTML = '<tr><td colspan="5" class="board-empty">게시글을 불러올 수 없습니다.</td></tr>';
  }
}

function renderPagination(activePage) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1) { document.getElementById('pagination').innerHTML = ''; return; }

  const setStart = Math.floor((activePage - 1) / 10) * 10 + 1;
  const setEnd   = Math.min(setStart + 9, totalPages);

  let html = '';
  html += `<button class="page-btn nav" ${setStart === 1 ? 'disabled' : ''} onclick="goPageSet(${setStart - 10})">‹</button>`;
  for (let i = setStart; i <= setEnd; i++) {
    html += `<button class="page-btn ${i === activePage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn nav" ${setEnd === totalPages ? 'disabled' : ''} onclick="goPageSet(${setStart + 10})">›</button>`;

  document.getElementById('pagination').innerHTML = html;
}

window.goPage = function(page) {
  currentPage = page;
  loadPosts(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.goPageSet = function(page) {
  if (page < 1) return;
  goPage(page);
};

window.handleSearch = function(e) {
  e.preventDefault();
  searchQuery.type    = document.getElementById('searchType').value;
  searchQuery.keyword = document.getElementById('searchInput').value.trim();
  currentPage = 1;
  loadPosts(1);
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

loadPosts(1);
