import { supabase } from './supabase.js';

const PAGE_SIZE = 10;
let currentPage = 1;
let totalCount = 0;
let currentId = null;
let currentIsRead = false;

const btnLogin = document.getElementById('btnLogin');

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    btnLogin.textContent = '로그아웃';
    btnLogin.onclick = async () => { await supabase.auth.signOut(); window.location.href = 'login.html'; };
  } else {
    btnLogin.textContent = '로그인';
    btnLogin.onclick = () => { window.location.href = 'login.html'; };
  }
});

async function init() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    document.getElementById('accessDenied').style.display = 'flex';
    return;
  }

  const { data: adminData } = await supabase
    .from('admins')
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!adminData) {
    document.getElementById('accessDenied').style.display = 'flex';
    return;
  }

  document.getElementById('adminWrap').style.display = '';
  loadContacts(1);
}

async function loadContacts(page) {
  const tbody = document.getElementById('contactList');
  tbody.innerHTML = '<tr><td colspan="6" class="board-empty">불러오는 중...</td></tr>';

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    tbody.innerHTML = '<tr><td colspan="6" class="board-empty">불러올 수 없습니다.</td></tr>';
    return;
  }

  totalCount = count || 0;
  document.getElementById('totalCount').textContent = totalCount;

  // 미읽음 카운트
  const { count: unreadCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  document.getElementById('unreadCount').textContent = unreadCount || 0;

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="board-empty">문의가 없습니다.</td></tr>';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  tbody.innerHTML = data.map((c, i) => {
    const rowNum = totalCount - (page - 1) * PAGE_SIZE - i;
    const preview = escapeHtml(c.message.length > 40 ? c.message.slice(0, 40) + '…' : c.message);
    const readBadge = c.is_read
      ? '<span class="badge-read">읽음</span>'
      : '<span class="badge-unread">미읽음</span>';
    const rowClass = c.is_read ? '' : 'row-unread';
    return `
      <tr class="${rowClass}" style="cursor:pointer;" onclick="openModal('${c.id}', ${c.is_read})">
        <td>${rowNum}</td>
        <td class="col-title">${preview}</td>
        <td>${escapeHtml(c.name || '익명')}</td>
        <td>${escapeHtml(c.email || '-')}</td>
        <td>${formatDate(c.created_at)}</td>
        <td>${readBadge}</td>
      </tr>`;
  }).join('');

  renderPagination(page);
}

function renderPagination(activePage) {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages <= 1) { document.getElementById('pagination').innerHTML = ''; return; }

  const setStart = Math.floor((activePage - 1) / 10) * 10 + 1;
  const setEnd   = Math.min(setStart + 9, totalPages);

  let html = '';
  html += `<button class="page-btn nav" ${setStart === 1 ? 'disabled' : ''} onclick="goPage(${setStart - 10})">‹</button>`;
  for (let i = setStart; i <= setEnd; i++) {
    html += `<button class="page-btn ${i === activePage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn nav" ${setEnd === totalPages ? 'disabled' : ''} onclick="goPage(${setStart + 10})">›</button>`;
  document.getElementById('pagination').innerHTML = html;
}

window.goPage = function(page) {
  if (page < 1) return;
  currentPage = page;
  loadContacts(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openModal = async function(id, isRead) {
  const { data, error } = await supabase.from('contacts').select('*').eq('id', id).single();
  if (error || !data) return;

  currentId = id;
  currentIsRead = data.is_read;

  document.getElementById('modalDate').textContent = formatDateFull(data.created_at);
  document.getElementById('modalName').textContent = '이름: ' + (data.name || '익명');
  document.getElementById('modalEmail').textContent = data.email ? '이메일: ' + data.email : '';
  document.getElementById('modalMessage').textContent = data.message;
  document.getElementById('btnMarkRead').textContent = data.is_read ? '미읽음으로 변경' : '읽음 처리';

  document.getElementById('modalOverlay').classList.add('active');

  // 자동 읽음 처리
  if (!data.is_read) {
    await supabase.from('contacts').update({ is_read: true }).eq('id', id);
    currentIsRead = true;
    document.getElementById('btnMarkRead').textContent = '미읽음으로 변경';
  }
};

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('active');
  loadContacts(currentPage);
};

window.toggleRead = async function() {
  const newVal = !currentIsRead;
  await supabase.from('contacts').update({ is_read: newVal }).eq('id', currentId);
  currentIsRead = newVal;
  document.getElementById('btnMarkRead').textContent = newVal ? '미읽음으로 변경' : '읽음 처리';
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

function formatDateFull(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

init();
