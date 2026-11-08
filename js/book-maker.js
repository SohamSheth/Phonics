/* Blend & Read: Book maker: a voice note or typed idea becomes a decodable picture book. */
'use strict';

/* =====================================================================
   BOOK MAKER: a voice note or typed idea becomes a decodable picture book
   ===================================================================== */
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const clamp = (v, a, b, d) => Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d;

/* ---------- Stages: which sounds and tricky words a child knows ---------- */
const P2 = ['s','a','t','p','i','n','m','d','g','o','c','k','ck','e','u','r','h','b','f','l','ff','ll','ss'];
const P3 = P2.concat(['j','v','w','x','y','z','zz','qu','ch','sh','th','ng','nk','ai','ee','igh','oa','oo','ar','or','ur','ow','oi','ear','air','er']);
const P5 = P3.concat(['ay','ou','ie','ea','oy','ir','ue','aw','wh','ph','ew','oe','au','ey']);
const T2 = ['the','to','i','no','go','into','is','as','has','his','a','put','pull','full','push','of'];
const T3 = T2.concat(['he','she','we','me','be','was','you','they','all','are','my','her']);
const T4 = T3.concat(['said','so','have','like','some','come','were','there','little','one','do','when','out','what','says','here','today']);
const T5 = T4.concat(['oh','their','people','mr','mrs','looked','called','asked','could','would','should','water','where','who','again',
  'thought','through','work','mouse','many','laughed','because','different','any','eyes','friends','once','please']);
