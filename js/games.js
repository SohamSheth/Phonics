/* Blend & Read: Home screen, the five games, stories, stickers and the grown-ups area. */
'use strict';

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pool = () => S.level === 'cvc' ? CVC : S.level === 'dig' ? DIGRAPH : CVC.concat(DIGRAPH);
const LEVEL_NAME = { cvc: 'Level 1: three-letter words', dig: 'Level 2: special friends (sh, ch, ee, oo...)', mix: 'Levels 1 and 2 mixed' };
function render(html) { hush(); $$('.confetti, .popout').forEach(el => el.remove()); $('#screen').innerHTML = html; window.scrollTo(0, 0); }

function wordHTML(word, cls = '') {
  return `<div class="word ${cls}">${split(word).map((g, i) =>
    `<button class="g ${g.length > 1 ? 'di' : ''}" data-i="${i}" data-g="${g}" aria-label="sound ${g}"><span class="gl">${g}</span><span class="mark"></span></button>`
  ).join('')}</div>`;
}
function wireSounds(root = document) {
  const btns = [...root.querySelectorAll('.word .g')];
  btns.forEach(b => b.onclick = async () => {
    hush(); b.classList.add('lit', 'done'); await playSound(b.dataset.g); b.classList.remove('lit');
    b.dispatchEvent(new CustomEvent('heard', { bubbles: true }));
  });
  return btns;
}
function progressHTML() {
  return `<div class="progress">${G.items.map((_, i) => `<i class="${i < G.idx ? 'on' : i === G.idx ? 'now' : ''}"></i>`).join('')}</div>`;
}
function setStars() { $('#starCount').textContent = S.stars; }
function addStar() {
  const before = Math.floor(S.stars / STARS_PER_STICKER);
  S.stars++; G && (G.score++); save(); setStars();
  if (Math.floor(S.stars / STARS_PER_STICKER) > before && Math.floor(S.stars / STARS_PER_STICKER) <= STICKERS.length) G && (G.newSticker = STICKERS[Math.floor(S.stars / STARS_PER_STICKER) - 1]);
}
function confetti(n = 18) {
  const bits = ['⭐','🎉','✨','🌟','🎈','💛'];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'confetti'; s.textContent = pick(bits);
    s.style.left = Math.random() * 100 + 'vw'; s.style.setProperty('--t', (1.4 + Math.random() * 1.4) + 's');
    s.style.animationDelay = Math.random() * .4 + 's';
    document.body.appendChild(s); setTimeout(() => s.remove(), 3400);
  }
}
function shakeEl(el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }

