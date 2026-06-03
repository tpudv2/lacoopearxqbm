/* ============================================================
   LACOOPEAR × QBM — Firebase Versión Corregida
   ============================================================ */
'use strict';

(function () {
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = id => document.getElementById(id);

  // DOM Elements
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

  let allPosts = [];
  var editId = null;

  /* Utilidades */
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

  /* Firebase */
  async function loadPosts() {
    try {
      const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
      allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render();
    } catch (e) {
      console.error(e);
      showToast('Error cargando posteos');
    }
  }

  function render() {
    grid.innerHTML = '';
    allPosts.forEach(post => {
      const card = document.createElement('article');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-foot">
          <span class="card-tag">${LABELS[post.type] || post.type}</span>
          <p class="card-title">${post.title || 'Sin título'}</p>
        </div>`;
      grid.appendChild(card);
    });
  }

  /* Arranque */
  setAuthUI();
  if (typeof db !== "undefined") {
    loadPosts();
  }

  // Eventos
  loginBtn.addEventListener('click', () => openModal(loginModal));
  $('loginSubmit').addEventListener('click', doLogin);
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
  });

  console.log("✅ App cargada - Modo Admin listo");
})();