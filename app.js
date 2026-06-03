/* ============================================================
   LACOOPEAR × QBM — Firebase Estable
   ============================================================ */
'use strict';

(function () {
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = id => document.getElementById(id);

  var grid = $('grid');
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
  var fCopy = $('fCopy');
  var fH3 = $('fH3');
  var fDesc = $('fDesc');

  var currentType = 'estatico';
  var editId = null;
  var pendingImg = null;

  let allPosts = [];

  /* Firebase Functions */
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
      showToast(editId ? 'Actualizado' : '✅ Posteo creado');
      editId = null;
      await loadPosts();
      closeModal(createModal);
      resetForm();
    } catch (e) {
      alert('Error al guardar');
    }
  }

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

  function resetForm() {
    editId = null;
    pendingImg = null;
    fTitle.value = '';
    fImage.value = '';
    fVideo.value = '';
    fPoster.value = '';
    fCopy.value = '';
    fH3.value = '';
    fDesc.value = '';
    imgPreview.style.display = 'none';
  }

  function openCreate() {
    resetForm();
    openModal(createModal);
  }

  /* Guardar */
  $('saveBtn').addEventListener('click', function () {
    const post = { type: currentType, title: fTitle.value.trim() };

    if (currentType === 'estatico') {
      if (!pendingImg) return alert('Sube una imagen primero');
      post.img = pendingImg;
    } else if (currentType === 'video') {
      post.video = fVideo.value.trim();
    } else if (currentType === 'copy') {
      post.text = fCopy.value.trim();
    } else if (currentType === 'tendencias') {
      post.h3 = fH3.value.trim();
    }

    savePost(post);
  });

  /* Subir imagen */
  fImage.addEventListener('change', function () {
    const file = fImage.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        pendingImg = e.target.result;
        imgPreview.querySelector('img').src = pendingImg;
        imgPreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  /* Arranque */
  setAuthUI();
  loadPosts();

  loginBtn.addEventListener('click', () => openModal(loginModal));
  $('loginSubmit').addEventListener('click', doLogin);
  createBtn.addEventListener('click', openCreate);
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
  });

  console.log("✅ App estable cargada");
})();