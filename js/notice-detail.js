import { supabase } from './supabase.js';

const params = new URLSearchParams(location.search);
const postId = params.get('id');

if (!postId) location.href = 'notice.html';

const btnLogin   = document.getElementById('btnLogin');
const ownerBtns  = document.getElementById('ownerBtns');
const btnEdit    = document.getElementById('btnEdit');
const btnDelete  = document.getElementById('btnDelete');
const commentWrite = document.getElementById('commentWrite');
const btnComment = document.getElementById('btnComment');

let currentSession = null;
let isAdmin = false;

async function checkAdmin(email) {
  if (!email) return false;
  const { data } = await supabase.from('admins').select('id').eq('email', email).single();
  return !!data;
}

supabase.auth.onAuthStateChange((event, session) => {
  currentSession = session;

  if (session) {
    btnLogin.textContent = '로그아웃';
    btnLogin.onclick = async () => { await supabase.auth.signOut(); location.reload(); };
    commentWrite.style.display = '';
  } else {
    btnLogin.textContent = '로그인';
    btnLogin.onclick = () => { location.href = 'login.html'; };
    commentWrite.style.display = 'none';
    isAdmin = false;
    updateOwnerBtns();
  }
});

async function setupAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  isAdmin = await checkAdmin(session.user.email);
  updateOwnerBtns();
}

setupAdmin();

function updateOwnerBtns() {
  if (isAdmin) {
    ownerBtns.style.display = '';
  } else {
    ownerBtns.style.display = 'none';
  }
}

async function loadPost() {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !data) {
    alert('게시글을 찾을 수 없습니다.');
    location.href = 'notice.html';
    return;
  }

  document.title = `${data.title} — AI바이브웹`;
  document.getElementById('postTitle').textContent  = data.title;
  document.getElementById('postAuthor').textContent = data.author_email ? data.author_email.split('@')[0] : '관리자';
  document.getElementById('postDate').textContent   = formatDate(data.created_at);
  document.getElementById('postViews').textContent  = (data.views || 0) + 1;
  document.getElementById('postBody').innerHTML     = nl2br(escapeHtml(data.content));

  btnEdit.href = `notice-write.html?id=${postId}`;

  supabase.from('posts').update({ views: (data.views || 0) + 1 }).eq('id', postId).then(() => {});
}

btnDelete.addEventListener('click', async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) { alert('삭제 중 오류가 발생했습니다.'); return; }
  location.href = 'notice.html';
});

async function loadComments() {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  const list = document.getElementById('commentList');
  const countEl = document.getElementById('commentCount');

  if (error || !data || data.length === 0) {
    countEl.textContent = '0';
    list.innerHTML = '<div class="no-comments">아직 댓글이 없습니다.</div>';
    return;
  }

  countEl.textContent = data.length;
  list.innerHTML = data.map(c => {
    const isMine = currentSession?.user?.id === c.author_id;
    return `
      <div class="comment-item" data-id="${c.id}">
        <div class="comment-meta">
          <span class="comment-author">${escapeHtml(c.author_email ? c.author_email.split('@')[0] : '익명')}</span>
          <span class="comment-date">${formatDate(c.created_at)}</span>
          ${isMine ? `<button class="comment-delete" onclick="deleteComment(${c.id})">삭제</button>` : ''}
        </div>
        <div class="comment-text">${nl2br(escapeHtml(c.content))}</div>
      </div>`;
  }).join('');
}

btnComment.addEventListener('click', async () => {
  const text = document.getElementById('commentText').value.trim();
  if (!text) { alert('댓글을 입력해주세요.'); return; }
  if (!currentSession) { alert('로그인이 필요합니다.'); return; }

  btnComment.disabled = true;
  const { error } = await supabase.from('comments').insert({
    post_id:      postId,
    content:      text,
    author_id:    currentSession.user.id,
    author_email: currentSession.user.email,
  });
  btnComment.disabled = false;

  if (error) { alert('댓글 등록 중 오류가 발생했습니다.'); return; }
  document.getElementById('commentText').value = '';
  loadComments();
});

window.deleteComment = async function(id) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) { alert('삭제 중 오류가 발생했습니다.'); return; }
  loadComments();
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function nl2br(str) {
  return str.replace(/\n/g, '<br>');
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
}

async function loadAttachments() {
  const { data, error } = await supabase
    .from('attachments')
    .select('id, file_name, file_url')
    .eq('post_id', postId);

  if (error || !data || data.length === 0) return;

  const section = document.getElementById('postAttachments');
  const list    = document.getElementById('attachmentList');

  list.innerHTML = data.map(f => {
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.file_name);

    if (isImage) {
      return `
        <li class="attachment-item">
          <a href="${f.file_url}" target="_blank" class="attachment-image-link">
            <img src="${f.file_url}" alt="${escapeHtml(f.file_name)}" class="attachment-image" />
          </a>
          <a href="${f.file_url}" download="${escapeHtml(f.file_name)}" class="attachment-name">${escapeHtml(f.file_name)}</a>
        </li>`;
    }

    return `
      <li class="attachment-item">
        <span class="attachment-icon">📎</span>
        <a href="${f.file_url}" download="${escapeHtml(f.file_name)}" class="attachment-name">${escapeHtml(f.file_name)}</a>
      </li>`;
  }).join('');

  section.style.display = '';
}

loadPost();
loadComments();
loadAttachments();
