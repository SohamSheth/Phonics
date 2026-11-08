/* Blend & Read: start-up, offline support and installing to the home screen. */
'use strict';

/* ---------- Home-screen app ---------- */
// Running inside a Claude page there is no service worker or install; everywhere else (GitHub Pages) there is.
const insideClaude = !!window.claude;
const installState = {
  prompt: null,   // Chrome / Android / Edge: the browser's own install offer
  standalone: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  ios: /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installState.prompt = e; });
window.addEventListener('appinstalled', () => { installState.prompt = null; installState.standalone = true; });

if (!insideClaude && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
// Ask the browser to keep stars, books and recordings even when space is low.
if (!insideClaude && navigator.storage && navigator.storage.persist) {
  navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});
}

// The grown-ups area calls this to show the right instructions for this device.
function installHTML() {
  if (insideClaude) return '';
  let body;
  if (installState.standalone) body = '<p>✓ Installed. It opens from the home screen and works without the internet (the book writer still needs it).</p>';
  else if (installState.prompt) body = '<p>Add Blend &amp; Read to this device so it opens like an app and works offline.</p><div class="row" style="justify-content:flex-start"><button class="big purple" id="installBtn">📲 Install the app</button></div>';
  else if (installState.ios) body = '<p>On iPad or iPhone, open this page in <b>Safari</b>, tap the <b>Share</b> button (the square with an arrow), then <b>Add to Home Screen</b>. It then opens full screen and works offline.</p>';
  else body = '<p>In Chrome or Edge, use the install icon in the address bar, or the menu’s <b>Install app</b> / <b>Add to Home screen</b>. It then opens like an app and works offline.</p>';
  return `<section class="panel"><h2>Put it on the home screen</h2>${body}</section>`;
}
function wireInstall() {
  const btn = document.getElementById('installBtn');
  if (!btn) return;
  btn.onclick = async () => {
    const p = installState.prompt; if (!p) return;
    installState.prompt = null;
    p.prompt();
    try { await p.userChoice; } catch (e) {}
    grownups();
  };
}

/* ---------- Start ---------- */
$('#homeBtn').onclick = home;
setStars();
home();
MyBooks.connect();
