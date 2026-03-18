import { supabase } from './supabase.js';

const params  = new URLSearchParams(location.search);
const editId  = params.get('id');
const isEdit  = !!editId;

const btnLogin      = document.getElementById('btnLogin');
const writeForm     = document.getElementById('writeForm');
const postTitle     = document.getElementById('postTitle');
const postContent   = document.getElementById('postContent');
const writeMsg      = document.getElementById('writeMsg');
const formTitle     = document.getElementById('formTitle');
const btnSave       = writeForm.querySelector('.btn-save');
const btnCancel     = document.getElementById('btnCancel');
const postFileInput = document.getElementById('postFile');
const fileListEl    = document.getElementById('fileList');

if (isEdit) {
  formTitle.textContent = '공지 수정';
  btnSave.textContent   = '수정';
  btnCancel.href        = `notice-detail.html?id=${editId}`;
}

let currentSession = null;
let newFiles       = [];
let existingFiles  = [];
let deletedIds     = new Set();

async function checkAdmin(email) {
  if (!email) return false;
  const { data } = await supabase.from('admins').select('id').eq('email', email).single();
  return !!data;
}

supabase.auth.onAuthStateChange((event, session) => {
  currentSession = session;
  if (session) {
    btnLogin.textContent = '로그아웃';
    btnLogin.onclick = async () => { await supabase.auth.signOut(); location.href = 'index.html'; };
  }
});

async function setupPage() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    location.href = 'login.html';
    return;
  }

  currentSession = session;

  const admin = await checkAdmin(session.user.email);
  if (!admin) {
    alert('관리자만 접근할 수 있습니다.');
    location.href = 'notice.html';
    return;
  }

  if (isEdit) loadPost();
}

setupPage();

async function loadPost() {
  const { data, error } = await supabase
    .from('posts')
    .select('title, content')
    .eq('id', editId)
    .single();

  if (error || !data) {
    alert('게시글을 찾을 수 없습니다.');
    location.href = 'notice.html';
    return;
  }

  postTitle.value   = data.title;
  postContent.value = data.content;

  await loadExistingAttachments();
}

async function loadExistingAttachments() {
  const { data, error } = await supabase
    .from('attachments')
    .select('id, file_name, file_url')
    .eq('post_id', editId);

  if (error || !data) return;

  existingFiles = data;
  renderFileList();
}

function renderFileList() {
  fileListEl.innerHTML = '';

  existingFiles.forEach(f => {
    if (deletedIds.has(f.id)) return;
    const li = document.createElement('li');
    li.className = 'file-item';

    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.file_name);
    if (isImage) {
      const img = document.createElement('img');
      img.src = f.file_url;
      img.className = 'file-preview';
      li.appendChild(img);
    }

    li.innerHTML += `
      <span class="file-name">${escapeHtml(f.file_name)}</span>
      <button type="button" class="btn-file-remove">✕</button>
    `;
    li.querySelector('.btn-file-remove').addEventListener('click', () => {
      deletedIds.add(f.id);
      renderFileList();
    });
    fileListEl.appendChild(li);
  });

  newFiles.forEach((f, idx) => {
    const li = document.createElement('li');
    li.className = 'file-item';

    if (f.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(f);
      img.className = 'file-preview';
      li.appendChild(img);
    }

    li.innerHTML += `
      <span class="file-name">${escapeHtml(f.name)}</span>
      <button type="button" class="btn-file-remove">✕</button>
    `;
    li.querySelector('.btn-file-remove').addEventListener('click', () => {
      newFiles.splice(idx, 1);
      renderFileList();
    });
    fileListEl.appendChild(li);
  });
}

postFileInput.addEventListener('change', () => {
  const MAX = 10 * 1024 * 1024;
  const selected = Array.from(postFileInput.files);
  const oversized = selected.filter(f => f.size > MAX);

  if (oversized.length > 0) {
    writeMsg.textContent = `파일 크기 초과 (최대 10MB): ${oversized.map(f => f.name).join(', ')}`;
    postFileInput.value = '';
    return;
  }

  newFiles = newFiles.concat(selected);
  postFileInput.value = '';
  renderFileList();
});

writeForm.addEventListener('submit', async () => {
  const title   = postTitle.value.trim();
  const content = postContent.value.trim();

  if (!title)   { writeMsg.textContent = '제목을 입력해주세요.';   postTitle.focus();   return; }
  if (!content) { writeMsg.textContent = '내용을 입력해주세요.';   postContent.focus(); return; }

  writeMsg.textContent = '';
  btnSave.disabled     = true;
  btnSave.textContent  = isEdit ? '수정 중...' : '저장 중...';

  let postId = editId;

  if (isEdit) {
    const { error } = await supabase
      .from('posts')
      .update({ title, content })
      .eq('id', editId);

    if (error) { showError('저장 중 오류가 발생했습니다.'); return; }
  } else {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title,
        content,
        category:     'notice',
        author_id:    currentSession.user.id,
        author_email: currentSession.user.email,
      })
      .select('id')
      .single();

    if (error || !data) { showError('저장 중 오류가 발생했습니다.'); return; }
    postId = data.id;
  }

  // 기존 첨부파일 삭제
  if (deletedIds.size > 0) {
    const toDelete = existingFiles.filter(f => deletedIds.has(f.id));
    for (const f of toDelete) {
      const storagePath = f.file_url.split('/post-attachments/')[1];
      if (storagePath) await supabase.storage.from('post-attachments').remove([storagePath]);
    }
    await supabase.from('attachments').delete().in('id', [...deletedIds]);
  }

  // 새 파일 업로드
  for (const file of newFiles) {
    const filePath = `${postId}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from('post-attachments')
      .upload(filePath, file);

    if (upErr) {
      writeMsg.textContent = `파일 업로드 실패: ${file.name}`;
      continue;
    }

    const { data: urlData } = supabase.storage.from('post-attachments').getPublicUrl(filePath);

    await supabase.from('attachments').insert({
      post_id:   postId,
      file_name: file.name,
      file_url:  urlData.publicUrl,
    });
  }

  location.href = isEdit ? `notice-detail.html?id=${editId}` : 'notice.html';
});

function showError(msg) {
  writeMsg.textContent = msg;
  btnSave.disabled     = false;
  btnSave.textContent  = isEdit ? '수정' : '저장';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