const STAGES = {
  p2: { name: 'Stage 1', sub: 'Three-letter words', eg: 'cat, sun, big', g: P2, t: T2, clusters: false, max: 6,
        rule: 'Words must be short, like cat, sun, big, hen, dog. No two consonant sounds next to each other (so no "frog", "jump", "stop"), except a plural s at the end (cats).' },
  p3: { name: 'Stage 2', sub: 'Special friends: sh ch th ng ee oo ai ar…', eg: 'ship, moon, rain', g: P3, t: T3, clusters: false, max: 8,
        rule: 'Words may use two-letter and three-letter sounds like ship, chip, moon, rain, night, car, fork. No two consonant sounds next to each other (so no "frog", "jump", "stop"), except a plural s at the end.' },
  p4: { name: 'Stage 3', sub: 'Blends like fr, st, mp', eg: 'frog, jump, stop', g: P3, t: T4, clusters: true, max: 10,
        rule: 'Words may have consonant blends at the start or end, like frog, jump, stop, milk, tent, sweets. Only use the sounds listed; no other spellings of sounds.' },
  p5: { name: 'Stage 4', sub: 'More ways to spell sounds', eg: 'play, cake, cloud', g: P5, t: T5, clusters: true, max: 12, split: true,
        rule: 'Words may also use alternative spellings like play, cloud, pie, sea, boy, bird, blue, saw, new, and split digraphs like cake, time, home, cute, these.' }
};
const STAGE_KEYS = Object.keys(STAGES);
const ALWAYS_OK = new Set(['and']);
const isVowelish = g => /[aeiou]/.test(g);
function cleanWord(t) { return String(t).toLowerCase().replace(/[’']s$/, '').replace(/[^a-z]/g, ''); }
function isSplitDigraph(w) { return /^[^aeiou]*[aeiou][^aeiouwy]e(s|d)?$/.test(w) && !/(ee|oe|ie|ue|ye)$/.test(w); }
function segment(w, allowed) {
  const set = new Set(allowed); const best = Array(w.length + 1).fill(null); best[0] = [];
  for (let i = 0; i < w.length; i++) {
    if (!best[i]) continue;
    for (const L of [3, 2, 1]) { const g = w.slice(i, i + L); if (g.length === L && set.has(g) && !best[i + L]) best[i + L] = best[i].concat(g); }
  }
  return best[w.length];
}
// 'ok' (can be sounded out), 'tricky' (taught tricky word), 'name', or 'hard' (above this stage)
function classify(raw, stageKey, names) {
  const w = cleanWord(raw); const st = STAGES[stageKey] || STAGES.p2;
  if (!w || ALWAYS_OK.has(w)) return 'ok';
  if ((names || []).includes(w)) return 'name';
  if (st.t.includes(w)) return 'tricky';
  let seg = segment(w, st.g);
  if (!seg && st.split && isSplitDigraph(w)) seg = segment(w.replace(/([aeiou])([^aeiou])e(s|d)?$/, '$2$3'), st.g);
  if (!seg) return 'hard';
  if (!st.clusters) {
    const core = seg.length > 2 && seg[seg.length - 1] === 's' && !isVowelish(seg[seg.length - 2]) ? seg.slice(0, -1) : seg;
    for (let i = 1; i < core.length; i++) if (!isVowelish(core[i]) && !isVowelish(core[i - 1])) return 'hard';
  }
  return 'ok';
}
function bookWords(book) { return [book.title, ...book.pages.map(p => p.text)].join(' ').split(/\s+/).filter(Boolean); }
function hardWords(book) { return [...new Set(bookWords(book).filter(t => classify(t, book.stage, book.names) === 'hard').map(cleanWord))]; }

/* ---------- Picture settings (hand-drawn backgrounds) ---------- */
const svgWrap = inner => `<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${inner}</svg>`;
const clouds = '<g fill="#fff"><ellipse cx="90" cy="48" rx="34" ry="12"/><ellipse cx="114" cy="40" rx="22" ry="12"/><ellipse cx="250" cy="66" rx="28" ry="10"/><ellipse cx="268" cy="60" rx="16" ry="9"/></g>';
const sun = '<circle cx="345" cy="42" r="24" fill="#ffd34d"/><circle cx="345" cy="42" r="32" fill="#ffd34d" opacity=".3"/>';
const starsDots = (fill) => `<g fill="${fill}">${[[30,30],[80,70],[140,25],[200,55],[260,20],[300,80],[370,110],[110,120],[30,140],[220,110]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.6 : 2.6}"/>`).join('')}</g>`;
const SETTINGS = {
  park:   { label: 'Park', bc: '#d9f2c9', svg: svgWrap(`<rect width="400" height="250" fill="#9fd8fb"/>${sun}${clouds}<ellipse cx="80" cy="195" rx="190" ry="60" fill="#8fd16a"/><ellipse cx="330" cy="205" rx="170" ry="55" fill="#7cc35a"/><rect y="200" width="400" height="50" fill="#6bb24c"/><rect x="52" y="120" width="10" height="50" fill="#8b5a2b"/><circle cx="57" cy="110" r="28" fill="#3f9e4d"/>`) },
  beach:  { label: 'Beach', bc: '#fff0c2', svg: svgWrap(`<rect width="400" height="250" fill="#a8dcfa"/>${sun}${clouds}<rect y="118" width="400" height="62" fill="#3fa7e0"/><path d="M0 128 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><path d="M0 172 q100 -14 200 0 t200 0 V250 H0 Z" fill="#f5d78e"/>`) },
  sea:    { label: 'Sea', bc: '#c9e8fb', svg: svgWrap(`<rect width="400" height="250" fill="#b5e2fb"/>${clouds}<rect y="100" width="400" height="150" fill="#2f8fd0"/><g stroke="#6fc0ef" stroke-width="3" fill="none"><path d="M10 140 q15 -8 30 0 t30 0"/><path d="M220 130 q15 -8 30 0 t30 0"/><path d="M120 190 q15 -8 30 0 t30 0"/><path d="M300 210 q15 -8 30 0 t30 0"/></g>`) },
  night:  { label: 'Night', bc: '#d4d6f2', svg: svgWrap(`<rect width="400" height="250" fill="#1d2457"/>${starsDots('#fff6c7')}<circle cx="320" cy="55" r="26" fill="#fff3b0"/><circle cx="333" cy="47" r="22" fill="#1d2457"/><ellipse cx="120" cy="230" rx="240" ry="70" fill="#2c3a6e"/><ellipse cx="360" cy="240" rx="160" ry="55" fill="#263264"/>`) },
  home:   { label: 'Home', bc: '#ffe6d0', svg: svgWrap(`<rect width="400" height="250" fill="#ffe3c9"/><rect x="40" y="36" width="120" height="86" rx="6" fill="#a8dcfa" stroke="#fff" stroke-width="8"/><path d="M100 36 V122 M40 79 H160" stroke="#fff" stroke-width="6"/><rect x="250" y="50" width="70" height="52" rx="4" fill="#f2a65a" stroke="#c9782f" stroke-width="5"/><circle cx="285" cy="76" r="12" fill="#ffd34d"/><rect y="178" width="400" height="72" fill="#c98a5a"/><ellipse cx="200" cy="215" rx="130" ry="22" fill="#e86f6f"/>`) },
  farm:   { label: 'Farm', bc: '#f3e3c3', svg: svgWrap(`<rect width="400" height="250" fill="#a8dcfa"/>${sun}${clouds}<rect y="165" width="400" height="85" fill="#9bd36d"/><rect x="262" y="104" width="100" height="78" fill="#d9483b"/><polygon points="252,108 312,64 372,108" fill="#a3322a"/><rect x="296" y="138" width="32" height="44" fill="#fff"/><path d="M296 138 L328 182 M328 138 L296 182" stroke="#d9483b" stroke-width="4"/><g stroke="#8b5a2b" stroke-width="5"><path d="M0 178 H230 M0 196 H230"/><path d="M20 170 V205 M70 170 V205 M120 170 V205 M170 170 V205 M220 170 V205"/></g>`) },
  forest: { label: 'Woods', bc: '#d4ecd0', svg: svgWrap(`<rect width="400" height="250" fill="#c5ecd3"/><rect y="190" width="400" height="60" fill="#5fae5a"/>${[[40,1],[110,.8],[190,1.1],[290,.9],[360,1.05]].map(([x, s]) => `<rect x="${x - 6}" y="${190 - 30 * s}" width="12" height="${30 * s + 4}" fill="#8b5a2b"/><polygon points="${x - 40 * s},${195 - 30 * s} ${x},${195 - 150 * s} ${x + 40 * s},${195 - 30 * s}" fill="${s > 1 ? '#2e8b57' : '#3fa36a'}"/>`).join('')}`) },
  town:   { label: 'Town', bc: '#dde7f5', svg: svgWrap(`<rect width="400" height="250" fill="#b8e1fa"/>${clouds}${[[10,70,'#f2a65a'],[95,40,'#7bb3e0'],[180,90,'#e4789a'],[255,55,'#a98be0'],[335,80,'#f2a65a']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="70" height="${200 - y}" fill="${c}"/><g fill="#fff6c7">${[0, 1, 2, 3, 4].filter(r => y + 15 + r * 32 < 175).map(r => `<rect x="${x + 12}" y="${y + 15 + r * 32}" width="16" height="18"/><rect x="${x + 42}" y="${y + 15 + r * 32}" width="16" height="18"/>`).join('')}</g>`).join('')}<rect y="196" width="400" height="54" fill="#6b7280"/><path d="M0 223 H400" stroke="#fff" stroke-width="4" stroke-dasharray="26 18"/>`) },
  snow:   { label: 'Snow', bc: '#e6f1fb', svg: svgWrap(`<rect width="400" height="250" fill="#b9d9f5"/>${starsDots('#fff')}<ellipse cx="90" cy="200" rx="200" ry="70" fill="#fff"/><ellipse cx="330" cy="210" rx="170" ry="60" fill="#f1f7ff"/><rect y="215" width="400" height="35" fill="#fff"/>`) },
  space:  { label: 'Space', bc: '#ddd3f3', svg: svgWrap(`<rect width="400" height="250" fill="#1a1033"/>${starsDots('#fff')}<circle cx="300" cy="80" r="34" fill="#f2a65a"/><ellipse cx="300" cy="80" rx="58" ry="12" fill="none" stroke="#ffd98a" stroke-width="5"/><circle cx="70" cy="60" r="14" fill="#7bb3e0"/><ellipse cx="200" cy="270" rx="260" ry="80" fill="#9a8fb8"/><circle cx="120" cy="215" r="10" fill="#7f74a3"/><circle cx="260" cy="225" r="14" fill="#7f74a3"/>`) }
};
function sceneHTML(page, cls = '') {
  const set = SETTINGS[page.setting] || SETTINGS.park;
  return `<div class="stage ${cls}" aria-hidden="true">${set.svg}${(page.figures || []).map((f, i) =>
    `<span class="fig s${f.s}" style="left:${f.x}%;top:${f.y}%;animation-delay:${(i * .5).toFixed(1)}s">${esc(f.e)}</span>`).join('')}</div>`;
}

/* ---------- Saving books: this device, plus the Claude page's private store when available ---------- */
const MyBooks = {
  list: store.get('books', []).filter(b => b && Array.isArray(b.pages) && b.pages.length && STAGES[b.stage]),
  col: null,
  keepLocal() { store.set('books', this.list); },
  async connect() {
    try {
      if (!window.claude || !window.claude.use) return;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      const col = db.collection('data/users/' + id);
      const snap = await Promise.race([col.get(), wait(10000).then(() => null)]);
      if (!snap) return;
      this.col = col;
      const byId = new Map(this.list.map(b => [b.id, b]));
      for (const d of snap.docs) { const b = d.data(); if (b && Array.isArray(b.pages) && STAGES[b.stage] && (!byId.has(b.id) || (b.updated || 0) > (byId.get(b.id).updated || 0))) byId.set(b.id, b); }
      this.list = [...byId.values()].sort((a, b) => (b.updated || 0) - (a.updated || 0));
      this.keepLocal();
    } catch (e) {}
  },
  async save(book) {
    book.updated = Date.now();
    this.list = [book, ...this.list.filter(b => b.id !== book.id)];
    this.keepLocal();
    if (this.col) { try { await this.col.doc(book.id).set(book); } catch (e) {} }
  },
  async remove(id) {
    this.list = this.list.filter(b => b.id !== id); this.keepLocal();
    if (this.col) { try { await this.col.doc(id).delete(); } catch (e) {} }
  }
};

/* ---------- Turning a voice note into text ---------- */
let asr = null;
async function decodeTo16k(blob) {
  const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
  const decoded = await ac.decodeAudioData(await blob.arrayBuffer());
  try { ac.close(); } catch (e) {}
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000);
  const src = off.createBufferSource(); src.buffer = decoded; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0);
}
async function transcribe(blob, status) {
  if (!asr) {
    status('Getting the listening helper ready. The first time downloads about 40 MB, then it is saved…');
    const tf = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2/dist/transformers.min.js');
    asr = await tf.pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      progress_callback: p => { if (p.status === 'progress' && p.total) status(`Downloading the listening helper… ${Math.round(p.loaded / p.total * 100)}%`); }
    });
  }
  status('Listening to the recording…');
  const audio = await decodeTo16k(blob);
  const out = await asr(audio, { chunk_length_s: 30, stride_length_s: 5 });
  return String(out.text || '').replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
}

/* ---------- Asking Claude to write the book ---------- */
let samplePromise = null;
function getSample() {
  if (!samplePromise) samplePromise = (window.claude && window.claude.use) ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
  return samplePromise;
}
const SAMPLE_ERRORS = {
  not_granted: 'You chose not to let this page use Claude. Reload the page to be asked again, or write the pages yourself.',
  rate_limited: 'Claude is busy. Wait a minute and try again.',
  cancelled: 'Stopped.',
  refused: 'Claude could not write this story. Try a different idea.',
  prompt_too_large: 'The story idea is too long. Try a shorter one.',
  invalid_json: 'Claude’s answer came back muddled. Press Make the book again.'
};
async function callApi(turns, signal) {
  // Direct call with the grown-up's own API key (used when the app runs outside Claude, e.g. GitHub Pages).
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', signal,
    headers: {
      'content-type': 'application/json', 'x-api-key': store.get('apikey', ''),
      'anthropic-version': '2026-10-21', 'anthropic-beta': 'server-side-fallback-2026-07-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model: 'claude-opus-5-5', max_tokens: 16000, fallbacks: 'default', output_config: { effort: 'medium' }, messages: turns })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(r.status === 401 ? 'The API key was not accepted. Check it in step 3.' : (j.error && j.error.message) || `Claude returned an error (${r.status}).`);
  if (j.stop_reason === 'refusal') throw new Error(SAMPLE_ERRORS.refused);
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
}
async function writerKind() { return (await getSample()) ? 'claude' : store.get('apikey', '') ? 'api' : 'none'; }
async function ask(turns, onProgress, signal) {
  const s = await getSample();
  if (s) {
    try { return (await s(turns, { signal, onText: ({ text }) => onProgress(text.length) })).text; }
    catch (e) { throw new Error(SAMPLE_ERRORS[e && e.code] || 'Something went wrong talking to Claude. Try again.'); }
  }
  if (store.get('apikey', '')) {
    try { return await callApi(turns, signal); }
    catch (e) { throw new Error(e.name === 'AbortError' ? 'Stopped.' : e.message); }
  }
  return null;
}
function parseJSON(text) {
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error(SAMPLE_ERRORS.invalid_json);
  try { return JSON.parse(text.slice(a, b + 1)); } catch (e) { throw new Error(SAMPLE_ERRORS.invalid_json); }
}
function buildPrompt(o) {
  const st = STAGES[o.stage];
  return `You are writing a decodable picture book for a 4 or 5 year old in a UK Reception class who is learning to read with phonics (systematic synthetic phonics, as in Little Wandle or Letters and Sounds).

A parent told you this story idea (it may come from a voice note, so it may be messy):
"""
${o.idea}
"""

The child is at ${st.name} (${st.sub}).
The child can sound out words made ONLY from these graphemes: ${st.g.join(' ')}
${st.rule}
The child also knows these tricky words, which you may use: ${st.t.join(', ')}
${o.name ? `The child's name is "${o.name}". You may use it.` : ''}
You may use up to two other first names from the story idea (people or pets) if they matter to the story.
Every other word MUST be decodable with the graphemes above. Never use any other word, however simple it seems. Prefer three-letter words wherever you can.

Write exactly ${o.pages} pages that keep the heart of the parent's story, simplified, with a happy ending. Each page has one or two very short sentences, at most ${st.max} words on the page. Repeat useful words across pages. Use capital letters and full stops normally.

For each page choose a setting from: ${Object.keys(SETTINGS).join(', ')}.
For each page choose 1 to 4 emoji "figures" that show what happens on that page, each with x from 5 to 95 (left to right), y from 10 to 90 (top to bottom: things on the ground sit at about 72 to 82, things in the sky at 15 to 35), and size 1 (small), 2 (medium) or 3 (large). The main character is usually size 3. Do not overlap figures.

Also write a short title (decodable, up to 5 words), list the first names you used, and one simple question about the story with 3 emoji answer options, one correct.

Reply with only JSON in exactly this shape:
{"title":"...","names":["..."],"pages":[{"text":"...","setting":"park","figures":[{"emoji":"🐶","x":40,"y":75,"size":3}]}],"question":{"text":"...","options":["🐶","🐱","🐷"],"answer":0}}`;
}
function cleanEmoji(e) {
  e = String(e || '').trim();
  return e && e.length <= 14 && !/[<>&"'`a-zA-Z0-9\s]/.test(e) ? e : '';
}
function normBook(raw, o) {
  const names = [...new Set([o.name, ...(Array.isArray(raw.names) ? raw.names : [])].map(cleanWord).filter(n => n && n.length < 20))].slice(0, 4);
  const pages = (Array.isArray(raw.pages) ? raw.pages : []).slice(0, 12).map(p => ({
    text: String((p && p.text) || '').replace(/\s+/g, ' ').trim().slice(0, 160),
    setting: SETTINGS[p && p.setting] ? p.setting : 'park',
    figures: (Array.isArray(p && p.figures) ? p.figures : []).slice(0, 5)
      .map(f => ({ e: cleanEmoji(f && (f.emoji || f.e)), x: clamp(+(f && f.x), 5, 95, 50), y: clamp(+(f && f.y), 10, 90, 72), s: [1, 2, 3].includes(+(f && (f.size || f.s))) ? +(f.size || f.s) : 2 }))
      .filter(f => f.e)
  })).filter(p => p.text);
  let q = null; const rq = raw.question;
  if (rq && Array.isArray(rq.options)) {
    const opts = rq.options.slice(0, 3).map(cleanEmoji);
    if (opts.length === 3 && opts.every(Boolean) && [0, 1, 2].includes(+rq.answer)) q = { text: String(rq.text || '').slice(0, 120), options: opts, answer: +rq.answer };
  }
  return { id: o.id || 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), custom: true,
    title: String(raw.title || 'Our Story').replace(/\s+/g, ' ').trim().slice(0, 60), stage: o.stage, names, idea: o.idea, pages, q,
    author: String(o.author || '').replace(/\s+/g, ' ').trim().slice(0, 40) };
}

