// Entry for the bundled 3D (js/dist/scene.js). Each page sets <body data-scene="...">.
import home from './scenes/home.js';
import services from './scenes/services.js';
import process from './scenes/process.js';
import about from './scenes/about.js';
import contact from './scenes/contact.js';

const SCENES = { home, services, process, about, contact };

function boot() {
  const name = document.body.dataset.scene, canvas = document.getElementById('stage');
  if (!name || !canvas || !SCENES[name]) return;
  const host = canvas.closest('.hero, .sticky') || canvas.parentElement;
  host.classList.add('loading3d');
  if (!host.querySelector('.loader3d')) host.insertAdjacentHTML('beforeend', '<div class="loader3d">กำลังโหลด 3D…</div>');

  const fail = why => {
    console.warn('3D disabled:', why);
    host.dataset.fail3d = String(why && why.message || why);
    host.classList.remove('loading3d');
    host.classList.add('fallback3d');
    canvas.style.display = 'none';
  };
  let S;
  try { S = SCENES[name](canvas); } catch (e) { return fail(e); }
  if (!S) return fail('WebGL not available');
  S.onReady = () => { host.classList.remove('loading3d'); canvas.classList.add('ready'); };
  S.onFail = () => fail('render error');
  // give up only after 12s of the tab actually being visible (background tabs don't render)
  let waited = 0;
  const iv = setInterval(() => {
    if (!host.classList.contains('loading3d')) return clearInterval(iv);
    if (!document.hidden) waited += 500;
    if (waited >= 12000) { clearInterval(iv); fail('timeout'); }
  }, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
