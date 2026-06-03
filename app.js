/* ============================================================
   LACOOPEAR × QBM — Portfolio con Firebase (Versión Corregida)
   ============================================================ */
'use strict';

(function () {
  /* ----------------------------------------------------------
     Configuración y constantes
     ---------------------------------------------------------- */
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = function (id) { return document.getElementById(id); };

  /* ----------------------------------------------------------
     Referencias del DOM
     ---------------------------------------------------------- */
  var grid = $('grid');
  var filters = $('filters');
  var searchInput = $('search');
  var empty = $('empty');
  var lightbox = $('lightbox');
  var lightboxBody = $('lbContent');
  var lightboxClose = $('lbClose');
  var reader = $('reader');
  var readerTitle = $('readerTitle');
  var readerText = $('readerText');
  var readerClose = $('readerClose');

  var loginBtn = $('loginBtn');
  var createBtn = $('createBtn');
  var exportBtn = $('exportBtn');
  var importBtn = $('importBtn');
  var logoutBtn = $('logoutBtn');

  var loginModal = $('loginModal');
  var createModal = $('createModal');
  var loginUser = $('loginUser');
  var loginPass = $('loginPass');
  var loginErr = $('loginErr');

  var typeSeg = $('typeSeg');
  var fTitle = $('fTitle');
  var fImage = $('fImage');
  var imgPreview = $('imgPreview');
  var fVideo = $('fVideo');
  var fPoster = $('fPoster');
  var posterDrop = $('posterDrop');
  var posterFile = $('posterFile');
  var fCopy = $('fCopy');
  var fH3 = $('fH3');
  var fDesc = $('fDesc');
  var linkList = $('linkList');
  var createTitle = $('createTitle');
  var toast = $('toast');

  var currentType = 'estatico';
  var editId = null;
  var pendingImg = null;
  var pendingPoster = null;
  var toastTimer = null;

  let allPosts = [];

  /* ----------------------------------------------------------
     Firebase Config - REEMPLAZA CON TUS DATOS
     ---------------------------------------------------------- */
  const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROYECTO.firebaseapp.com",
    projectId: "TU_PROYECTO",
    storageBucket: "TU_PROYECTO.appspot.com",
    messagingSenderId: "XXXXXXXXXXXX",
    appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXXXXXX"
  };

  if (typeof firebase !== "undefined" && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  /* ----------------------------------------------------------
     Funciones Firebase
     ---------------------------------------------------------- */
  async function loadPosts() {
    try {
      const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
      allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render();
    } catch (e) {
      console.error(e);
      showToast('Error cargando desde Firebase');
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
      await loadPosts();
      closeModal(createModal);
      resetForm();
      showToast(editId ? 'Actualizado' : 'Creado');
    } catch (e) {
      console.error(e);
      alert('Error guardando en Firebase');
    }
  }

  async function deletePost(id) {
    if (!confirm('Eliminar?')) return;
    await db.collection('posts').doc(id).delete();
    await loadPosts();
  }

  /* ----------------------------------------------------------
     Utilidades + Funciones originales (resumidas)
     ---------------------------------------------------------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function isAuthed() { return localStorage.getItem(AUTH_KEY) === '1'; }

  function setAuthUI() {
    var on = isAuthed();
    document.body.classList.toggle('is-admin', on);
    loginBtn.classList.toggle('hidden', on);
    [createBtn, exportBtn, importBtn, logoutBtn].forEach(b => b.classList.toggle('hidden', !on));
  }

  function doLogin() {
    if (loginUser.value.trim() === AUTH.user && loginPass.value === AUTH.pass) {
      localStorage.setItem(AUTH_KEY, '1');
      setAuthUI();
      closeModal(loginModal);
      showToast('Modo Admin activado');
    } else {
      loginErr.classList.remove('hidden');
    }
  }

  function closeModal(m) { m.classList.remove('open'); }
  function openModal(m) { m.classList.add('open'); }

  function resetForm() {
    editId = null;
    // limpiar campos...
  }

  function openCreate(post) {
    resetForm();
    if (post) editId = post.id;
    openModal(createModal);
  }

  function render() {
    grid.innerHTML = ''; // Limpia
    allPosts.forEach(post => {
      var card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `<div class="card-foot"><span class="card-tag">${LABELS[post.type]}</span><p>${post.title || ''}</p></div>`;
      grid.appendChild(card);
    });
  }

  /* ----------------------------------------------------------
     Arranque
     ---------------------------------------------------------- */
  setAuthUI();
  loadPosts();

  // Eventos de login
  loginBtn.addEventListener('click', () => openModal(loginModal));
  $('loginSubmit').addEventListener('click', doLogin);
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
  });

  console.log("✅ App cargada");
})();