/* ---------- Home ---------- */
const GAMES = [
  { id:'blend', name:'Blend It', ic:'🔴', c:'#ef4b3f', sub:'Tap the sounds, then blend' },
  { id:'match', name:'Read and Match', ic:'🖼️', c:'#2fa865', sub:'Read it, find the picture' },
  { id:'spell', name:'Spell It', ic:'🔤', c:'#ffc23a', sub:'Build the word' },
  { id:'balloon', name:'Balloon Pop', ic:'🎈', c:'#4aa8e8', sub:'Hear it, pop it' },
  { id:'alien', name:'Alien Words', ic:'👽', c:'#7b4fd6', sub:'Real word or alien word?' },
  { id:'stories', name:'Stories', ic:'📚', c:'#f07fb0', sub:'Read little books' },
  { id:'stickers', name:'My Stickers', ic:'🦄', c:'#ff9a3c', sub:'See what you have won' }
];
let G = null;
function home() {
  G = null;
  const greet = pick(['Hi! What shall we play?','Ready to read? Pick a game!','Let’s blend some words!']);
  render(`
    <div class="hello"><div class="owl" aria-hidden="true">🦉</div><div class="bubble">${greet}</div></div>
    <div class="games">${GAMES.map(g => `<button class="tile" style="--c:${g.c}" data-go="${g.id}"><span class="ic">${g.ic}</span><b>${g.name}</b><small>${g.sub}</small></button>`).join('')}</div>
    <p class="levelnote">Playing ${LEVEL_NAME[S.level]}.</p>
    <div class="row" style="margin-top:8px"><button class="big light hold" id="grownups"><span class="fill"></span>Grown-ups (press and hold)</button></div>`);
  $$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));
  holdToOpen($('#grownups'), grownups);
}
function holdToOpen(btn, fn) {
  let t = null, start = 0; const fill = btn.querySelector('.fill');
  const tick = () => { const p = Math.min(1, (Date.now() - start) / 1500); fill.style.width = p * 100 + '%'; if (p >= 1) { stop(); fn(); } else t = requestAnimationFrame(tick); };
  const begin = e => { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (err) {} start = Date.now(); cancelAnimationFrame(t); t = requestAnimationFrame(tick); };
  const stop = () => { cancelAnimationFrame(t); fill.style.width = '0'; };
  btn.addEventListener('pointerdown', begin); btn.addEventListener('pointerup', stop); btn.addEventListener('pointercancel', stop); btn.addEventListener('lostpointercapture', stop);
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fn(); });
}
function go(id) {
  if (id === 'stories') return shelf();
  if (id === 'stickers') return stickers();
  let items;
  if (id === 'alien') {
    const real = shuffle(pool()).slice(0, 3).map(x => ({ ...x, real: true }));
    const alienSet = S.level === 'cvc' ? ALIEN.cvc : S.level === 'dig' ? ALIEN.dig : ALIEN.cvc.concat(ALIEN.dig);
    const fake = shuffle(alienSet).slice(0, 3).map(w => ({ w, e: '👽', real: false }));
    items = shuffle(real.concat(fake));
  } else items = shuffle(pool()).slice(0, 5);
  G = { kind: id, items, idx: 0, score: 0, newSticker: null };
  question();
}
function next() { G.idx++; G.idx >= G.items.length ? finish() : question(); }
function question() { ({ blend: qBlend, match: qMatch, spell: qSpell, balloon: qBalloon, alien: qAlien })[G.kind](G.items[G.idx]); }

/* ---------- Game: Blend It ---------- */
function qBlend(item) {
  render(`<div class="card">${progressHTML()}
    <p class="prompt">Tap each sound. Then blend it!</p>
    ${wordHTML(item.w)}<div class="swoosh" id="sw"></div>
    <button class="big purple" id="blendBtn" disabled>Blend it!</button>
    <div id="reveal" hidden><div class="pic pop">${item.e}</div><div class="row"><button class="big light" id="again">🔊 Again</button><button class="big" id="nextBtn">Next ➜</button></div></div>
  </div>`);
  const btns = wireSounds(); const heard = new Set();
  $('.word').addEventListener('heard', e => { heard.add(e.target.dataset.i); if (heard.size === btns.length) $('#blendBtn').disabled = false; });
  $('#blendBtn').onclick = async () => {
    $('#blendBtn').hidden = true; $('#sw').classList.add('go');
    await blend(item.w, btns, 120);
    $('#reveal').hidden = false; addStar(); confetti(10); praise();
  };
  $('#again').onclick = () => blend(item.w, btns, 120);
  $('#nextBtn').onclick = next;
  say('Tap each sound');
}

