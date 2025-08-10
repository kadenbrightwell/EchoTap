import { EchoAudio } from './audio.js';
import { FX } from './fx.js';
import { FSM } from './state.js';
import { load, save } from './store.js';
import { wait, clamp, supportsVibrate, raf } from './utils.js';
import { applyTheme, cycleTheme } from './themes.js';
import { makeCaption } from './captions.js';

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

const pads = $$('.pad');
const roundEl = $('#round');
const bestEl = $('#best');
const statusPill = $('#status-pill');
const captions = $('#captions');

const startOverlay = $('#start-overlay');
const countdownEl = $('#countdown');
const shield = $('#shield');

const btnStart = $('#btn-start');
const btnRestart = $('#btn-restart');
const btnShare = $('#btn-share');
const btnMute = $('#btn-mute');
const btnTheme = $('#btn-theme');

const howtoDialog = $('#howto');
const settingsDialog = $('#settings');
const setVolume = $('#set-volume');
const setHaptics = $('#set-haptics');
const setContrast = $('#set-contrast');
const setReduced = $('#set-reduced');

const fx = new FX($('#fx'));
const audio = new EchoAudio();
const fsm = new FSM();

let store = load();
let mode = 'classic'; // classic | zen | speed
let sequence = [];
let userIndex = 0;
let round = 0;
let ticking = null; // speedrun interval handle
let speedStart = 0;

applyTheme(document.documentElement, store.theme);
document.documentElement.classList.toggle('high-contrast', store.highContrast);
bestEl.textContent = store.best;
setVolume.value = String(store.volume);
setHaptics.checked = !!store.haptics;
setContrast.checked = !!store.highContrast;
setReduced.checked = !!store.reduceMotion;

// ——— Helpers ———
function vibrate(ms=12){ if (store.haptics && supportsVibrate()) navigator.vibrate(ms); }
function rngInt(n){ return Math.floor(Math.random()*n); }
function setShield(on){ shield.classList.toggle('lock', !!on); }
function setStatus(t){ statusPill.textContent = t; }
function showStart(){ startOverlay.style.display = 'grid'; }
function hideStart(){ startOverlay.style.display = 'none'; }

// tap glow tied to pad color
function glowPad(index, ms=140){
  const el = pads[index];
  el.classList.add('glow');
  setTimeout(()=>el.classList.remove('glow'), ms);
}

function padCenter(el){
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width/2, y: r.top + r.height/2 };
}

// ——— Mode switching ———
$('#mode-classic').addEventListener('click',()=>selectMode('classic'));
$('#mode-zen').addEventListener('click',()=>selectMode('zen'));
$('#mode-speed').addEventListener('click',()=>selectMode('speed'));

function selectMode(m){
  mode = m;
  $$('.mode-row .chip').forEach(b=>b.classList.remove('selected'));
  $('#mode-'+m).classList.add('selected');
}

// ——— Dialogs & Settings ———
$('#btn-help').addEventListener('click', ()=> howtoDialog.showModal());
$('#btn-settings').addEventListener('click', ()=> settingsDialog.showModal());

setVolume.addEventListener('input', async (e)=>{
  await audio.init();
  audio.setVolume(Number(e.target.value));
  store.volume = Number(e.target.value); save(store);
});
setHaptics.addEventListener('change', (e)=>{ store.haptics = !!e.target.checked; save(store); });
setContrast.addEventListener('change', (e)=>{
  store.highContrast = !!e.target.checked; save(store);
  document.documentElement.classList.toggle('high-contrast', store.highContrast);
});
setReduced.addEventListener('change', (e)=>{ store.reduceMotion = !!e.target.checked; save(store); });

btnTheme.addEventListener('click', ()=>{
  store.theme = cycleTheme(document.documentElement, store.theme);
  save(store);
});

// ——— Audio mute ———
btnMute.addEventListener('click', async ()=>{
  await audio.init();
  const next = btnMute.getAttribute('aria-pressed')!=='true';
  btnMute.setAttribute('aria-pressed', String(next));
  btnMute.textContent = next ? '🔇' : '🔊';
  audio.setMuted(next);
});

// ——— Start / Restart ———
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', ()=> resetToIdle(true));

async function startGame(){
  await audio.init();
  hideStart();
  await countdown(3);
  beginRound(true);
}