/* ---------- Without AI: split the idea into pages and guess pictures ---------- */
const EXTRA_EMOJI = { boy:'👦', girl:'👧', baby:'👶', nan:'👵', nana:'👵', granny:'👵', grandma:'👵', grandad:'👴', grandpa:'👴', ball:'⚽', kite:'🪁',
  cake:'🎂', ice:'🍦', icecream:'🍦', tree:'🌳', flower:'🌸', flowers:'🌸', rocket:'🚀', dinosaur:'🦖', dino:'🦖', frog:'🐸', horse:'🐴', lion:'🦁',
  tiger:'🐯', bear:'🐻', rabbit:'🐰', bunny:'🐰', mouse:'🐭', elephant:'🐘', monkey:'🐵', bird:'🐦', duck:'🦆', plane:'✈️', bike:'🚲', castle:'🏰',
  sandcastle:'🏰', dragon:'🐉', unicorn:'🦄', robot:'🤖', pizza:'🍕', apple:'🍎', banana:'🍌', present:'🎁', party:'🎉', snowman:'⛄', crab:'🦀',
  shell:'🐚', car:'🚗', train:'🚂', bus:'🚌', boat:'⛵', fish:'🐟', dog:'🐶', puppy:'🐶', cat:'🐱', kitten:'🐱', teddy:'🧸', book:'📖', star:'⭐',
  moon:'🌙', sun:'☀️', rain:'🌧️', snow:'❄️', school:'🏫', shop:'🏪', house:'🏠', home:'🏠', bed:'🛏️', spider:'🕷️', butterfly:'🦋', worm:'🪱',
  sheep:'🐑', cow:'🐄', pig:'🐷', hen:'🐔', chicken:'🐔', owl:'🦉', fox:'🦊', mum:'👩', mummy:'👩', mom:'👩', dad:'🧔', daddy:'🧔', alien:'👽' };