/* ---------- Game: Read and Match ---------- */
function qMatch(item) {
  const others = shuffle(pool().filter(x => x.w !== item.w)).slice(0, 2);
  const opts = shuffle([item, ...others]); let tries = 0;
  render(`<div class="card">${progressHTML()}
    <p class="prompt">Read the word. Which picture is it?</p>
    ${wordHTML(item.w)}
    <div class="choices">${opts.map(o => `<button class="choice" data-w="${o.w}" aria-label="picture">${o.e}</button>`).join('')}</div>
    <div class="row"><button class="big light" id="hint" hidden>🔊 Sound it out</button><button class="big" id="nextBtn" hidden>Next ➜</button></div>
  </div>`);
  const btns = wireSounds();
  $$('.choice').forEach(c => c.onclick = async () => {
    if (!$('#nextBtn').hidden) return;
    if (c.dataset.w === item.w) {
      c.classList.add('right'); if (tries === 0) addStar(); confetti(10);
      $('#hint').hidden = true; $('#nextBtn').hidden = false;
      await blend(item.w, btns, 120); praise();
    } else {
      tries++; shakeEl(c); say('Oops, try again'); $('#hint').hidden = false;
    }
  });
  $('#hint').onclick = () => blend(item.w, btns);
  $('#nextBtn').onclick = next;
}

/* ---------- Game: Spell It ---------- */
function qSpell(item) {
  const gs = split(item.w);
  const extras = shuffle([...new Set(pool().flatMap(x => split(x.w)))].filter(g => !gs.includes(g) && (g.length === 1 || item.set === 'dig'))).slice(0, gs.length > 3 ? 2 : 3);
  const tiles = shuffle(gs.concat(extras));
  const placed = Array(gs.length).fill(null); // index into tiles
  render(`<div class="card">${progressHTML()}
    <p class="prompt">What is it? Build the word!</p>
    <div class="pic">${item.e}</div>
    <button class="big light" id="hear">🔊 Hear the word</button>
    <div class="slots">${gs.map((_, i) => `<button class="slot" data-s="${i}" aria-label="space ${i + 1}"></button>`).join('')}</div>
    <div class="tiles">${tiles.map((t, i) => `<button class="tilebtn" data-t="${i}">${t}</button>`).join('')}</div>
    <button class="big" id="nextBtn" hidden>Next ➜</button>
  </div>`);
  let tries = 0;
  const draw = () => {
    $$('.slot').forEach((s, i) => { s.textContent = placed[i] == null ? '' : tiles[placed[i]]; s.classList.toggle('full', placed[i] != null); });
    $$('.tilebtn').forEach((b, i) => b.classList.toggle('used', placed.includes(i)));
  };
  const check = async () => {
    if (placed.some(p => p == null)) return;
    if (placed.every((p, i) => tiles[p] === gs[i])) {
      $$('.slot').forEach(s => s.classList.add('good')); $$('.tilebtn').forEach(b => b.disabled = true);
      if (tries === 0) addStar(); confetti(12); $('#nextBtn').hidden = false;
      await blend(item.w, $$('.slot'), 120); praise();
    } else {
      tries++; shakeEl($('.slots')); say('Not quite. Listen again.');
      placed.forEach((p, i) => { if (tiles[p] !== gs[i]) placed[i] = null; }); draw();
    }
  };
  $$('.tilebtn').forEach(b => b.onclick = () => {
    const i = placed.indexOf(null); if (i < 0) return;
    placed[i] = +b.dataset.t; draw(); hush(); playSound(tiles[b.dataset.t]); setTimeout(check, 500);
  });
  $$('.slot').forEach(s => s.onclick = () => { if ($('#nextBtn').hidden) { placed[s.dataset.s] = null; draw(); } });
  $('#hear').onclick = async () => { hush(); await say(item.w); };
  $('#nextBtn').onclick = next;
  setTimeout(() => say(item.w), 300);
}

