/* ============================================================
   LACOOPEAR × QBM — Portfolio de propuestas
   Lógica del sitio: galería, filtros, lightbox y panel admin
   ============================================================ */
'use strict';

(function () {
  /* ----------------------------------------------------------
     Configuración y constantes
     ---------------------------------------------------------- */
  var AUTH = { user: 'lacoopear', pass: 'lacoopear2026' };
  var STORE_KEY = 'lcp_posts_v2';
  var AUTH_KEY = 'lcp_auth_v1';
  var LABELS = { estatico: 'Estático', video: 'Video', copy: 'Copy', tendencias: 'Tendencias' };

  var $ = function (id) { return document.getElementById(id); };

  /* ----------------------------------------------------------
     Referencias del DOM
     ---------------------------------------------------------- */
  var grid = $('grid');
  var filters = $('filters');
  var empty = $('empty');
  var lightbox = $('lightbox');
  var lightboxBody = $('lbContent');
  var lightboxClose = $('lbClose');

  var loginBtn = $('loginBtn');
  var createBtn = $('createBtn');
  var exportBtn = $('exportBtn');
  var importBtn = $('importBtn');
  var logoutBtn = $('logoutBtn');
  var importFile = $('importFile');

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
  var fCopy = $('fCopy');
  var fH3 = $('fH3');
  var linkList = $('linkList');
  var createTitle = $('createTitle');
  var toast = $('toast');

  var currentType = 'estatico';
  var editId = null;
  var pendingImg = null;
  var toastTimer = null;

  /* ----------------------------------------------------------
     Persistencia
     ---------------------------------------------------------- */
  function getPosts() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }
  function setPosts(arr) {
    localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  }

  /* ----------------------------------------------------------
     Utilidades
     ---------------------------------------------------------- */
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Convierte **texto** en <strong>texto</strong> dentro del DOM */
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

  /* Versión en string (para "copiar HTML") */
  function boldHtml(s) {
    return String(s || '').split('**')
      .map(function (part, i) { return i % 2 ? '<strong>' + esc(part) + '</strong>' : esc(part); })
      .join('');
  }

  /* ----------------------------------------------------------
     Detección de enlaces incrustables (YouTube / Vimeo)
     ---------------------------------------------------------- */
  function getEmbed(url) {
    if (!url) return null;
    var u = String(url).trim();

    var yt = u.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    if (yt) {
      var id = yt[1];
      var vertical = /shorts\//.test(u);
      return {
        provider: 'youtube', id: id, vertical: vertical,
        embed: 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1',
        sstatic: 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0',
        watch: 'https://youtu.be/' + id,
        thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'
      };
    }

    var vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vm) {
      var vid = vm[1];
      return {
        provider: 'vimeo', id: vid, vertical: false,
        embed: 'https://player.vimeo.com/video/' + vid + '?autoplay=1',
        sstatic: 'https://player.vimeo.com/video/' + vid,
        watch: 'https://vimeo.com/' + vid,
        thumb: ''
      };
    }
    return null;
  }

  function makePlayBadge() {
    var badge = document.createElement('div');
    badge.className = 'play-badge';
    badge.appendChild(document.createElement('span'));
    return badge;
  }

  /* ----------------------------------------------------------
     Lightbox
     ---------------------------------------------------------- */
  function openLightbox(node) {
    lightboxBody.innerHTML = '';
    lightboxBody.appendChild(node);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightboxBody.innerHTML = '';
    document.body.style.overflow = '';
  }

  function openEmbed(embed) {
    lightboxBody.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'embed-wrap' + (embed.vertical ? ' embed-wrap--v' : '');

    var iframe = document.createElement('iframe');
    iframe.src = embed.embed;
    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('allowfullscreen', '');
    wrap.appendChild(iframe);

    if (embed.watch) {
      var fb = document.createElement('a');
      fb.className = 'embed-fallback';
      fb.href = embed.watch;
      fb.target = '_blank';
      fb.rel = 'noopener';
      fb.textContent = '¿No carga? Ver en origen ↗';
      wrap.appendChild(fb);
    }

    lightboxBody.appendChild(wrap);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  /* ----------------------------------------------------------
     Filtros y conteos
     ---------------------------------------------------------- */
  function updateCounts() {
    var totals = { todos: 0, estatico: 0, video: 0, copy: 0, tendencias: 0 };
    grid.querySelectorAll('.card').forEach(function (card) {
      totals.todos++;
      var cat = card.dataset.category;
      if (totals[cat] !== undefined) totals[cat]++;
    });
    filters.querySelectorAll('.filter').forEach(function (btn) {
      var span = btn.querySelector('.filter__count');
      if (span) span.textContent = totals[btn.dataset.filter] || 0;
    });
  }

  function applyFilter(cat) {
    var visible = 0;
    grid.querySelectorAll('.card').forEach(function (card) {
      var show = (cat === 'todos') || (card.dataset.category === cat);
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    empty.style.display = visible === 0 ? 'block' : 'none';
  }

  function reapplyFilter() {
    var active = filters.querySelector('.filter[aria-pressed="true"]');
    applyFilter(active ? active.dataset.filter : 'todos');
  }

  filters.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter');
    if (!btn) return;
    filters.querySelectorAll('.filter').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    btn.setAttribute('aria-pressed', 'true');
    applyFilter(btn.dataset.filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* Click en tarjetas con media ampliable (delegación) */
  grid.addEventListener('click', function (e) {
    var card = e.target.closest('.card--zoom');
    if (!card) return;
    var img = card.querySelector('.media img');
    var vid = card.querySelector('.media video');

    if (img) {
      var clone = new Image();
      clone.src = img.currentSrc || img.src;
      clone.alt = img.alt || '';
      openLightbox(clone);
    } else if (vid) {
      if (!vid.getAttribute('src')) {
        var poster = vid.getAttribute('poster');
        if (poster) { var p = new Image(); p.src = poster; openLightbox(p); }
        return;
      }
      var v = document.createElement('video');
      v.src = vid.currentSrc || vid.src;
      v.controls = true; v.autoplay = true; v.loop = true; v.playsInline = true;
      openLightbox(v);
    }
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

  /* ----------------------------------------------------------
     Construcción de tarjetas en el DOM
     ---------------------------------------------------------- */
  function buildFoot(post, tagOnly) {
    var foot = document.createElement('div');
    foot.className = 'card-foot';
    var tag = document.createElement('span');
    tag.className = 'card-tag';
    tag.textContent = LABELS[post.type];
    foot.appendChild(tag);
    if (!tagOnly && post.title) {
      var title = document.createElement('p');
      title.className = 'card-title';
      title.textContent = post.title;
      foot.appendChild(title);
    }
    return foot;
  }

  function buildAdminBar(post) {
    var bar = document.createElement('div');
    bar.className = 'card-admin';

    var bCopy = document.createElement('button');
    bCopy.className = 'copy'; bCopy.title = 'Copiar HTML'; bCopy.textContent = '⧉';
    var bEdit = document.createElement('button');
    bEdit.className = 'edit'; bEdit.title = 'Editar'; bEdit.textContent = '✎';
    var bDel = document.createElement('button');
    bDel.className = 'del'; bDel.title = 'Eliminar'; bDel.textContent = '🗑';

    [bCopy, bEdit, bDel].forEach(function (b) {
      b.type = 'button';
      b.addEventListener('click', function (e) { e.stopPropagation(); });
    });
    bCopy.addEventListener('click', function () { copyHTML(post); });
    bEdit.addEventListener('click', function () { openCreate(post); });
    bDel.addEventListener('click', function () {
      if (confirm('¿Eliminar este posteo?')) {
        setPosts(getPosts().filter(function (p) { return p.id !== post.id; }));
        render();
      }
    });

    bar.appendChild(bCopy);
    bar.appendChild(bEdit);
    bar.appendChild(bDel);
    return bar;
  }

  function buildCard(post) {
    var article = document.createElement('article');
    article.className = 'card';
    article.setAttribute('data-dynamic', '1');
    article.dataset.id = post.id;
    article.dataset.category = post.type;

    var embed = post.type === 'video' ? getEmbed(post.video) : null;
    if (post.type === 'estatico') article.classList.add('card--zoom');
    if (post.type === 'video' && !embed) article.classList.add('card--zoom');
    if (post.type === 'copy') article.classList.add('card--copy');
    if (post.type === 'tendencias') article.classList.add('card--tendencias');

    article.appendChild(buildAdminBar(post));

    if (post.type === 'estatico') {
      var media = document.createElement('div');
      media.className = 'media';
      var img = document.createElement('img');
      img.src = post.img;
      img.alt = post.title || 'Propuesta';
      img.loading = 'lazy';
      media.appendChild(img);
      article.appendChild(media);
      article.appendChild(buildFoot(post));

    } else if (post.type === 'video') {
      var vMedia = document.createElement('div');
      vMedia.className = 'media';
      if (embed) {
        var thumb = post.poster || embed.thumb || 'media/video-poster.svg';
        var timg = document.createElement('img');
        timg.src = thumb;
        timg.alt = post.title || 'Video';
        timg.loading = 'lazy';
        vMedia.appendChild(timg);
        vMedia.appendChild(makePlayBadge());
        vMedia.style.cursor = 'zoom-in';
        vMedia.addEventListener('click', function (e) { e.stopPropagation(); openEmbed(embed); });
      } else {
        var video = document.createElement('video');
        if (post.video) video.src = post.video;
        if (post.poster) video.poster = post.poster;
        video.autoplay = true; video.muted = true; video.loop = true;
        video.playsInline = true; video.setAttribute('preload', 'none');
        vMedia.appendChild(video);
        vMedia.appendChild(makePlayBadge());
      }
      article.appendChild(vMedia);
      article.appendChild(buildFoot(post));

    } else if (post.type === 'copy') {
      var body = document.createElement('div');
      body.className = 'copy-body';
      var text = document.createElement('p');
      text.className = 'copy-text';
      applyBold(text, post.text);
      body.appendChild(text);
      article.appendChild(body);
      article.appendChild(buildFoot(post));

    } else if (post.type === 'tendencias') {
      var tBody = document.createElement('div');
      tBody.className = 'trend-body';
      var h3 = document.createElement('h3');
      h3.textContent = post.h3 || '';
      tBody.appendChild(h3);
      var ul = document.createElement('ul');
      ul.className = 'trend-links';
      (post.links || []).forEach(function (link) {
        if (!link.url && !link.label) return;
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = link.url || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        var span = document.createElement('span');
        span.className = 'lnk';
        span.textContent = link.label || link.url;
        a.appendChild(span);
        li.appendChild(a);
        ul.appendChild(li);
      });
      tBody.appendChild(ul);
      article.appendChild(tBody);
      article.appendChild(buildFoot(post, true));
    }

    return article;
  }

  function render() {
    grid.querySelectorAll('.card[data-dynamic]').forEach(function (n) { n.remove(); });
    var posts = getPosts(); // posts[0] = más reciente
    for (var i = posts.length - 1; i >= 0; i--) {
      grid.insertBefore(buildCard(posts[i]), grid.firstChild);
    }
    updateCounts();
    reapplyFilter();
  }

  /* ----------------------------------------------------------
     Generar HTML estático (para "copiar HTML")
     ---------------------------------------------------------- */
  function toHTML(post) {
    var titleHtml = post.title ? '<p class="card-title">' + esc(post.title) + '</p>' : '';

    if (post.type === 'estatico') {
      return '<article class="card card--zoom" data-category="estatico">\n' +
        '  <div class="media"><img src="' + post.img + '" alt="' + esc(post.title) + '" loading="lazy" /></div>\n' +
        '  <div class="card-foot"><span class="card-tag">Estático</span>' + titleHtml + '</div>\n</article>';
    }

    if (post.type === 'video') {
      var emb = getEmbed(post.video);
      if (emb) {
        return '<article class="card" data-category="video">\n' +
          '  <div class="media" style="position:relative;aspect-ratio:' + (emb.vertical ? '9/16' : '16/9') + '">' +
          '<iframe src="' + esc(emb.sstatic) + '" loading="lazy" allow="fullscreen; encrypted-media; picture-in-picture" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div>\n' +
          '  <div class="card-foot"><span class="card-tag">Video</span>' + titleHtml + '</div>\n</article>';
      }
      return '<article class="card card--zoom" data-category="video">\n' +
        '  <div class="media"><video src="' + esc(post.video) + '"' + (post.poster ? ' poster="' + esc(post.poster) + '"' : '') +
        ' autoplay muted loop playsinline preload="none"></video><div class="play-badge"><span></span></div></div>\n' +
        '  <div class="card-foot"><span class="card-tag">Video</span>' + titleHtml + '</div>\n</article>';
    }

    if (post.type === 'copy') {
      return '<article class="card card--copy" data-category="copy">\n' +
        '  <div class="copy-body"><p class="copy-text">' + boldHtml(post.text) + '</p></div>\n' +
        '  <div class="card-foot"><span class="card-tag">Copy</span>' + titleHtml + '</div>\n</article>';
    }

    var lis = (post.links || []).filter(function (l) { return l.url || l.label; }).map(function (l) {
      return '      <li><a href="' + esc(l.url || '#') + '" target="_blank" rel="noopener"><span class="lnk">' + esc(l.label || l.url) + '</span></a></li>';
    }).join('\n');
    return '<article class="card card--tendencias" data-category="tendencias">\n' +
      '  <div class="trend-body"><h3>' + esc(post.h3) + '</h3>\n    <ul class="trend-links">\n' + lis + '\n    </ul>\n  </div>\n' +
      '  <div class="card-foot"><span class="card-tag">Tendencias</span></div>\n</article>';
  }

  function copyHTML(post) {
    var html = toHTML(post);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(html).then(
        function () { showToast('HTML copiado al portapapeles'); },
        function () { window.prompt('Copia este HTML:', html); }
      );
    } else {
      window.prompt('Copia este HTML:', html);
    }
  }

  /* ----------------------------------------------------------
     Autenticación
     ---------------------------------------------------------- */
  function isAuthed() { return localStorage.getItem(AUTH_KEY) === '1'; }

  function setAuthUI() {
    var on = isAuthed();
    document.body.classList.toggle('is-admin', on);
    loginBtn.classList.toggle('hidden', on);
    [createBtn, exportBtn, importBtn, logoutBtn].forEach(function (b) {
      b.classList.toggle('hidden', !on);
    });
  }

  function openModal(m) { m.classList.add('open'); }
  function closeModal(m) { m.classList.remove('open'); }

  function doLogin() {
    if (loginUser.value.trim() === AUTH.user && loginPass.value === AUTH.pass) {
      localStorage.setItem(AUTH_KEY, '1');
      setAuthUI();
      closeModal(loginModal);
      showToast('Bienvenido — modo edición activo');
    } else {
      loginErr.classList.remove('hidden');
    }
  }

  loginBtn.addEventListener('click', function () {
    loginErr.classList.add('hidden');
    loginUser.value = '';
    loginPass.value = '';
    openModal(loginModal);
    loginUser.focus();
  });
  $('loginCancel').addEventListener('click', function () { closeModal(loginModal); });
  $('loginSubmit').addEventListener('click', doLogin);
  loginPass.addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem(AUTH_KEY);
    setAuthUI();
    showToast('Sesión cerrada');
  });

  /* ----------------------------------------------------------
     Formulario de creación / edición
     ---------------------------------------------------------- */
  function setType(type) {
    currentType = type;
    typeSeg.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.type === type));
    });
    createModal.querySelector('.f-estatico').classList.toggle('hidden', type !== 'estatico');
    createModal.querySelector('.f-video').classList.toggle('hidden', type !== 'video');
    createModal.querySelector('.f-copy').classList.toggle('hidden', type !== 'copy');
    createModal.querySelector('.f-tendencias').classList.toggle('hidden', type !== 'tendencias');
    createModal.querySelector('.f-title').classList.toggle('hidden', type === 'tendencias');
  }

  typeSeg.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (b) setType(b.dataset.type);
  });

  function addLinkRow(label, url) {
    var row = document.createElement('div');
    row.className = 'link-row';

    var labelInput = document.createElement('input');
    labelInput.className = 'input l-label';
    labelInput.placeholder = 'Texto del enlace';
    labelInput.value = label || '';

    var urlInput = document.createElement('input');
    urlInput.className = 'input l-url';
    urlInput.placeholder = 'https://...';
    urlInput.value = url || '';

    var rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'rm';
    rm.textContent = '×';
    rm.addEventListener('click', function () { row.remove(); });

    row.appendChild(labelInput);
    row.appendChild(urlInput);
    row.appendChild(rm);
    linkList.appendChild(row);
  }

  $('addLink').addEventListener('click', function () { addLinkRow('', ''); });

  function resetForm() {
    editId = null;
    pendingImg = null;
    fTitle.value = ''; fImage.value = ''; fVideo.value = '';
    fPoster.value = ''; fCopy.value = ''; fH3.value = '';
    imgPreview.style.display = 'none';
    imgPreview.querySelector('img').src = '';
    linkList.innerHTML = '';
    addLinkRow('', '');
    addLinkRow('', '');
    createTitle.textContent = 'Nuevo posteo';
    setType('estatico');
  }

  function openCreate(post) {
    resetForm();
    if (post) {
      editId = post.id;
      createTitle.textContent = 'Editar posteo';
      setType(post.type);

      if (post.type === 'estatico') {
        pendingImg = post.img;
        if (post.img) {
          imgPreview.querySelector('img').src = post.img;
          imgPreview.style.display = 'block';
        }
        fTitle.value = post.title || '';
      } else if (post.type === 'video') {
        fVideo.value = post.video || '';
        fPoster.value = post.poster || '';
        fTitle.value = post.title || '';
      } else if (post.type === 'copy') {
        fCopy.value = post.text || '';
        fTitle.value = post.title || '';
      } else if (post.type === 'tendencias') {
        fH3.value = post.h3 || '';
        linkList.innerHTML = '';
        (post.links || []).forEach(function (l) { addLinkRow(l.label, l.url); });
        if (!post.links || !post.links.length) addLinkRow('', '');
      }
    }
    openModal(createModal);
  }

  createBtn.addEventListener('click', function () { openCreate(null); });
  $('createCancel').addEventListener('click', function () { closeModal(createModal); });

  /* Imagen → reescalar → dataURL */
  fImage.addEventListener('change', function () {
    var file = fImage.files && fImage.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1400, w = img.width, h = img.height;
        if (w > max) { h = Math.round(h * max / w); w = max; }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        pendingImg = canvas.toDataURL('image/jpeg', 0.82);
        imgPreview.querySelector('img').src = pendingImg;
        imgPreview.style.display = 'block';
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  function collectLinks() {
    var out = [];
    linkList.querySelectorAll('.link-row').forEach(function (row) {
      var label = row.querySelector('.l-label').value.trim();
      var url = row.querySelector('.l-url').value.trim();
      if (label || url) out.push({ label: label, url: url });
    });
    return out;
  }

  $('saveBtn').addEventListener('click', function () {
    var post = { id: editId || ('p' + Date.now()), type: currentType };
    if (currentType !== 'tendencias') post.title = fTitle.value.trim();

    if (currentType === 'estatico') {
      if (!pendingImg) { alert('Agrega una imagen.'); return; }
      post.img = pendingImg;
    } else if (currentType === 'video') {
      post.video = fVideo.value.trim();
      post.poster = fPoster.value.trim();
      if (!post.video) { alert('Escribe la ruta o el enlace directo del video (.mp4).'); return; }
    } else if (currentType === 'copy') {
      post.text = fCopy.value.trim();
      if (!post.text) { alert('Escribe el texto del copy.'); return; }
    } else if (currentType === 'tendencias') {
      post.h3 = fH3.value.trim();
      post.links = collectLinks();
      if (!post.h3) { alert('Escribe el encabezado.'); return; }
    }

    var posts = getPosts();
    if (editId) {
      for (var i = 0; i < posts.length; i++) {
        if (posts[i].id === editId) { posts[i] = post; break; }
      }
    } else {
      posts.unshift(post);
    }

    try {
      setPosts(posts);
    } catch (e) {
      alert('No hay espacio suficiente en el navegador para guardar más imágenes. Exporta un respaldo o usa imágenes más livianas.');
      return;
    }

    render();
    closeModal(createModal);
    showToast(editId ? 'Posteo actualizado' : 'Posteo creado');
  });

  /* ----------------------------------------------------------
     Exportar / Importar respaldo
     ---------------------------------------------------------- */
  exportBtn.addEventListener('click', function () {
    var blob = new Blob([JSON.stringify(getPosts(), null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'lacoopear-posteos.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Respaldo descargado');
  });

  importBtn.addEventListener('click', function () { importFile.click(); });

  importFile.addEventListener('change', function () {
    var file = importFile.files && importFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('formato inválido');
        if (confirm('Esto reemplazará los posteos actuales por los del respaldo (' + data.length + ' posteos). ¿Continuar?')) {
          setPosts(data);
          render();
          showToast('Respaldo importado');
        }
      } catch (e) {
        alert('El archivo no es un respaldo válido.');
      }
      importFile.value = '';
    };
    reader.readAsText(file);
  });

  /* ----------------------------------------------------------
     Cierre de modales / lightbox con teclado y fondo
     ---------------------------------------------------------- */
  [loginModal, createModal].forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(m); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeLightbox();
      closeModal(loginModal);
      closeModal(createModal);
    }
  });

  /* ----------------------------------------------------------
     Arranque
     ---------------------------------------------------------- */
  setAuthUI();
  render();
})();