const WORD_EMOJI = Object.assign({}, ...CVC.concat(DIGRAPH).map(x => ({ [x.w]: x.e })), EXTRA_EMOJI);
const SETTING_WORDS = { space: ['space','rocket','planet','alien','astronaut'], snow: ['snow','snowman','ice','cold','sledge'], beach: ['beach','sand','seaside','sandcastle','crab'],
  sea: ['sea','boat','ship','swim','swimming','ocean','pirate'], farm: ['farm','cow','pig','hen','sheep','tractor','goat','horse'], forest: ['forest','wood','woods','trees','owl','fox'],
  town: ['town','shop','shops','bus','road','street','school','city'], night: ['night','moon','stars','dark','sleep','bedtime'], home: ['home','house','kitchen','bed','bath','room','sofa'] };
function guessSetting(text, fallback) {
  const ws = text.toLowerCase().match(/[a-z]+/g) || [];
  for (const [k, list] of Object.entries(SETTING_WORDS)) if (ws.some(w => list.includes(w))) return k;
  return fallback || 'park';
}
function guessFigures(text) {
  const ws = text.toLowerCase().match(/[a-z]+/g) || []; const found = [];
  for (const w of ws) { const e = WORD_EMOJI[w] || WORD_EMOJI[w.replace(/s$/, '')]; if (e && !found.includes(e)) found.push(e); }
  const xs = [32, 60, 82], sz = [3, 2, 2];
  return found.slice(0, 3).map((e, i) => ({ e, x: xs[i], y: 74, s: sz[i] }));
}
function offlineBook(o) {
  const parts = o.idea.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean).slice(0, o.pages);
  let setting = 'park';
  const pages = parts.map(t => { setting = guessSetting(t, setting); return { text: t.charAt(0).toUpperCase() + t.slice(1) + '.', setting, figures: guessFigures(t) }; });
  // Words that are always written with a capital letter are probably names (Max, Nana, Leo).
  const all = o.idea.match(/[A-Za-z]+/g) || [];
  const names = [...new Set(all.filter(w => /^[A-Z][a-z]/.test(w) && !T5.includes(w.toLowerCase()) &&
    all.every(x => x.toLowerCase() !== w.toLowerCase() || /^[A-Z]/.test(x))))].slice(0, 3);
  return normBook({ title: 'Big Fun', pages, names }, o);
}
async function makeBook(o, status, signal) {
  const turns = [{ role: 'user', content: buildPrompt(o) }];
  status('Writing the book… (this can take up to a minute)');
  let text = await ask(turns, n => status(`Writing the book… ${n} letters so far`), signal);
  if (text == null) return offlineBook(o);
  let book = normBook(parseJSON(text), o);
  if (!book.pages.length) throw new Error(SAMPLE_ERRORS.invalid_json);
  const hard = hardWords(book);
  if (hard.length) {
    status(`Checking every word… swapping ${hard.length} word${hard.length === 1 ? '' : 's'} that ${hard.length === 1 ? 'is' : 'are'} too hard`);
    turns.push({ role: 'assistant', content: text }, { role: 'user', content:
      `These words are too hard for ${STAGES[o.stage].name}: ${hard.join(', ')}. Rewrite only the sentences or title that use them, using allowed words instead, and keep every other rule. Reply with the full JSON again.` });
    try { const b2 = normBook(parseJSON(await ask(turns, () => {}, signal)), o); if (b2.pages.length && hardWords(b2).length < hard.length) book = b2; }
    catch (e) { if (/Stopped/.test(e.message)) throw e; }
  }
  return book;
}