/* ---------- Game: Balloon Pop ---------- */
const BALLOON_COLOURS = ['#ff8c8c','#ffd56b','#8fe0a6','#9fc9ff','#d3b2ff','#ffb3de'];
function qBalloon(item) {
  const opts = shuffle([item, ...shuffle(pool().filter(x => x.w !== item.w)).slice(0, 3)]);
  let tries = 0, done = false;
  const cols = shuffle(BALLOON_COLOURS);
  render(`<div class="card">${progressHTML()}
    <p class="prompt">Pop the balloon that says the word!</p>
    <button class="big purple" id="hear">🔊 Hear the word</button>
    <div class="sky" id="sky">${opts.map((o, i) => `<button class="balloon" data-w="${o.w}"
      style="left:${1 + i * 25}%;--bc:${cols[i]};--dur:${7 + Math.random() * 3}s;--delay:${-Math.random() * 6}s;--top:${20 + (i % 2) * 120}px">${o.w}</button>`).join('')}</div>
    <div id="reveal" hidden><div class="pic pop">${item.e}</div><button class="big" id="nextBtn">Next ➜</button></div>
  </div>`);
  $$('.balloon').forEach(b => b.onclick = async () => {
    if (done) return;
    if (b.dataset.w === item.w) {
      done = true; b.classList.add('popped'); if (tries === 0) addStar(); confetti(14);
      $('#reveal').hidden = false; await say('Pop! ' + item.w); praise();
    } else {
      tries++; b.classList.remove('wobble'); void b.offsetWidth; b.classList.add('wobble');
      hush(); await say('That says ' + b.dataset.w + '. Try again!');
    }
  });
  $('#hear').onclick = () => { hush(); say(item.w); };
  $('#nextBtn').onclick = next;
  setTimeout(() => say('Pop ' + item.w), 300);
}

/* ---------- Game: Alien Words ---------- */
function qAlien(item) {
  render(`<div class="card">${progressHTML()}
    <p class="prompt">Blend it. Is it a real word or an alien word?</p>
    <div class="planet">${wordHTML(item.w)}</div>
    <div class="sortbtns">
      <button class="sortbtn real" data-a="1"><span>👑</span>Real word</button>
      <button class="sortbtn alien" data-a="0"><span>👽</span>Alien word</button>
    </div>
    <div id="reveal" hidden><div class="pic pop">${item.e}</div><p class="prompt" id="msg"></p><button class="big" id="nextBtn">Next ➜</button></div>
  </div>`);
  const btns = wireSounds(); let done = false;
  $$('.sortbtn').forEach(b => b.onclick = async () => {
    if (done) return; done = true;
    const right = (b.dataset.a === '1') === item.real;
    $$('.sortbtn').forEach(x => x.disabled = true);
    $('#msg').textContent = item.real ? `“${item.w}” is a real word!` : `“${item.w}” is an alien word!`;
    $('#reveal').hidden = false;
    if (right) { addStar(); confetti(10); }
    await blend(item.w, btns, 120);
    await say(right ? pick(PRAISE) : (item.real ? 'It was a real word.' : 'It was an alien word.'));
  });
  $('#nextBtn').onclick = next;
}

/* ---------- End of a round ---------- */
function finish() {
  const n = G.score, total = G.items.length, again = G.kind, st = G.newSticker;
  render(`<div class="card win">
    <div class="pic">${n >= total - 1 ? '🏆' : '🌟'}</div>
    <p class="prompt">${n >= total - 1 ? 'Super star reader!' : 'Good try! Keep practising!'}</p>
    <div class="starsrow" aria-label="${n} stars">${'⭐'.repeat(n)}</div>
    ${st ? `<p class="prompt">You won a new sticker!</p><div class="pic pop">${st}</div>` : ''}
    <div class="row"><button class="big" id="again">Play again</button><button class="big light" id="home2">🏠 Home</button></div>
  </div>`);
  confetti(30);
  say(`You got ${n} star${n === 1 ? '' : 's'}! ${st ? 'And a new sticker!' : ''}`);
  $('#again').onclick = () => go(again); $('#home2').onclick = home;
}

