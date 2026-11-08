/* Blend & Read: Word lists, stories and stickers. Edit these to add your own words and books. */
'use strict';

/* ---------- Word lists ---------- */
// Phase 2 style CVC words (mostly 3 letters). Each picture is unique so matching games stay fair.
const CVC = [
  ['cat','🐱'],['dog','🐶'],['pig','🐷'],['hen','🐔'],['fox','🦊'],['bat','🦇'],['bus','🚌'],['sun','☀️'],
  ['hat','🎩'],['bed','🛏️'],['cup','🥤'],['mug','☕'],['pen','🖊️'],['map','🗺️'],['van','🚐'],['box','📦'],
  ['bug','🐛'],['rat','🐀'],['net','🥅'],['web','🕸️'],['pin','📌'],['log','🪵'],['ant','🐜'],['jet','✈️'],
  ['leg','🦵'],['lip','👄'],['nut','🥜'],['ram','🐏'],['ten','🔟'],['six','6️⃣'],['tap','🚰'],['zip','🤐'],
  ['hut','🛖'],['kid','🧒'],['man','👨'],['mum','👩'],['dad','🧔'],['bin','🗑️'],['cap','🧢'],['can','🥫'],
  ['ham','🍖'],['dig','⛏️'],['run','🏃'],['nap','😴'],['hug','🤗'],['wet','💦'],['hot','🔥'],['red','🔴'],
  ['sad','😢'],['pup','🐕'],['cub','🐻'],['yak','🐃'],['rod','🎣'],['pan','🍳'],['bag','👜'],['tub','🛁'],
  ['pot','🍯'],['gem','💎'],['cog','⚙️'],['mop','🧹'],['bud','🌱'],['zap','⚡'],['yes','✅'],['egg','🥚']
].map(([w,e]) => ({ w, e, set: 'cvc' }));

// Phase 3 style words with digraphs (two or three letters making one sound).
const DIGRAPH = [
  ['duck','🦆'],['sock','🧦'],['rock','🪨'],['bell','🔔'],['doll','🪆'],['hill','⛰️'],['kiss','💋'],['fish','🐟'],
  ['ship','🚢'],['shop','🏪'],['shell','🐚'],['chip','🍟'],['chick','🐥'],['bath','🛀'],['ring','💍'],['king','🤴'],
  ['bee','🐝'],['tree','🌳'],['feet','🦶'],['moon','🌙'],['book','📖'],['boat','⛵'],['goat','🐐'],['rain','🌧️'],
  ['coin','🪙'],['cow','🐄'],['owl','🦉'],['car','🚗'],['star','⭐'],['farm','🚜'],['fork','🍴'],['corn','🌽'],
  ['horn','📯'],['night','🌃'],['light','💡'],['queen','👸'],['shark','🦈'],['torch','🔦'],['sheep','🐑'],['teeth','🦷'],
  ['chair','🪑'],['ear','👂'],['chain','⛓️'],['soap','🧼'],['toad','🐸'],['boot','👢'],['spoon','🥄'],['nail','💅'],
  ['snail','🐌'],['train','🚂'],['coat','🧥']
].map(([w,e]) => ({ w, e, set: 'dig' }));

const ALIEN = {
  cvc: ['zop','vap','tig','mip','dut','fip','lom','sib','pab','jat','nid','reb','hux','gan','bim','kep','wug','fot','dem','lut','vot','yeb'],
  dig: ['chom','shep','thib','zook','feeb','moak','shoon','chab','quom','roip','narb','veck','jair','thog','sheb','mook']
};

// Tricky words: you can't sound these out the usual way, so we just say them.
const TRICKY = new Set(['the','to','i','no','go','into','he','she','we','me','be','was','you','they','all','are','my','her',
  'said','so','have','like','some','come','were','there','little','one','do','when','out','what','put','push','pull','full',
  'of','is','his','has','as','a','look','good','see','oh']);

