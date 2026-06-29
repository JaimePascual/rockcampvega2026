/* =====================================================================
   ROCK CAMP VEGA 2026 — script.js
   Escanea la carpeta /fotos del repositorio de GitHub en cada carga de
   la página (usando la API pública de GitHub) y construye la galería.
   No hace falta mantener ninguna lista manual: basta con subir fotos
   nuevas a la carpeta "fotos" del repositorio.
   ===================================================================== */

/* -------------------------------------------------------------------
   CONFIGURACIÓN MANUAL (opcional)
   Si la web se sirve desde un dominio propio (no *.github.io) o la
   detección automática falla, rellena estos valores a mano:
   ------------------------------------------------------------------- */
const MANUAL_CONFIG = {
  owner: null,   // ej: "tu-usuario-de-github"
  repo: null,    // ej: "rockcampvega2026"
};

const PHOTOS_FOLDER = 'fotos';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];

/* -------------------------------------------------------------------
   Detección automática de owner/repo a partir de la URL de GitHub Pages
   - Página de proyecto: usuario.github.io/repo/...
   - Página de usuario:  usuario.github.io/...   (repo = usuario.github.io)
   ------------------------------------------------------------------- */
function detectGithubPagesTarget() {
  const host = window.location.hostname;
  if (!host.endsWith('github.io')) return null;

  const owner = host.split('.')[0];
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const candidateRepo = pathParts.length > 0 ? pathParts[0] : null;

  return { owner, userPageRepo: `${owner}.github.io`, candidateRepo };
}

async function resolveRepoTarget() {
  if (MANUAL_CONFIG.owner && MANUAL_CONFIG.repo) {
    return { owner: MANUAL_CONFIG.owner, repo: MANUAL_CONFIG.repo };
  }

  const detected = detectGithubPagesTarget();
  if (!detected) return null;

  // Probar primero como "página de proyecto" (repo = primer segmento de la ruta)
  if (detected.candidateRepo) {
    const ok = await folderExists(detected.owner, detected.candidateRepo);
    if (ok) return { owner: detected.owner, repo: detected.candidateRepo };
  }

  // Si no, probar como "página de usuario" (repo = usuario.github.io)
  const okUserPage = await folderExists(detected.owner, detected.userPageRepo);
  if (okUserPage) return { owner: detected.owner, repo: detected.userPageRepo };

  return null;
}

async function folderExists(owner, repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${PHOTOS_FOLDER}`
    );
    return res.ok;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------
   Obtiene el listado de fotos desde la API de contenidos de GitHub
   ------------------------------------------------------------------- */
async function fetchPhotoList(owner, repo) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${PHOTOS_FOLDER}`
  );

  if (!res.ok) {
    throw new Error(`GitHub API respondió ${res.status}`);
  }

  const items = await res.json();

  return items
    .filter((item) => item.type === 'file')
    .filter((item) => {
      const ext = item.name.split('.').pop().toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((item, index) => ({
      name: item.name,
      url: item.download_url,
      index,
    }));
}

/* -------------------------------------------------------------------
   Render de la galería
   ------------------------------------------------------------------- */
let currentPhotos = [];
let currentLightboxIndex = -1;

function renderGallery(photos) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  photos.forEach((photo, i) => {
    const card = document.createElement('article');
    card.className = 'photo-card';
    card.style.animationDelay = `${Math.min(i * 0.03, 0.6)}s`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ver foto ${photo.name} en grande`);

    card.innerHTML = `
      <span class="photo-tag">Nº ${String(i + 1).padStart(3, '0')}</span>
      <div class="photo-thumb-wrap">
        <img src="${photo.url}" alt="" loading="lazy">
      </div>
      <span class="photo-name">${photo.name}</span>
    `;

    card.addEventListener('click', () => openLightbox(i));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(i);
      }
    });

    gallery.appendChild(card);
  });
}

/* -------------------------------------------------------------------
   Lightbox
   ------------------------------------------------------------------- */
function openLightbox(index) {
  currentLightboxIndex = index;
  const photo = currentPhotos[index];

  document.getElementById('lightbox-img').src = photo.url;
  document.getElementById('lightbox-img').alt = photo.name;
  document.getElementById('lightbox-caption').textContent = photo.name;
  document.getElementById('lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
  document.getElementById('lightbox-close').focus();
}

function closeLightbox() {
  document.getElementById('lightbox').hidden = true;
  document.getElementById('lightbox-img').src = '';
  document.body.style.overflow = '';
  currentLightboxIndex = -1;
}

function showNext(delta) {
  if (currentLightboxIndex === -1) return;
  const total = currentPhotos.length;
  const next = (currentLightboxIndex + delta + total) % total;
  openLightbox(next);
}

function setupLightboxControls() {
  document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-prev').addEventListener('click', () => showNext(-1));
  document.getElementById('lightbox-next').addEventListener('click', () => showNext(1));

  // Cerrar al pinchar fuera de la imagen
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showNext(-1);
    if (e.key === 'ArrowRight') showNext(1);
  });
}

/* -------------------------------------------------------------------
   Estados de carga / vacío / error
   ------------------------------------------------------------------- */
function showState(stateId) {
  ['state-loading', 'state-empty', 'state-error'].forEach((id) => {
    document.getElementById(id).hidden = id !== stateId;
  });
}

function hideAllStates() {
  ['state-loading', 'state-empty', 'state-error'].forEach((id) => {
    document.getElementById(id).hidden = true;
  });
}

/* -------------------------------------------------------------------
   Inicio
   ------------------------------------------------------------------- */
async function init() {
  setupLightboxControls();
  showState('state-loading');

  try {
    const target = await resolveRepoTarget();

    if (!target) {
      document.getElementById('error-detail').textContent =
        'No se ha podido identificar el repositorio de GitHub. Si usas un dominio propio, configura "owner" y "repo" al principio de script.js.';
      showState('state-error');
      return;
    }

    const photos = await fetchPhotoList(target.owner, target.repo);
    currentPhotos = photos;

    if (photos.length === 0) {
      showState('state-empty');
      return;
    }

    hideAllStates();
    renderGallery(photos);
  } catch (err) {
    console.error(err);
    document.getElementById('error-detail').textContent =
      'Comprueba tu conexión a internet o que la carpeta "fotos" existe en el repositorio.';
    showState('state-error');
  }
}

document.addEventListener('DOMContentLoaded', init);