/* ---------- Stories ---------- */
function storiesForLevel() { return S.level === 'cvc' ? STORIES.filter(s => s.set === 'cvc') : S.level === 'dig' ? STORIES.filter(s => s.set === 'dig').concat(STORIES.filter(s => s.set === 'cvc')) : STORIES; }
function findStory(id) { return STORIES.find(s => s.id === id) || MyBooks.list.find(b => b.id === id); }
function shelf() {
  G = null;
  const mine = MyBooks.list;
  const badge = s => S.read.includes(s.id) ? '<span class="badge done">Read ✓</span>' : '';
  render(`<div class="stack">
    <div class="hello"><div class="owl" aria-hidden="true">🦉</div><div class="bubble">Pick a book to read!</div></div>
    ${mine.length ? `<p class="prompt" style="text-align:left">Our books</p>
    <div class="shelf">${mine.map(b => `<button class="cover" style="--bc:${SETTINGS[b.pages[0].setting].bc}" data-s="${esc(b.id)}">
      ${sceneHTML(b.pages[0], 'mini')}<b>${esc(b.title)}</b>${b.author ? `<small>by ${esc(b.author)}</small>` : ''}
      <span class="badge">${STAGES[b.stage].name}</span>${badge(b)}</button>`).join('')}</div>
    <p class="prompt" style="text-align:left">Library books</p>` : ''}
    <div class="shelf">${storiesForLevel().map(s => `<button class="cover" style="--bc:${s.bc}" data-s="${s.id}">
      <span class="ic">${s.icon}</span><b>${s.title}</b>
      ${S.read.includes(s.id) ? badge(s) : `<span class="badge">${s.set === 'cvc' ? 'Level 1' : 'Level 2'}</span>`}</button>`).join('')}</div>
    <div class="row"><button class="big light hold" id="makeHold"><span class="fill"></span>✨ Grown-ups: make a book (press and hold)</button></div>
  </div>`);
  $$('[data-s]').forEach(b => b.onclick = () => readStory(findStory(b.dataset.s), 0));
  holdToOpen($('#makeHold'), () => maker());
}
function wordClass(story, raw) {
  const clean = cleanWord(raw);
  if (story.custom) { const c = classify(raw, story.stage, story.names); return c === 'ok' ? '' : c; }
  return TRICKY.has(clean) ? 'tricky' : '';
}
function readStory(story, p) {
  if (p >= story.pages.length) return storyQuiz(story);
  const pg = story.pages[p];
  const custom = !Array.isArray(pg);
  const text = custom ? pg.text : pg[1];
  const words = text.split(/\s+/).filter(Boolean);
  const bc = custom ? SETTINGS[pg.setting].bc : story.bc;
  render(`<div class="page" style="--bc:${bc}">
    ${custom ? sceneHTML(pg) : `<div class="scene" aria-hidden="true">${pg[0]}</div>`}
    ${p === 0 && story.author ? `<p class="byline">by ${esc(story.author)}</p>` : ''}
    <div class="text">${words.map((t, i) => {
      const clean = cleanWord(t);
      return `<button class="tw ${wordClass(story, t)}" data-w="${clean}" data-i="${i}">${esc(t)}</button>`;
    }).join('')}</div>
    <div class="pager">
      <button class="iconbtn" id="prev" aria-label="Back" ${p === 0 ? 'disabled' : ''}>◀</button>
      <button class="big light" id="readme" aria-label="Read to me">🔊 Read</button>
      <span class="count">${p + 1}/${story.pages.length}</span>
      <button class="iconbtn" id="fwd" aria-label="Next page">▶</button>
    </div>
  </div>
  <p class="key">Tap a word to sound it out. <i></i>Yellow line = tricky word, just say it!</p>`);
  $$('.tw').forEach(b => b.onclick = async () => {
    hush(); const my = run; const w = b.dataset.w; b.classList.add('lit');
    if (!w) { if (my === run) b.classList.remove('lit'); return; }
    if (/tricky|name|hard/.test(b.className) || w.length < 2 || isSplitDigraph(w)) await say(w); else await showWord(w);
    if (my === run) b.classList.remove('lit');
  });
  $('#readme').onclick = async () => {
    hush(); const my = run; const tws = $$('.tw');
    for (const b of tws) { if (my !== run) return; b.classList.add('lit'); await say(b.dataset.w, S.rate * .95); b.classList.remove('lit'); }
  };
  $('#prev').onclick = () => readStory(story, p - 1);
  $('#fwd').onclick = () => readStory(story, p + 1);
  $$('.tw').forEach(b => { if (!b.dataset.w) b.disabled = true; });
  if (p === 0) say(story.title + (story.author ? ', by ' + story.author : ''));
}
async function showWord(w) {
  const pop = document.createElement('div'); pop.className = 'popout';
  pop.innerHTML = `<div class="card">${wordHTML(w)}<div class="row"><button class="big light" id="again2">🔊 Again</button><button class="big" id="close">Got it</button></div></div>`;
  document.body.appendChild(pop);
  const btns = wireSounds(pop);
  const close = () => { hush(); pop.remove(); };
  pop.querySelector('#close').onclick = close;
  pop.onclick = e => { if (e.target === pop) close(); };
  pop.querySelector('#again2').onclick = () => blend(w, btns);
  await blend(w, btns);
}
function finishBook(story) {
  if (!S.read.includes(story.id)) { S.read.push(story.id); G = { score: 0 }; addStar(); addStar(); save(); }
  const st = G && G.newSticker; G = null; return st;
}
function storyQuiz(story) {
  const q = story.q;
  const icon = story.custom ? esc((story.pages[0].figures[0] || { e: '📖' }).e) : story.icon;
  if (!q) {
    const st = finishBook(story);
    render(`<div class="card win"><div class="pic">${icon}</div><p class="prompt">The End! You read the whole book!</p>
      ${st ? `<p class="prompt">You won a new sticker!</p><div class="pic pop">${st}</div>` : ''}
      <div class="row"><button class="big" id="more">More books</button><button class="big light" id="home3">🏠 Home</button></div></div>`);
    confetti(24); say('The end! Well done. You read the whole book!');
    $('#more').onclick = shelf; $('#home3').onclick = home;
    return;
  }
  render(`<div class="card">
    <div class="pic">${icon}</div>
    <p class="prompt">The End! ${esc(q.text)}</p>
    <button class="big light" id="hearq">🔊 Hear the question</button>
    <div class="choices">${q.options.map((o, i) => `<button class="choice" data-i="${i}">${esc(o)}</button>`).join('')}</div>
    <div class="row" id="after" hidden><button class="big" id="more">More books</button><button class="big light" id="home3">🏠 Home</button></div>
  </div>`);
  let answered = false;
  $$('.choice').forEach(c => c.onclick = async () => {
    if (answered) return;
    if (+c.dataset.i === q.answer) {
      answered = true; c.classList.add('right'); confetti(24);
      const st = finishBook(story);
      $('#after').hidden = false;
      await say('Yes! Well done. You read the whole book!');
      if (st) await say('You won a new sticker!');
    } else { shakeEl(c); say('Not quite. Try again!'); }
  });
  $('#hearq').onclick = () => { hush(); say(q.text); };
  $('#more').onclick = shelf; $('#home3').onclick = home;
  say('The end! ' + q.text);
}

