/* ============================================================
   LACOOPEAR × QBM — app.js
   ============================================================ */
'use strict';

(function () {
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = id => document.getElementById(id);

  var grid        = $('grid');
  var loginBtn    = $('loginBtn');
  var createBtn   = $('createBtn');
  var logoutBtn   = $('logoutBtn');
  var loginModal  = $('loginModal');
  var createModal = $('createModal');
  var loginUser   = $('loginUser');
  var loginPass   = $('loginPass');
  var loginErr    = $('loginErr');
  var toast       = $('toast');
  var emptyMsg    = $('empty');

  var typeSeg    = $('typeSeg');
  var fTitle     = $('fTitle');
  var fImage     = $('fImage');
  var fImageUrl  = $('fImageUrl');
  var imgPreview = $('imgPreview');
  var fVideo     = $('fVideo');
  var fPoster    = $('fPoster');
  var fCopy      = $('fCopy');
  var fH3        = $('fH3');
  var fDesc      = $('fDesc');
  var linkList   = $('linkList');

  var currentType   = 'estatico';
  var editId        = null;
  var pendingImg    = null;
  var pendingPoster = null;
  var trendLinks    = [];

  var allPosts     = [];
  var activeFilter = 'todos';
  var searchTerm   = '';

  /* ── Utilidades ── */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function boldify(text) {
    return escHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  /* ── Auth ── */
  function isAuthed() { return localStorage.getItem(AUTH_KEY) === '1'; }

  function setAuthUI() {
    const on = isAuthed();
    document.body.classList.toggle('is-admin', on);
    loginBtn.classList.toggle('hidden', on);
    createBtn.classList.toggle('hidden', !on);
    logoutBtn.classList.toggle('hidden', !on);
    const exportBtn = $('exportBtn');
    const importBtn = $('importBtn');
    if (exportBtn) exportBtn.classList.toggle('hidden', !on);
    if (importBtn) importBtn.classList.toggle('hidden', !on);
  }

  function doLogin() {
    if (loginUser.value.trim() === AUTH.user && loginPass.value === AUTH.pass) {
      localStorage.setItem(AUTH_KEY, '1');
      setAuthUI();
      closeModal(loginModal);
      render();
      showToast('✅ Modo Admin Activado');
    } else {
      loginErr.classList.remove('hidden');
    }
  }

  function closeModal(m) { m.classList.remove('open'); }
  function openModal(m)  { m.classList.add('open'); }

  /* ── Tipo de tarjeta ── */
  function switchType(type) {
    currentType = type;
    typeSeg.querySelectorAll('[data-type]').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.type === type ? 'true' : 'false');
    });
    document.querySelector('.f-estatico').classList.toggle('hidden', type !== 'estatico');
    document.querySelector('.f-video').classList.toggle('hidden', type !== 'video');
    document.querySelector('.f-copy').classList.toggle('hidden', type !== 'copy');
    document.querySelector('.f-tendencias').classList.toggle('hidden', type !== 'tendencias');
    document.querySelector('.f-title').classList.toggle('hidden', type === 'tendencias');
    document.querySelector('.f-desc').classList.toggle('hidden', type === 'copy' || type === 'tendencias');
  }

  typeSeg.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-type]');
    if (btn) switchType(btn.dataset.type);
  });

  /* ── Firebase ── */
  async function loadPosts() {
    try {
      const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
      allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render();
    } catch (e) {
      console.error('Firebase loadPosts:', e);
      showToast('⚠️ Error al cargar — revisá las reglas de Firestore');
    }
  }

  async function savePost(post) {
    try {
      if (editId) {
        await db.collection('posts').doc(editId).update(post);
      } else {
        post.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('posts').doc().set(post);
      }
      showToast(editId ? '✅ Posteo actualizado' : '✅ Posteo creado');
      editId = null;
      await loadPosts();
      closeModal(createModal);
      resetForm();
    } catch (e) {
      console.error('Firebase savePost:', e);
      showToast('❌ Error al guardar — revisá las reglas de Firestore');
    }
  }

  async function deletePost(id) {
    if (!confirm('¿Eliminar este posteo?')) return;
    try {
      await db.collection('posts').doc(id).delete();
      await loadPosts();
      showToast('Posteo eliminado');
    } catch (e) {
      console.error('Firebase deletePost:', e);
      showToast('❌ Error al eliminar');
    }
  }

  /* ── Guardar posteo ── */
  $('saveBtn').addEventListener('click', function () {
    const post = { type: currentType };

    if (currentType !== 'tendencias') post.title = fTitle.value.trim();
    if (fDesc && fDesc.value.trim() && currentType !== 'copy' && currentType !== 'tendencias') {
      post.desc = fDesc.value.trim();
    }

    if (currentType === 'estatico') {
      if (!pendingImg) return showToast('❌ Debes subir una imagen');
      post.img = pendingImg;

    } else if (currentType === 'video') {
      const v = fVideo.value.trim();
      if (!v) return showToast('❌ Debes ingresar un video o enlace');
      post.video = v;
      if (pendingPoster) post.poster = pendingPoster;
      else if (fPoster.value.trim()) post.poster = fPoster.value.trim();

    } else if (currentType === 'copy') {
      const t = fCopy.value.trim();
      if (!t) return showToast('❌ Debes escribir el texto del copy');
      post.text = t;

    } else if (currentType === 'tendencias') {
      post.h3    = fH3.value.trim();
      post.links = trendLinks.filter(lk => lk.label || lk.url);
    }

    savePost(post);
  });

  /* ── Imagen estático ── */
  var imgSourceTabs = $('imgSourceTabs');
  var imgTabFile    = $('imgTabFile');
  var imgTabUrl     = $('imgTabUrl');
  var activeImgTab  = 'file';

  if (imgSourceTabs) {
    imgSourceTabs.addEventListener('click', function (e) {
      const btn = e.target.closest('.img-tab');
      if (!btn) return;
      activeImgTab = btn.dataset.tab;
      imgSourceTabs.querySelectorAll('.img-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (activeImgTab === 'file') {
        imgTabFile.classList.remove('hidden');
        imgTabUrl.classList.add('hidden');
      } else {
        imgTabFile.classList.add('hidden');
        imgTabUrl.classList.remove('hidden');
      }
      pendingImg = null;
      if (imgPreview) imgPreview.style.display = 'none';
    });
  }

  if (fImage) {
    fImage.addEventListener('change', function () {
      const file = fImage.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        pendingImg = e.target.result;
        if (imgPreview) {
          imgPreview.querySelector('img').src = pendingImg;
          imgPreview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (fImageUrl) {
    fImageUrl.addEventListener('input', function () {
      const url = fImageUrl.value.trim();
      if (url) {
        pendingImg = url;
        if (imgPreview) {
          imgPreview.querySelector('img').src = url;
          imgPreview.style.display = 'block';
        }
      } else {
        pendingImg = null;
        if (imgPreview) imgPreview.style.display = 'none';
      }
    });
  }

  /* ── Poster dropzone ── */
  const posterDrop = $('posterDrop');
  const posterFile = $('posterFile');

  function loadPosterFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      pendingPoster = e.target.result;
      if (posterDrop) {
        const prev = posterDrop.querySelector('.dropzone__preview');
        if (prev) prev.src = pendingPoster;
        posterDrop.classList.add('has-preview');
      }
    };
    reader.readAsDataURL(file);
  }

  if (posterDrop) {
    posterDrop.addEventListener('click', () => posterFile && posterFile.click());
    posterDrop.addEventListener('dragover', e => { e.preventDefault(); posterDrop.classList.add('drag-over'); });
    posterDrop.addEventListener('dragleave', () => posterDrop.classList.remove('drag-over'));
    posterDrop.addEventListener('drop', e => {
      e.preventDefault();
      posterDrop.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) loadPosterFile(file);
    });
    const clearBtn = posterDrop.querySelector('.dropzone__clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', e => {
        e.stopPropagation();
        pendingPoster = null;
        const prev = posterDrop.querySelector('.dropzone__preview');
        if (prev) prev.src = '';
        posterDrop.classList.remove('has-preview');
      });
    }
  }
  if (posterFile) {
    posterFile.addEventListener('change', () => posterFile.files[0] && loadPosterFile(posterFile.files[0]));
  }
  document.addEventListener('paste', e => {
    if (!createModal.classList.contains('open') || currentType !== 'video') return;
    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'));
    if (item) loadPosterFile(item.getAsFile());
  });

  /* ── Tendencias links ── */
  function renderLinkList() {
    if (!linkList) return;
    linkList.innerHTML = '';
    trendLinks.forEach((lk, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
      row.innerHTML =
        `<input class="input" type="text" placeholder="Nombre del enlace" value="${escHtml(lk.label)}" data-i="${i}" data-field="label" style="flex:1" />` +
        `<input class="input" type="url" placeholder="https://..." value="${escHtml(lk.url)}" data-i="${i}" data-field="url" style="flex:2" />` +
        `<button type="button" class="btn btn--sm" data-del="${i}" style="flex-shrink:0">×</button>`;
      linkList.appendChild(row);
    });
  }

  if (linkList) {
    linkList.addEventListener('input', e => {
      const el = e.target;
      const i = parseInt(el.dataset.i, 10);
      if (!isNaN(i) && el.dataset.field) trendLinks[i][el.dataset.field] = el.value;
    });
    linkList.addEventListener('click', e => {
      const btn = e.target.closest('[data-del]');
      if (btn) { trendLinks.splice(parseInt(btn.dataset.del, 10), 1); renderLinkList(); }
    });
  }

  const addLinkBtn = $('addLink');
  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => { trendLinks.push({ label: '', url: '' }); renderLinkList(); });
  }

  /* ── Reset ── */
  function resetForm() {
    editId = null;
    pendingImg = null;
    pendingPoster = null;
    trendLinks = [];
    fTitle.value = '';
    if (fImage)    fImage.value    = '';
    if (fImageUrl) fImageUrl.value = '';
    activeImgTab = 'file';
    if (imgTabFile) imgTabFile.classList.remove('hidden');
    if (imgTabUrl)  imgTabUrl.classList.add('hidden');
    if (imgSourceTabs) {
      imgSourceTabs.querySelectorAll('.img-tab').forEach((b, i) => {
        if (i === 0) b.classList.add('active'); else b.classList.remove('active');
      });
    }
    if (fVideo)  fVideo.value  = '';
    if (fPoster) fPoster.value = '';
    if (fCopy)   fCopy.value   = '';
    if (fH3)     fH3.value     = '';
    if (fDesc)   fDesc.value   = '';
    if (imgPreview) imgPreview.style.display = 'none';
    if (posterDrop) {
      posterDrop.classList.remove('has-preview');
      const prev = posterDrop.querySelector('.dropzone__preview');
      if (prev) prev.src = '';
    }
    renderLinkList();
    switchType('estatico');
  }

  /* ── Render ── */
  function videoEmbed(url, poster) {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\\w-]{11})/);
    if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
    const posterAttr = poster ? ` poster="${escHtml(poster)}"` : '';
    return `<video src="${escHtml(url)}"${posterAttr} controls muted playsinline preload="metadata"></video>`;
  }

  function buildCardHTML(post) {
    const admin = isAuthed()
      ? `<div class="card-admin-btns"><button class="btn btn--sm card-edit-btn" data-edit="${post.id}" title="Editar">✏️</button><button class="btn btn--sm" data-delete="${post.id}" title="Eliminar">🗑</button></div>`
      : '';

    if (post.type === 'estatico') {
      return `${admin}
        <div class="media"><img src="${escHtml(post.img)}" alt="${escHtml(post.title)}" loading="lazy" /></div>
        <div class="card-foot">
          <span class="card-tag">${LABELS.estatico}</span>
          ${post.title ? `<p class="card-title">${escHtml(post.title)}</p>` : ''}
        </div>`;
    }
    if (post.type === 'video') {
      return `${admin}
        <div class="media">${videoEmbed(post.video, post.poster)}</div>
        <div class="card-foot">
          <span class="card-tag">${LABELS.video}</span>
          ${post.title ? `<p class="card-title">${escHtml(post.title)}</p>` : ''}
        </div>`;
    }
    if (post.type === 'copy') {
      return `${admin}
        <div class="copy-body"><p class="copy-text">${boldify(post.text)}</p></div>
        <div class="card-foot">
          <span class="card-tag">${LABELS.copy}</span>
          ${post.title ? `<p class="card-title">${escHtml(post.title)}</p>` : ''}
        </div>`;
    }
    if (post.type === 'tendencias') {
      const links = Array.isArray(post.links) ? post.links : [];
      const linksHTML = links.map(lk =>
        `<li><a href="${escHtml(lk.url)}" target="_blank" rel="noopener"><span class="lnk">${escHtml(lk.label)}</span></a></li>`
      ).join('');
      return `${admin}
        <div class="trend-body">
          ${post.h3 ? `<h3>${escHtml(post.h3)}</h3>` : ''}
          ${linksHTML ? `<ul class="trend-links">${linksHTML}</ul>` : ''}
        </div>
        <div class="card-foot"><span class="card-tag">${LABELS.tendencias}</span></div>`;
    }
    return '';
  }

  function getCardClass(type) {
    if (type === 'copy')       return 'card card--copy';
    if (type === 'tendencias') return 'card card--tendencias';
    return 'card card--zoom';
  }

  function render() {
    const term = searchTerm.toLowerCase().trim();
    const filtered = allPosts.filter(post => {
      if (activeFilter !== 'todos' && post.type !== activeFilter) return false;
      if (!term) return true;
      return [post.title, post.text, post.h3, post.desc].some(f => f && f.toLowerCase().includes(term));
    });

    grid.innerHTML = '';
    filtered.forEach(post => {
      const card = document.createElement('article');
      card.className = getCardClass(post.type);
      card.dataset.category = post.type;
      card.dataset.postId = post.id;
      card.style.position = 'relative';
      card.style.cursor = 'pointer';
      card.innerHTML = buildCardHTML(post);
      grid.appendChild(card);
    });

    if (emptyMsg) emptyMsg.style.display = filtered.length ? 'none' : '';

    document.querySelectorAll('.filter').forEach(btn => {
      const f = btn.dataset.filter;
      const count = f === 'todos' ? allPosts.length : allPosts.filter(p => p.type === f).length;
      const span = btn.querySelector('.filter__count');
      if (span) span.textContent = count ? `(${count})` : '';
    });

    grid.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); deletePost(btn.dataset.delete); });
    });

    grid.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', e => { e.stopPropagation(); startEdit(btn.dataset.edit); });
    });

    grid.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('[data-delete],[data-edit]')) return;
        const postId = card.dataset.postId;
        if (postId) openDetailModal(postId);
      });
    });
  }

  /* ── Editar post ── */
  function startEdit(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post) return;
    resetForm();
    editId = id;
    $('createTitle').textContent = 'Editar posteo';
    switchType(post.type);
    if (post.title) fTitle.value = post.title;
    if (post.desc && fDesc) fDesc.value = post.desc;

    if (post.type === 'estatico' && post.img) {
      pendingImg = post.img;
      if (post.img.startsWith('data:')) {
        if (imgTabFile) imgTabFile.classList.remove('hidden');
        if (imgTabUrl)  imgTabUrl.classList.add('hidden');
        if (imgSourceTabs) imgSourceTabs.querySelectorAll('.img-tab').forEach((b,i) => { if(i===0) b.classList.add('active'); else b.classList.remove('active'); });
      } else {
        activeImgTab = 'url';
        if (imgTabFile) imgTabFile.classList.add('hidden');
        if (imgTabUrl)  imgTabUrl.classList.remove('hidden');
        if (fImageUrl)  fImageUrl.value = post.img;
        if (imgSourceTabs) imgSourceTabs.querySelectorAll('.img-tab').forEach((b,i) => { if(i===1) b.classList.add('active'); else b.classList.remove('active'); });
      }
      if (imgPreview) { imgPreview.querySelector('img').src = post.img; imgPreview.style.display = 'block'; }
    }
    if (post.type === 'video') {
      if (fVideo) fVideo.value = post.video || '';
      if (post.poster) {
        pendingPoster = post.poster;
        if (fPoster) fPoster.value = post.poster;
      }
    }
    if (post.type === 'copy'  && fCopy) fCopy.value = post.text || '';
    if (post.type === 'tendencias') {
      if (fH3) fH3.value = post.h3 || '';
      trendLinks = Array.isArray(post.links) ? post.links.map(l => ({...l})) : [];
      renderLinkList();
    }
    openModal(createModal);
  }

  /* ── Modal de detalle ── */
  var detailModal = $('detailModal');
  if ($('detailClose')) $('detailClose').addEventListener('click', () => detailModal.classList.remove('open'));
  if (detailModal) detailModal.addEventListener('click', e => { if (e.target === detailModal) detailModal.classList.remove('open'); });

  function openDetailModal(id) {
    const post = allPosts.find(p => p.id === id);
    if (!post || !detailModal) return;
    const body = detailModal.querySelector('.detail-body');

    let mediaHTML = '';
    if (post.type === 'estatico' && post.img) {
      mediaHTML = `<div class="detail-media"><img src="${escHtml(post.img)}" alt="${escHtml(post.title)}" /></div>`;
    } else if (post.type === 'video') {
      mediaHTML = `<div class="detail-media detail-media--video">${videoEmbed(post.video, post.poster)}</div>`;
    } else if (post.type === 'copy') {
      mediaHTML = `<div class="detail-copy"><p class="copy-text">${boldify(post.text)}</p></div>`;
    } else if (post.type === 'tendencias') {
      const links = Array.isArray(post.links) ? post.links : [];
      const linksHTML = links.map(lk =>
        `<li><a href="${escHtml(lk.url)}" target="_blank" rel="noopener"><span class="lnk">${escHtml(lk.label)}</span></a></li>`
      ).join('');
      mediaHTML = `<div class="detail-trend">${post.h3 ? `<h3>${escHtml(post.h3)}</h3>` : ''}${linksHTML ? `<ul class="trend-links">${linksHTML}</ul>` : ''}</div>`;
    }

    const infoHTML = `
      ${post.title ? `<h2 class="detail-title">${escHtml(post.title)}</h2>` : ''}
      ${post.desc  ? `<p  class="detail-desc">${escHtml(post.desc)}</p>`   : ''}
      <span class="card-tag" style="margin-top:10px">${LABELS[post.type]}</span>
    `;

    body.innerHTML = mediaHTML + `<div class="detail-info">${infoHTML}</div>`;
    detailModal.classList.add('open');
  }

  /* ── Filtros ── */
  const filtersBar = $('filters');
  if (filtersBar) {
    filtersBar.addEventListener('click', e => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      filtersBar.querySelectorAll('.filter').forEach(b =>
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false')
      );
      render();
    });
  }

  /* ── Búsqueda ── */
  const searchInput = $('search');
  if (searchInput) {
    searchInput.addEventListener('input', e => { searchTerm = e.target.value; render(); });
  }

  /* ── Exportar / Importar ── */
  const exportBtn = $('exportBtn');
  const importBtn = $('importBtn');
  const importFile = $('importFile');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(allPosts, null, 2));
      a.download = 'lacoopear-respaldo.json';
      a.click();
    });
  }
  if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', async () => {
      const file = importFile.files[0];
      if (!file) return;
      try {
        const posts = JSON.parse(await file.text());
        if (!Array.isArray(posts)) return showToast('❌ Archivo inválido');
        if (!confirm(`¿Importar ${posts.length} posteos?`)) return;
        for (const p of posts) {
          const { id, createdAt, ...data } = p;
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          await db.collection('posts').doc().set(data);
        }
        await loadPosts();
        showToast(`✅ ${posts.length} posteos importados`);
      } catch (e) {
        console.error(e);
        showToast('❌ Error al importar');
      }
    });
  }

  /* ── Arranque ── */
  setAuthUI();

  if (typeof db !== 'undefined') {
    loadPosts();
  } else {
    console.error('Firebase db no disponible');
    showToast('⚠️ Firebase no conectado');
  }

  loginBtn.addEventListener('click', () => { loginErr.classList.add('hidden'); openModal(loginModal); });
  if ($('loginSubmit')) $('loginSubmit').addEventListener('click', doLogin);
  if ($('loginCancel')) $('loginCancel').addEventListener('click', () => closeModal(loginModal));
  if (loginPass) loginPass.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  createBtn.addEventListener('click', () => { resetForm(); $('createTitle').textContent = 'Nuevo posteo'; openModal(createModal); });
  if ($('createCancel')) $('createCancel').addEventListener('click', () => closeModal(createModal));

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
    render();
    showToast('Has salido del modo admin');
  });

  [loginModal, createModal].forEach(modal => {
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(modal); });
  });

  console.log('✅ LACOOPEAR × QBM cargado');
})();