/* ---------- Maker screen ---------- */
const M = { idea: '', stage: null, pages: 6, name: store.get('kidname', ''), author: store.get('author', store.get('kidname', '')) };
function maker() {
  G = null;
  if (!M.stage) M.stage = S.level === 'cvc' ? 'p2' : 'p3';
  const canDictate = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  render(`<div class="stack">
    <section class="panel">
      <h2>1. Tell the story idea</h2>
      <p>Record a voice note, upload one you already have, or type the idea. For example: <i>“Max went to the beach with Dad. He dug a big hole and found a crab.”</i></p>
      <div class="row" style="justify-content:flex-start">
        <button class="big light small" id="recBtn">🎙 Record</button>
        <button class="big light small" id="upBtn">📁 Upload a recording</button>
        ${canDictate ? '<button class="big light small" id="dictBtn">🗣 Dictate</button>' : ''}
        <input type="file" id="upFile" accept="audio/*,video/*,.m4a,.mp3,.wav,.ogg,.webm,.aac" hidden>
      </div>
      <p class="status" id="tStatus" role="status"></p>
      <div class="field"><label for="idea">Story idea</label><textarea id="idea" rows="4" placeholder="Type or paste the story here">${esc(M.idea)}</textarea></div>
    </section>
    <section class="panel">
      <h2>2. Choose the reading stage</h2>
      <div class="stagepick">${STAGE_KEYS.map(k => `<button class="opt ${M.stage === k ? 'on' : ''}" data-st="${k}">${STAGES[k].name}<small>${STAGES[k].sub}<br>e.g. ${STAGES[k].eg}</small></button>`).join('')}</div>
      <div class="edrow">
        <div class="field"><label for="kidName">Child’s name (optional)</label><input type="text" id="kidName" value="${esc(M.name)}" autocomplete="off"></div>
        <div class="field"><label for="author">Story by (shown on the cover)</label><input type="text" id="author" value="${esc(M.author)}" placeholder="e.g. Leo, age 4" autocomplete="off"></div>
        <div class="field"><span class="lbl">Pages</span><div class="opts">${[4, 6, 8].map(n => `<button class="opt ${M.pages === n ? 'on' : ''}" data-pg="${n}">${n}</button>`).join('')}</div></div>
      </div>
    </section>
    <section class="panel">
      <h2>3. Make the book</h2>
      <p class="muted" id="writerNote"></p>
      <details id="keyBox" hidden><summary class="lbl">Use your own Claude API key</summary>
        <p class="muted">The key is saved only in this browser on this device and is sent only to Anthropic. Anyone using this device could use it, so only add it on your own device.</p>
        <div class="edrow"><input type="password" id="apiKey" placeholder="sk-ant-…" autocomplete="off"><button class="big light small" id="saveKey" style="flex:0 0 auto">Save key</button></div>
      </details>
      <div class="row" style="justify-content:flex-start"><button class="big purple" id="makeBtn">✨ Make the book</button><button class="big light" id="stopBtn" hidden>Stop</button></div>
      <p class="status" id="gStatus" role="status"></p>
    </section>
  </div>`);

  const tStatus = (m, err) => { $('#tStatus').textContent = m; $('#tStatus').classList.toggle('err', !!err); };
  const gStatus = (m, err) => { $('#gStatus').textContent = m; $('#gStatus').classList.toggle('err', !!err); };
  const ideaBox = $('#idea');
  const addText = t => { if (!t) return; ideaBox.value = (ideaBox.value.trim() ? ideaBox.value.trim() + ' ' : '') + t; M.idea = ideaBox.value; };
  ideaBox.oninput = () => { M.idea = ideaBox.value; };
  $('#kidName').oninput = e => { M.name = e.target.value.trim(); store.set('kidname', M.name); };
  $('#author').oninput = e => { M.author = e.target.value.trim(); store.set('author', M.author); };
  $$('[data-st]').forEach(b => b.onclick = () => { M.stage = b.dataset.st; $$('[data-st]').forEach(x => x.classList.toggle('on', x === b)); });
  $$('[data-pg]').forEach(b => b.onclick = () => { M.pages = +b.dataset.pg; $$('[data-pg]').forEach(x => x.classList.toggle('on', x === b)); });

  const runTranscribe = async blob => {
    try { addText(await transcribe(blob, m => tStatus(m))); tStatus(ideaBox.value ? 'Done. Check the words below and fix anything it misheard.' : 'I could not hear any words in that recording.'); }
    catch (e) { tStatus('Voice notes cannot be turned into text here. ' + (canDictate ? 'Try 🗣 Dictate, or type the idea.' : 'Please type the idea instead.') + ' (Voice notes work when the app is opened from its own web address, for example GitHub Pages.)', true); }
  };
  $('#upBtn').onclick = () => $('#upFile').click();
  $('#upFile').onchange = e => { const f = e.target.files[0]; if (f) runTranscribe(f); e.target.value = ''; };

  let rec = null;
  $('#recBtn').onclick = async () => {
    if (rec) { rec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = []; rec = new MediaRecorder(stream);
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); $('#recBtn').textContent = '🎙 Record'; const r = rec; rec = null; runTranscribe(new Blob(chunks, { type: r.mimeType || 'audio/webm' })); };
      rec.start(); $('#recBtn').textContent = '⏹ Stop recording'; tStatus('Recording… tell the story, then press Stop.');
      setTimeout(() => rec && rec.state === 'recording' && rec.stop(), 180000);
    } catch (e) { rec = null; tStatus('The microphone is not available here. ' + (canDictate ? 'Try 🗣 Dictate, upload a recording, or type the idea.' : 'Upload a recording or type the idea.'), true); }
  };

  if (canDictate) {
    let sr = null;
    $('#dictBtn').onclick = () => {
      if (sr) { sr.stop(); return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      sr = new SR(); sr.lang = 'en-GB'; sr.continuous = true; sr.interimResults = false;
      sr.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) addText(e.results[i][0].transcript.trim()); };
      sr.onerror = e => tStatus(e.error === 'not-allowed' ? 'The microphone is not available here. Please type the idea.' : 'Dictation stopped. Press 🗣 Dictate to carry on.', true);
      sr.onend = () => { sr = null; $('#dictBtn').textContent = '🗣 Dictate'; };
      try { sr.start(); $('#dictBtn').textContent = '⏹ Stop dictating'; tStatus('Listening… tell the story.'); } catch (e) { sr = null; }
    };
  }

  writerKind().then(k => {
    $('#writerNote').textContent = k === 'claude' ? 'Claude will write the book, then every word is checked against the stage.'
      : k === 'api' ? 'Claude will write the book using your API key, then every word is checked against the stage.'
      : 'No book writer is connected, so the app will split your idea into pages and you can simplify the words yourself. Words above the stage are marked in red. To have Claude write it, add an API key below.';
    $('#keyBox').hidden = k === 'claude';
  });
  $('#saveKey').onclick = () => { const v = $('#apiKey').value.trim(); store.set('apikey', v); $('#apiKey').value = ''; maker(); };

  let ctl = null;
  $('#stopBtn').onclick = () => ctl && ctl.abort();
  $('#makeBtn').onclick = async () => {
    M.idea = ideaBox.value.trim();
    if (!M.idea) { gStatus('Add a story idea first.', true); ideaBox.focus(); return; }
    ctl = new AbortController(); $('#makeBtn').disabled = true; $('#stopBtn').hidden = false;
    try { const book = await makeBook({ idea: M.idea, stage: M.stage, pages: M.pages, name: M.name, author: M.author }, m => gStatus(m), ctl.signal); editor(book); }
    catch (e) { gStatus(e.message || 'Something went wrong. Try again.', true); }
    finally { if ($('#makeBtn')) { $('#makeBtn').disabled = false; $('#stopBtn').hidden = true; } }
  };
}

