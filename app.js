/* ============================================================
   LACOOPEAR × QBM — Firebase + Funcionalidad Completa
   ============================================================ */
'use strict';

(function () {
  /* ----------------------------------------------------------
     Configuración
     ---------------------------------------------------------- */
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = id => document.getElementById(id);

  /* DOM */
  var grid = $('grid');
  var filters = $('filters');
  var searchInput = $('search');
  var empty = $('empty');
  var loginBtn = $('loginBtn');
  var createBtn = $('createBtn');
  var logoutBtn = $('logoutBtn');
  var loginModal = $('loginModal');
  var createModal = $('createModal');
  var loginUser = $('loginUser');
  var loginPass = $('loginPass');
  var loginErr = $('loginErr');
  var toast = $('toast');

  var typeSeg = $('typeSeg');
  var fTitle = $('fTitle');
  var fImage = $('fImage');
  var imgPreview = $('imgPreview');
  var fVideo = $('fVideo');
  var fPoster = $('fPoster');
  var posterDrop = $('posterDrop');
  var fCopy = $('fCopy');
  var fH3 = $('fH3');
  var fDesc = $('fDesc');
  var linkList = $('linkList');
  var createTitle = $('createTitle');

  var currentType = 'estatico';
  var editId = null;
  var pendingImg = null;
  var pendingPoster = null;

  let allPosts = [];

  /* ----------------------------------------------------------
     Firebase
     ---------------------------------------------------------- */
  async function loadPosts() {
    try {
      const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
      allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render();
    } catch (e) {
      console.error(e);
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
      showToast(editId ? 'Posteo actualizado' : 'Posteo creado');
      editId = null;
      await loadPosts();
      closeModal(createModal);
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Error al guardar en Firebase');
    }
  }

  async function deletePost(id) {
    if (!confirm('¿Eliminar este posteo?')) return;
    await db.collection('posts').doc(id).delete();
    await loadPosts();
  }

  /* ----------------------------------------------------------
     Utilidades
     ---------------------------------------------------------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function isAuthed() { return localStorage.getItem(AUTH_KEY) === '1'; }

  function setAuthUI() {
    const on = isAuthed();
    document.body.classList.toggle('is-admin', on);
    loginBtn.classList.toggle('hidden', on);
    createBtn.classList.toggle('hidden', !on);
    logoutBtn.classList.toggle('hidden', !on);
  }

  function doLogin() {
    if (loginUser.value.trim() === AUTH.user && loginPass.value === AUTH.pass) {
      localStorage.setItem(AUTH_KEY, '1');
      setAuthUI();
      closeModal(loginModal);
      showToast('✅ Modo Admin Activado');
    } else {
      loginErr.classList.remove('hidden');
    }
  }

  function closeModal(m) { m.classList.remove('open'); }
  function openModal(m) { m.classList.add('open'); }

  /* ----------------------------------------------------------
     Formulario Crear / Editar
     ---------------------------------------------------------- */
  function resetForm() {
    editId = null;
    pendingImg = null;
    pendingPoster = null;
    fTitle.value = '';
    fImage.value = '';
    fVideo.value = '';
    fPoster.value = '';
    fCopy.value = '';
    fH3.value = '';
    fDesc.value = '';
    imgPreview.style.display = 'none';
    linkList.innerHTML = '';
  }

  function openCreate(post) {
    resetForm();
    if (post) {
      editId = post.id;
      createTitle.textContent = 'Editar posteo';
      currentType = post.type;
      // Cargar datos existentes (simplificado)
    } else {
      createTitle.textContent = 'Nuevo posteo';
    }
    openModal(createModal);
  }

  /* Save Button */
  $('saveBtn').addEventListener('click', function () {
    const post = { type: currentType };

    if (currentType !== 'tendencias') post.title = fTitle.value.trim();

    if (currentType === 'estatico') {
      if (!pendingImg) return alert('Debes agregar una imagen');
      post.img = pendingImg;
      post.desc = fDesc.value.trim();
    } else if (currentType === 'video') {
      post.video = fVideo.value.trim();
      post.poster = pendingPoster || fPoster.value.trim();
      post.desc = fDesc.value.trim();
      if (!post.video) return alert('Ingresa el enlace o archivo del video');
    } else if (currentType === 'copy') {
      post.text = fCopy.value.trim();
      if (!post.text) return alert('Escribe el texto del copy');
    } else if (currentType === 'tendencias') {
      post.h3 = fH3.value.trim();
      if (!post.h3) return alert('Escribe el encabezado');
    }

    savePost(post);
  });

  /* ----------------------------------------------------------
     Render básico (puedes mejorarlo después)
     ---------------------------------------------------------- */
  function render() {
    grid.innerHTML = '';
    allPosts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-admin">
          <button class="edit">✎</button>
          <button class="del">🗑</button>
        </div>
        <div class="card-foot">
          <span class="card-tag">${LABELS[post.type]}</span>
          <p class="card-title">${post.title || ''}</p>
        </div>`;
      card.querySelector('.edit').addEventListener('click', () => openCreate(post));
      card.querySelector('.del').addEventListener('click', () => deletePost(post.id));
      grid.appendChild(card);
    });
  }

  /* ----------------------------------------------------------
     Arranque
     ---------------------------------------------------------- */
  setAuthUI();
  if (typeof db !== "undefined") loadPosts();

  loginBtn.addEventListener('click', () => openModal(loginModal));
  $('loginSubmit').addEventListener('click', doLogin);
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
  });
  createBtn.addEventListener('click', () => openCreate(null));

  console.log("✅ LACOOPEAR cargado con Firebase + Formulario");
})();