const STORIES = [
  { id:'catrat', title:'The Cat and the Rat', icon:'🐱', set:'cvc', bc:'#ffe0b8', pages:[
    ['🐱🟫','A cat sat on a mat.'],
    ['🐀💨','A rat ran to the mat.'],
    ['🐱⬆️🐀','The cat got up. Run, rat, run!'],
    ['🐀📦','The rat hid in a big box.'],
    ['😿','The cat is sad. No rat!']],
    q:{ text:'Where did the rat hide?', options:['📦','🛏️','🎩'], answer:0 } },
  { id:'bus', title:'The Big Red Bus', icon:'🚌', set:'cvc', bc:'#ffd3cf', pages:[
    ['👩🧔🚌','Mum and Dad get on the bus.'],
    ['🚌🔴','The bus is big and red.'],
    ['🐶🚌','A dog hops on. Yap, yap!'],
    ['🚌⛰️','The bus gets to the top of the hill.'],
    ['😄🚌','It is fun on the bus!']],
    q:{ text:'What got on the bus?', options:['🐱','🐶','🐷'], answer:1 } },
  { id:'pip', title:'Pip the Pup', icon:'🐕', set:'cvc', bc:'#e6d6c3', pages:[
    ['🐕','Pip is a pup.'],
    ['🐕🟤','Pip digs in the mud.'],
    ['🟤🐕🟤','Pip is a mud pup!'],
    ['🐕🛁','Pip gets in the tub.'],
    ['🧼🐕🧼','Rub a dub dub! Pip is not a mud pup.'],
    ['🐕😴','Pip naps on the rug.']],
    q:{ text:'Where did Pip get clean?', options:['🛏️','🚌','🛁'], answer:2 } },
  { id:'hen', title:'The Hen and the Egg', icon:'🐔', set:'cvc', bc:'#fff1b8', pages:[
    ['🐔🥚','A hen sat on an egg.'],
    ['🥚👂','The egg went tap, tap, tap.'],
    ['🐣','Pop! A chick got out.'],
    ['🐔💛🐥','The hen is glad.'],
    ['🐔🤗🐥','Hug, hug, hug!']],
    q:{ text:'What came out of the egg?', options:['🐶','🐥','🐛'], answer:1 } },
  { id:'sun', title:'Fun in the Sun', icon:'☀️', set:'cvc', bc:'#ffe8a3', pages:[
    ['👦👧🏖️','Sam and Meg run to the sand.'],
    ['👦⛏️','Sam digs a big pit.'],
    ['👧🪣','Meg has a red bucket.'],
    ['💦👦💦','Splash! Sam gets wet.'],
    ['☀️😴😴','The sun is hot. Sam and Meg nap.']],
    q:{ text:'Who got wet?', options:['👦','👧','🐶'], answer:0 } },
  { id:'fox', title:'Fox in a Box', icon:'🦊', set:'cvc', bc:'#ffd1a6', pages:[
    ['🦊📦','A fox got in a box.'],
    ['📦','The box had a lid.'],
    ['✊📦❓','Tap, tap! Is the fox in the box?'],
    ['🦊⬆️📦','Yes! The fox pops up.'],
    ['🦊😂','Ha, ha, ha!']],
    q:{ text:'What was in the box?', options:['🐀','🐔','🦊'], answer:2 } },
  { id:'bug', title:'The Bug on the Log', icon:'🐛', set:'cvc', bc:'#d4f0c6', pages:[
    ['🐛🪵','A bug sat on a log.'],
    ['☀️🐛','It got hot in the sun.'],
    ['🐔💨','A big hen ran up. Peck, peck!'],
    ['🐛🍯','The bug hid in a pot.'],
    ['🐔❓','The hen did not get the bug!']],
    q:{ text:'Where did the bug hide?', options:['🍯','📦','🎩'], answer:0 } },
  { id:'chips', title:'Fish and Chips', icon:'🍟', set:'dig', bc:'#cfe8ff', pages:[
    ['🧔🧒🏪','Dad and I go to the shop.'],
    ['🐟🍟','We get fish and chips.'],
    ['🧒🪑','I sit on a bench.'],
    ['🍟🔥','The chips are hot!'],
    ['😋','Yum! I am full.']],
    q:{ text:'What did they get at the shop?', options:['🍦','🍟','🍕'], answer:1 } },
  { id:'ship', title:'Ten Men on a Ship', icon:'🚢', set:'dig', bc:'#c4e6f5', pages:[
    ['🚢🌊','Ten men on a ship.'],
    ['🔔','Ring the bell! Ding, dong!'],
    ['🐟💦','A big fish! Splash!'],
    ['🚢⚓','The ship gets to the dock.'],
    ['🏃🏃🏃','The men jump off.']],
    q:{ text:'What did the men ring?', options:['🔔','📞','💍'], answer:0 } },
  { id:'moon', title:'Good Night, Moon', icon:'🌙', set:'dig', bc:'#d9d2f5', pages:[
    ['🌃','It is night.'],
    ['🧒👀','I look up.'],
    ['🌙','I see the moon.'],
    ['⭐✨⭐','I see a lot of stars.'],
    ['😴🌙','Good night!']],
    q:{ text:'What did they see?', options:['☀️','🌧️','🌙'], answer:2 } }
];

const STICKERS = ['🦁','🐯','🐵','🐸','🐙','🦄','🐢','🦖','🐳','🦋','🐞','🦒','🐼','🐨','🦕','🐬','🦜','🐧','🦩','🦔','🐲','🚀','🌈','🍦','🍩','🎈','🏆','🌟','🍉','👑'];
const STARS_PER_STICKER = 5;