// Countdown with subtle scale/fade (reduced motion respected)
async function countdown(n=3){
  fsm.set('countdown');
  setShield(true);
  for (let i=n;i>0;i--){
    countdownEl.textContent = String(i);
    countdownEl.classList.add('show');
    await wait(600);
    countdownEl.classList.remove('show');
    await wait(200);
  }
  countdownEl.textContent = 'Go!';
  countdownEl.classList.add('show');
  await wait(500);
  countdownEl.classList.remove('show');
  await wait(150);
}

function resetToIdle(showOverlay=false){
  fsm.set('idle');
  sequence = [];
  userIndex = 0;
  round = 0;
  roundEl.textContent = '0';
  captions.textContent = '';
  setStatus('Ready');
  setShield(false);
  if (ticking) { clearInterval(ticking); ticking=null; }
  if (showOverlay) showStart();
}

// ——— Core loop ———
function beginRound(first=false){
  fsm.set('playback');
  if (!first) round++;
  else round = 1;
  roundEl.textContent = String(round);

  // add a step
  sequence.push(rngInt(4));

  // speed logic
  const base = 0.55;
  const step = Math.max(0.32, base - (round*0.012)); // ramps up
  const padTimes = sequence.map((pad, i)=> ({ pad, offset: i*step }));

  // captions for accessibility
  captions.textContent = makeCaption(sequence);

  const t0 = audio.ctx.currentTime + 0.45;
  audio.schedule(t0, padTimes);

  // UI glow synced to audio clock
  setShield(true);
  setStatus('Listen');
  padTimes.forEach((stp)=>{
    const when = (t0 + stp.offset - audio.latencyComp) - audio.ctx.currentTime;
    setTimeout(()=> glowPad(stp.pad), Math.max(0, when*1000));
  });

  // after playback, enable input
  const totalMs = (padTimes[padTimes.length-1].offset + 0.2)*1000 + 120;
  setTimeout(()=>{
    userIndex = 0;
    fsm.set('input');
    setShield(false);
    setStatus(mode==='speed' ? 'Echo • Timer running' : 'Echo');
    if (mode==='speed'){
      // start a visible timer in pill
      speedStart = performance.now();
      if (ticking) clearInterval(ticking);
      ticking = setInterval(()=>{
        const s = ((performance.now()-speedStart)/1000).toFixed(2);
        setStatus(`Echo • ${s}s`);
      }, 50);
    }
  }, totalMs);
}

// ——— Input handling ———
pads.forEach(p=>{
  p.addEventListener('pointerdown', onPad);
  p.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' ') onPad(e); });
});

function onPad(e){
  const el = e.currentTarget;
  const padIndex = Number(el.dataset.pad);
  if (fsm.get() !== 'input') return;
  vibrate(10);
  const {x,y} = padCenter(el);
  const color = getComputedStyle(el).getPropertyValue('--c').trim() || 'white';
  fx.burst(x,y,color);
  if (audio.ctx) audio.blip(audio.ctx.currentTime, padIndex);
  glowPad(padIndex, 100);

  const expected = sequence[userIndex];
  if (padIndex === expected){
    userIndex++;
    if (userIndex === sequence.length){
      // round complete
      if (mode==='speed' && ticking){
        clearInterval(ticking); ticking=null;
        const elapsed = ((performance.now()-speedStart)/1000).toFixed(2);
        setStatus(`Round ${round} • ${elapsed}s`);
      } else {
        setStatus(`Round ${round} ✓`);
      }
      // update best
      if (round > store.best){ store.best = round; bestEl.textContent = String(round); save(store); }
      // small pause then next
      setShield(true);
      setTimeout(()=> beginRound(false), 420);
    }
  } else {
    if (mode==='zen'){ /* ignore wrong; wait for correct */ return; }
    // fail
    fsm.set('fail');
    flashFail();
    resetToIdle(true);
  }
}

function flashFail(){
  // quick failure flash/backdrop
  document.body.animate(
    [{backgroundColor:'transparent'},{backgroundColor:'rgba(255,70,70,.16)'},{backgroundColor:'transparent'}],
    {duration:360, easing:'ease-out'}
  );
  setStatus('Miss! Tap Start');
}

// ——— Share ———
btnShare.addEventListener('click', async ()=>{
  const text = `I reached Round ${store.best} in EchoTap!`;
  try{
    if (navigator.share) await navigator.share({title:'EchoTap', text});
    else { await navigator.clipboard.writeText(text); alert('Copied to clipboard'); }
  }catch{}
});

// ——— Install PWA SW ———
if ('serviceWorker' in navigator){
  addEventListener('load', ()=> navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
}

// ——— Boot ———
resetToIdle(true);
setStatus('Ready');
