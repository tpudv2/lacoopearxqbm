/* ============================================================
   LACOOPEAR × QBM — Firebase + Formulario Completo
   ============================================================ */
'use strict';

(function () {
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = id => document.getElementById(id);

  /* DOM Elements */
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
  var posterDrop = $('posterDrop');
  var posterFile = $('posterFile');
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
      showToast(editId ? 'Posteo actualizado' : '✅ Posteo creado');
      editId = null;
      await loadPosts();
      closeModal(createModal);
      resetForm();
    } catch (e) {
      console.error(e);
      alert('Error guardando en Firebase');
    }
  }

  /* ----------------------------------------------------------
     Utilidades
     ---------------------------------------------------------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function processImageFile(file, maxWidth, quality, callback) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      const img = new Image();
      img.onload = function () {
        let w = img.width, h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * maxWidth / w);
          w = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ----------------------------------------------------------
     Formulario
     ---------------------------------------------------------- */
  function setType(type) {
    currentType = type;
    typeSeg.querySelectorAll('button').forEach(b => {
      b.setAttribute('aria-pressed', b.dataset.type === type);
    });
    createModal.querySelector('.f-estatico').classList.toggle('hidden', type !== 'estatico');
    createModal.querySelector('.f-video').classList.toggle('hidden', type !== 'video');
    createModal.querySelector('.f-copy').classList.toggle('hidden', type !== 'copy');
    createModal.querySelector('.f-tendencias').classList.toggle('hidden', type !== 'tendencias');
  }

  function resetForm() {
    editId = null;
    pendingImg = null;
    pendingPoster = null;
    fTitle.value = ''; fImage.value = ''; fVideo.value = '';
    fPoster.value = ''; fCopy.value = ''; fH3.value = ''; fDesc.value = '';
    imgPreview.style.display = 'none';
    linkList.innerHTML = '';
  }

  function openCreate(post) {
    resetForm();
    if (post) {
      editId = post.id;
      createTitle.textContent = 'Editar posteo';
      setType(post.type);
    } else {
      createTitle.textContent = 'Nuevo posteo';
      setType('estatico');
    }
    openModal(createModal);
  }

  function closeModal(m) { m.classList.remove('open'); }
  function openModal(m) { m.classList.add('open'); }

  /* Save */
  $('saveBtn').addEventListener('click', function () {
    const post = { type: currentType };

    if (currentType !== 'tendencias') post.title = fTitle.value.trim();

    if (currentType === 'estatico') {
      if (!pendingImg) return alert('Debes subir una imagen');
      post.img = pendingImg;
      post.desc = fDesc.value.trim();
    } else if (currentType === 'video') {
      post.video = fVideo.value.trim();
      post.poster = pendingPoster || fPoster.value.trim();
      post.desc = fDesc.value.trim();
      if (!post.video) return alert('Ingresa el video o enlace');
    } else if (currentType === 'copy') {
      post.text = fCopy.value.trim();
      if (!post.text) return alert('Escribe el texto');
    } else if (currentType === 'tendencias') {
      post.h3 = fH3.value.trim();
      if (!post.h3) return alert('Escribe el encabezado');
    }

    savePost(post);
  });

  /* Imagen Estático */
  fImage.addEventListener('change', function () {
    processImageFile(fImage.files[0], 1400, 0.82, function (dataURL) {
      pendingImg = dataURL;
      imgPreview.querySelector('img').src = dataURL;
      imgPreview.style.display = 'block';
    });
  });

  /* Arranque */
  setAuthUI();
  loadPosts();

  loginBtn.addEventListener('click', () => openModal(loginModal));
  $('loginSubmit').addEventListener('click', doLogin);
  createBtn.addEventListener('click', () => openCreate(null));
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
  });

  typeSeg.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (btn) setType(btn.dataset.type);
  });

  console.log("✅ Formulario completo cargado");
})();