/* ---------- Editor: check, tweak and save the book ---------- */
function chipsHTML(text, book) {
  return text.split(/\s+/).filter(Boolean).map(t => {
    const c = classify(t, book.stage, book.names);
    return `<span class="${c === 'ok' ? '' : c}" ${c === 'hard' ? 'title="Above this stage"' : ''}>${esc(t)}</span>`;
  }).join('');
}
function editor(book) {
  G = null;
  const st = STAGES[book.stage]; const si = STAGE_KEYS.indexOf(book.stage);
  const summary = () => {
    const ws = bookWords(book); const cs = ws.map(t => classify(t, book.stage, book.names));
    const hard = hardWords(book);
    return `${ws.length} words · ${cs.filter(c => c === 'tricky').length} tricky · ${hard.length ? `<b style="color:var(--dot)">${hard.length} above ${st.name}: ${esc(hard.join(', '))}</b>` : `<b style="color:var(--grass)">every word fits ${st.name} ✓</b>`}`;
  };
  render(`<div class="stack">
    <section class="panel">
      <h2>Check your book</h2>
      <div class="edrow">
        <div class="field"><label for="bTitle">Title</label><input type="text" id="bTitle" value="${esc(book.title)}"></div>
        <div class="field"><label for="bAuthor">Story by</label><input type="text" id="bAuthor" value="${esc(book.author || '')}" placeholder="e.g. Leo, age 4"></div>
      </div>
      <p id="sum">${summary()}</p>
      <div class="legend"><span><b>plain</b> = can sound out</span><span><b class="tricky">yellow</b> = tricky word</span><span><b class="hard">red</b> = too hard, change it</span></div>
      <div class="row" style="justify-content:flex-start">
        <button class="big" id="saveBook">💾 Save to bookshelf</button>
        ${book.idea ? `${si > 0 ? `<button class="big light small" id="easier">Make it easier (${STAGES[STAGE_KEYS[si - 1]].name})</button>` : ''}
        ${si < STAGE_KEYS.length - 1 ? `<button class="big light small" id="harder">Make it harder (${STAGES[STAGE_KEYS[si + 1]].name})</button>` : ''}` : ''}
      </div>
      <p class="status" id="eStatus" role="status"></p>
    </section>
    <section class="panel" id="pages">${book.pages.map((p, i) => `<div class="edpage" data-p="${i}">
      <div class="sc">${sceneHTML(p, 'mini')}</div>
      <div class="edfields">
        <div class="field"><label for="pt${i}">Page ${i + 1}</label><textarea id="pt${i}" rows="2" data-f="text">${esc(p.text)}</textarea></div>
        <div class="chips">${chipsHTML(p.text, book)}</div>
        <div class="edrow">
          <div class="field"><label for="ps${i}">Place</label><select id="ps${i}" data-f="setting">${Object.entries(SETTINGS).map(([k, v]) => `<option value="${k}" ${p.setting === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
          <div class="field"><label for="pf${i}">Pictures (emoji, with spaces between)</label><input type="text" id="pf${i}" data-f="figs" value="${esc(p.figures.map(f => f.e).join(' '))}"></div>
        </div>
      </div></div>`).join('')}</section>
  </div>`);
  const refresh = (i) => {
    const row = $(`.edpage[data-p="${i}"]`); const p = book.pages[i];
    row.querySelector('.sc').innerHTML = sceneHTML(p, 'mini');
    row.querySelector('.chips').innerHTML = chipsHTML(p.text, book);
    $('#sum').innerHTML = summary();
  };
  $('#bTitle').oninput = e => { book.title = e.target.value.slice(0, 60); $('#sum').innerHTML = summary(); };
  $('#bAuthor').oninput = e => { book.author = e.target.value.replace(/\s+/g, ' ').slice(0, 40); };
  $$('.edpage').forEach(row => {
    const i = +row.dataset.p; const p = book.pages[i];
    row.querySelector('[data-f=text]').oninput = e => { p.text = e.target.value.replace(/\s+/g, ' ').slice(0, 160); refresh(i); };
    row.querySelector('[data-f=setting]').onchange = e => { p.setting = e.target.value; refresh(i); };
    row.querySelector('[data-f=figs]').oninput = e => {
      const es = (e.target.value.match(/\S+/g) || []).map(cleanEmoji).filter(Boolean).slice(0, 5);
      const xs = [30, 58, 82, 45, 70];
      p.figures = es.map((em, k) => p.figures[k] ? { ...p.figures[k], e: em } : { e: em, x: xs[k], y: 74, s: k ? 2 : 3 });
      refresh(i);
    };
  });
  $('#saveBook').onclick = async () => {
    book.pages = book.pages.filter(p => p.text.trim());
    if (!book.pages.length) { $('#eStatus').textContent = 'Add some words to at least one page.'; return; }
    book.title = book.title.trim() || 'Our Story';
    await MyBooks.save(book);
    $('#eStatus').textContent = 'Saved! Opening the book…';
    setTimeout(() => readStory(book, 0), 500);
  };
  const restage = async dir => {
    const stage = STAGE_KEYS[si + dir]; const btns = $$('#easier, #harder, #saveBook');
    btns.forEach(b => b.disabled = true);
    try {
      const nb = await makeBook({ idea: book.idea, stage, pages: book.pages.length, name: M.name || '', author: book.author || '' }, m => { $('#eStatus').textContent = m; });
      editor(nb);
    } catch (e) { $('#eStatus').textContent = e.message; btns.forEach(b => b.disabled = false); }
  };
  if ($('#easier')) $('#easier').onclick = () => restage(-1);
  if ($('#harder')) $('#harder').onclick = () => restage(1);
}