/* ---------- Stickers ---------- */
function stickers() {
  G = null;
  const got = Math.min(STICKERS.length, Math.floor(S.stars / STARS_PER_STICKER));
  const toNext = STARS_PER_STICKER - (S.stars % STARS_PER_STICKER);
  render(`<div class="card">
    <p class="prompt">My sticker book</p>
    <p class="muted">${got < STICKERS.length ? `${toNext} more ⭐ for the next sticker!` : 'You have every sticker!'}</p>
    <div class="stickers">${STICKERS.map((s, i) => i < got ? `<button class="stk got" data-s="${s}">${s}</button>` : `<div class="stk locked">?</div>`).join('')}</div>
  </div>`);
  $$('.stk.got').forEach(b => b.onclick = () => { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); });
  say(got ? `You have ${got} sticker${got === 1 ? '' : 's'}!` : 'Win stars to get stickers!');
}

/* ---------- Grown-ups ---------- */
function grownups() {
  G = null;
  const enVoices = voices.filter(v => /^en/i.test(v.lang));
  render(`<div class="stack">${installHTML()}
    <section class="panel">
      <h2>Which words?</h2>
      <div class="opts">${Object.entries({ cvc: 'Level 1: s a t p i n m d... (cat, dog)', dig: 'Level 2: sh ch th ng ee oo ai... (ship, moon)', mix: 'Both' })
        .map(([k, v]) => `<button class="opt ${S.level === k ? 'on' : ''}" data-l="${k}">${v}</button>`).join('')}</div>
      <p class="muted">Start on Level 1. Move to Level 2 once school has taught the "special friends" (two letters, one sound).</p>
    </section>
    <section class="panel">
      <h2>Voice</h2>
      <label for="voiceSel" class="muted">Pick a British voice if there is one.</label>
      <select id="voiceSel"><option value="">Automatic (British English if available)</option>${enVoices.map(v => `<option ${S.voice === v.name ? 'selected' : ''} value="${v.name}">${v.name} (${v.lang})</option>`).join('')}</select>
      <label for="rate" class="muted">Speaking speed</label>
      <input id="rate" type="range" min="0.5" max="1.1" step="0.05" value="${S.rate}">
      <div class="row" style="justify-content:flex-start"><button class="big light" id="test">🔊 Test: c-a-t</button></div>
    </section>
    <section class="panel">
      <h2>Record the sounds in your voice</h2>
      <p>Computer voices are not good at pure sounds. They often say "buh" for b, and some say "ess" for s. Schools teach short, clean sounds: "mmm" not "muh", and "t" without a "uh" on the end. Record each sound once and the app will use your voice in every game.</p>
      <p class="muted">Tap 🎙 and say the sound. It records for 1.5 seconds. ▶ plays it back and ✕ deletes it.</p>
      <p class="muted" id="recMsg"></p>
      <div class="recgrid">${RECORDABLE.map(g => `<div class="rec ${recorded[g] ? 'has' : ''}" data-g="${g}"><b>${g}</b>
        <button data-act="rec" aria-label="record ${g}">🎙</button><button data-act="play" aria-label="play ${g}">▶</button><button data-act="del" aria-label="delete ${g}">✕</button></div>`).join('')}</div>
    </section>
    <section class="panel">
      <h2>Make your own books</h2>
      <p>Record or type a story idea, for example what happened at the weekend. The app turns it into a short picture book using only words your child can read at their stage.</p>
      <div class="row" style="justify-content:flex-start"><button class="big purple" id="toMaker">✨ Make a book</button></div>
      <div id="myBooks">${MyBooks.list.map(b => `<div class="mybook" data-b="${esc(b.id)}"><span class="t">${esc(b.title)}${b.author ? ` by ${esc(b.author)}` : ''} · ${STAGES[b.stage].name}</span>
        <button class="big light small" data-act="read">Read</button><button class="big light small" data-act="edit">Edit</button><button class="big light small" data-act="del">Delete</button></div>`).join('') || '<p class="muted">No books yet.</p>'}</div>
    </section>
    <section class="panel">
      <h2>How to help at home</h2>
      <ul>
        <li><b>Little and often.</b> Ten minutes a day works better than an hour at the weekend. Stop while it is still fun.</li>
        <li><b>Use pure sounds.</b> Say "sss", "mmm", "t" with no "uh" on the end. Then c-a-t blends into "cat", not "cuh-a-tuh".</li>
        <li><b>Sound buttons.</b> A dot under a letter is one sound. A line under two letters (sh, ck, ee) means those letters make one sound together.</li>
        <li><b>Point and push.</b> Ask your child to touch each sound button as they say it, then sweep a finger under the word and say it fast.</li>
        <li><b>Oral blending games.</b> With no letters at all: "Touch your h-ea-d", "Can you find the c-u-p?", "I spy a d-o-g".</li>
        <li><b>Tricky words</b> (the, to, I, no, go, said) cannot be sounded out. Practise them as whole words.</li>
        <li><b>Ask the school</b> which phonics scheme they use (Little Wandle, Read Write Inc and Monster Phonics are common). Match the sound names and the order they teach.</li>
        <li><b>Read the school book first.</b> The decodable book that comes home matches what was taught. Use this app as extra practice.</li>
        <li><b>Alien words</b> get your child ready for the Year 1 Phonics Screening Check. That check includes made-up words so children have to blend, not guess.</li>
      </ul>
    </section>
    <section class="panel">
      <h2>Progress</h2>
      <p>${S.stars} stars and ${S.read.length} of ${STORIES.length} books read.</p>
      <div class="row" style="justify-content:flex-start" id="resetRow"><button class="big light" id="reset">Reset stars and books</button></div>
    </section>
  </div>`);
  $$('[data-l]').forEach(b => b.onclick = () => { S.level = b.dataset.l; save(); $$('[data-l]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#voiceSel').onchange = e => { S.voice = e.target.value; save(); };
  $('#rate').oninput = e => { S.rate = +e.target.value; save(); };
  $('#test').onclick = () => blend('cat');
  $('#reset').onclick = () => {
    $('#resetRow').innerHTML = `<span class="muted">Delete all stars and stickers?</span><button class="big light" id="yes">Yes, reset</button><button class="big" id="no">Keep them</button>`;
    $('#yes').onclick = () => { S.stars = 0; S.read = []; save(); setStars(); grownups(); };
    $('#no').onclick = grownups;
  };
  $$('.rec button').forEach(b => b.onclick = () => recAction(b.closest('.rec'), b.dataset.act));
  $('#toMaker').onclick = () => maker();
  wireInstall();
  $$('.mybook button').forEach(btn => btn.onclick = async () => {
    const row = btn.closest('.mybook'); const book = MyBooks.list.find(b => b.id === row.dataset.b);
    if (!book) return;
    if (btn.dataset.act === 'read') return readStory(book, 0);
    if (btn.dataset.act === 'edit') return editor(JSON.parse(JSON.stringify(book)));
    row.innerHTML = `<span class="t">Delete “${esc(book.title)}”?</span><button class="big light small" data-x="yes">Yes, delete</button><button class="big small" data-x="no">Keep it</button>`;
    row.querySelector('[data-x=yes]').onclick = async () => { await MyBooks.remove(book.id); grownups(); };
    row.querySelector('[data-x=no]').onclick = grownups;
  });
}
async function recAction(box, act) {
  const g = box.dataset.g; const msg = $('#recMsg');
  if (act === 'play') { if (recorded[g]) playUrl(recorded[g]); else playSound(g); return; }
  if (act === 'del') {
    if (recorded[g]) { URL.revokeObjectURL(recorded[g]); delete recorded[g]; }
    try { await idb.del(g); } catch (e) {}
    box.classList.remove('has'); return;
  }
  try {
    if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('unsupported');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream); const chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach(t => t.stop()); box.classList.remove('recording');
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      if (recorded[g]) URL.revokeObjectURL(recorded[g]);
      recorded[g] = URL.createObjectURL(blob); box.classList.add('has');
      try { if (!idb.db) await idb.open(); await idb.put(g, blob); msg.textContent = ''; }
      catch (e) { msg.textContent = 'Saved for now, but this browser will forget it when the page closes.'; }
      playUrl(recorded[g]);
    };
    box.classList.add('recording'); rec.start(); setTimeout(() => rec.state !== 'inactive' && rec.stop(), 1500);
  } catch (e) {
    msg.textContent = 'This browser will not let the app use the microphone here. Open the app from its GitHub Pages link (see README) and allow the microphone.';
  }
}
