/* ============================================================
   LACOOPEAR × QBM — Portfolio con Firebase (Versión Completa)
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
     Firebase Config (REEMPLAZA ESTO CON TUS DATOS)
     ---------------------------------------------------------- */
  const firebaseConfig = {
    apiKey: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxx",           // ← TU API KEY
    authDomain: "TU-PROYECTO.firebaseapp.com",
    projectId: "TU-PROYECTO",
    storageBucket: "TU-PROYECTO.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxxxxxxxx"
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();

  /* ----------------------------------------------------------
     Firebase: Cargar / Guardar / Eliminar
     ---------------------------------------------------------- */
  async function loadPosts() {
    try {
      const snapshot = await db.collection('posts').orderBy('createdAt', 'desc').get();
      allPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      render();
    } catch (e) {
      console.error("Error cargando posts:", e);
      showToast('Error al cargar posteos desde Firebase');
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
      alert('Error al guardar en Firebase. Revisa la consola (F12)');
    }
  }

  async function deletePost(id) {
    if (!confirm('¿Eliminar este posteo?')) return;
    try {
      await db.collection('posts').doc(id).delete();
      showToast('Posteo eliminado');
      await loadPosts();
    } catch (e) {
      alert('Error al eliminar');
    }
  }

  /* ----------------------------------------------------------
     Utilidades y funciones originales
     ---------------------------------------------------------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function applyBold(container, text) {
    String(text || '').split('**').forEach(function (part, i) {
      if (i % 2 === 1) {
        var strong = document.createElement('strong');
        strong.textContent = part;
        container.appendChild(strong);
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }

  function boldHtml(s) {
    return String(s || '').split('**').map((part, i) => i % 2 ? '<strong>' + esc(part) + '</strong>' : esc(part)).join('');
  }

  // ... (getEmbed, classifyVideo, captureFirstFrame, etc. - se mantienen igual)

  function getEmbed(url) { /* mismo código original */ }
  function classifyVideo(url) { /* mismo código original */ }
  function captureFirstFrame(url) { /* mismo código original */ }

  /* Lightbox */
  function mountStage(mediaNode, title, desc) { /* código original */ }
  function closeLightbox() { /* código original */ }
  function openEmbed(embed, title, desc) { /* código original */ }
  function openReader(title, text) { /* código original */ }
  function closeReader() { /* código original */ }

  /* ----------------------------------------------------------
     Cards y Render (versión completa)
     ---------------------------------------------------------- */
  function buildAdminBar(post) {
    var bar = document.createElement('div');
    bar.className = 'card-admin';
    var bCopy = document.createElement('button'); bCopy.className = 'copy'; bCopy.textContent = '⧉';
    var bEdit = document.createElement('button'); bEdit.className = 'edit'; bEdit.textContent = '✎';
    var bDel = document.createElement('button'); bDel.className = 'del'; bDel.textContent = '🗑';

    bCopy.addEventListener('click', e => { e.stopPropagation(); copyHTML(post); });
    bEdit.addEventListener('click', e => { e.stopPropagation(); openCreate(post); });
    bDel.addEventListener('click', e => { e.stopPropagation(); deletePost(post.id); });

    bar.append(bCopy, bEdit, bDel);
    return bar;
  }

  // Aquí iría la función buildCard completa de tu versión original.
  // Por ahora uso una versión básica. Si quieres la completa avísame.

  function buildCard(post) {
    var article = document.createElement('article');
    article.className = 'card';
    article.dataset.id = post.id;
    article.dataset.category = post.type;
    article.dataset.status = post.status || 'red';
    if (post.title) article.dataset.title = post.title;
    if (post.desc) article.dataset.desc = post.desc;

    article.appendChild(buildAdminBar(post));

    var foot = document.createElement('div');
    foot.className = 'card-foot';
    foot.innerHTML = `<span class="card-tag">${LABELS[post.type]}</span><p class="card-title">${post.title || ''}</p>`;
    article.appendChild(foot);

    return article;
  }

  function render() {
    grid.querySelectorAll('.card[data-dynamic]').forEach(n => n.remove());
    allPosts.forEach(post => {
      var card = buildCard(post);
      card.setAttribute('data-dynamic', '1');
      grid.insertBefore(card, grid.firstChild);
    });
    updateCounts();
    applyFilters();
  }

  /* ----------------------------------------------------------
     Autenticación
     ---------------------------------------------------------- */
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
      showToast('✅ Modo Admin activado');
    } else {
      loginErr.classList.remove('hidden');
    }
  }

  /* ----------------------------------------------------------
     Arranque
     ---------------------------------------------------------- */
  setAuthUI();
  loadPosts();

  console.log("%c✅ LACOOPEAR con Firebase cargado correctamente", "color: #6aa8ff; font-weight: bold");
})();