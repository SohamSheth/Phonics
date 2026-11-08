/* Blend & Read: Graphemes, speech, recorded sounds and saved settings. */
'use strict';

/* ---------- Graphemes ---------- */
const MULTI = ['igh','air','ear','ure','ch','sh','th','ng','nk','ck','ll','ss','ff','zz','gg','qu','wh','ph','ai','ee','oa','oo','ar','or','ur','ow','oi','er',
  'ay','ou','ie','ea','oy','ir','ue','aw','ew','oe','au','ey'];
function split(word) {
  const w = word.toLowerCase(); const out = []; let i = 0;
  while (i < w.length) { const m = MULTI.find(g => w.startsWith(g, i)) || w[i]; out.push(m); i += m.length; }
  return out;
}
// How the speech voice should say each pure sound. These are approximations;
// grown-ups can record the real sounds in the Grown-ups area.
const SOUND = { a:'ah', b:'buh', c:'kuh', d:'duh', e:'eh', f:'fff', g:'guh', h:'huh', i:'ih', j:'juh', k:'kuh', l:'lll', m:'mmm',
  n:'nnn', o:'aw', p:'puh', q:'kwuh', r:'rrr', s:'sss', t:'tuh', u:'uh', v:'vvv', w:'wuh', x:'ks', y:'yuh', z:'zzz',
  ck:'kuh', ll:'lll', ss:'sss', ff:'fff', zz:'zzz', gg:'guh', qu:'kwuh', sh:'shh', ch:'chuh', th:'thuh', ng:'ng',
  ai:'ay', ee:'ee', igh:'eye', oa:'oh', oo:'oo', ar:'ar', or:'or', ur:'er', ow:'ow', oi:'oy', ear:'ear', air:'air', er:'er', ure:'your', nk:'nk', wh:'wuh', ph:'fff',
  ay:'ay', ou:'ow', ie:'eye', ea:'ee', oy:'oy', ir:'er', ue:'oo', aw:'or', ew:'oo', oe:'oh', au:'or', ey:'ee' };
const RECORDABLE = ['s','a','t','p','i','n','m','d','g','o','c','k','ck','e','u','r','h','b','f','l','ll','ss','ff','j','v','w','x','y','z','qu',
  'ch','sh','th','ng','ai','ee','igh','oa','oo','ar','or','ur','ow','oi','ear','air','er'];

/* ---------- Storage (safe if blocked) ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('blendread.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('blendread.' + k, JSON.stringify(v)); } catch (e) {} }
};
const S = {
  stars: store.get('stars', 0),
  level: store.get('level', 'cvc'),     // 'cvc' | 'dig' | 'mix'
  rate: store.get('rate', 0.8),
  voice: store.get('voice', ''),
  read: store.get('read', [])           // finished story ids
};
function save() { store.set('stars', S.stars); store.set('level', S.level); store.set('rate', S.rate); store.set('voice', S.voice); store.set('read', S.read); }

const recorded = {}; // grapheme -> object URL
const idb = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      try {
        const r = indexedDB.open('blendread', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('sounds');
        r.onsuccess = () => { idb.db = r.result; res(r.result); };
        r.onerror = () => rej(r.error);
      } catch (e) { rej(e); }
    });
  },
  tx(mode) { return idb.db.transaction('sounds', mode).objectStore('sounds'); },
  put(k, v) { return new Promise((res, rej) => { const r = idb.tx('readwrite').put(v, k); r.onsuccess = res; r.onerror = rej; }); },
  del(k) { return new Promise((res, rej) => { const r = idb.tx('readwrite').delete(k); r.onsuccess = res; r.onerror = rej; }); },
  all() {
    return new Promise((res, rej) => {
      const out = {}; const r = idb.tx('readonly').openCursor();
      r.onsuccess = () => { const c = r.result; if (c) { out[c.key] = c.value; c.continue(); } else res(out); };
      r.onerror = rej;
    });
  }
};
idb.open().then(idb.all).then(all => { for (const k in all) recorded[k] = URL.createObjectURL(all[k]); }).catch(() => {});

/* ---------- Speech ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice() {
  if (S.voice) { const v = voices.find(v => v.name === S.voice); if (v) return v; }
  return voices.find(v => v.lang === 'en-GB' && /female|serena|kate|libby|sonia|google uk english female/i.test(v.name))
    || voices.find(v => v.lang === 'en-GB') || voices.find(v => /^en/i.test(v.lang)) || null;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
let run = 0; // bump to cancel any speaking sequence in progress
function hush() { run++; try { speechSynthesis.cancel(); } catch (e) {} }
function say(text, rate) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
    u.rate = rate || S.rate; u.pitch = 1.05;
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    u.onend = fin; u.onerror = fin; setTimeout(fin, 900 + text.length * 160 / u.rate);
    speechSynthesis.speak(u);
  });
}
function playUrl(url) {
  return new Promise(res => { const a = new Audio(url); a.onended = res; a.onerror = res; a.play().catch(res); setTimeout(res, 2500); });
}
function playSound(g) { return recorded[g] ? playUrl(recorded[g]) : say(SOUND[g] || g, 0.75); }

// Say each sound, lighting its button, then blend into the whole word.
async function blend(word, btns, gap = 260) {
  const my = ++run; const gs = split(word);
  for (let i = 0; i < gs.length; i++) {
    if (my !== run) return;
    btns && btns[i] && btns[i].classList.add('lit');
    await playSound(gs[i]);
    btns && btns[i] && btns[i].classList.remove('lit');
    await wait(gap);
  }
  if (my !== run) return;
  await say(word);
}
const PRAISE = ['Well done!','Brilliant!','Super blending!','You did it!','Fantastic!','Great reading!','Amazing!'];
const praise = () => say(pick(PRAISE));
