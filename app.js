import { EchoAudio } from './audio.js';
import { Particles } from './particles.js';

const pads = [...document.querySelectorAll('.pad')];
const startBtn = document.getElementById('start');
const roundEl = document.getElementById('round');
const bestEl = document.getElementById('best');
const muteBtn = document.getElementById('mute');
const helpBtn = document.getElementById('help');
const howto = document.getElementById('howto');
const fx = new Particles(document.getElementById('fx'));

const audio = new EchoAudio();

let mode = 'classic'; // 'classic' | 'zen' | 'speed'
let sequence = [];
let userIndex = 0;
let playingBack = false;
let round = 0;
let best = parseInt(localStorage.getItem('echotap_best')||'0',10) || 0;
bestEl.textContent = best;

const modeBtns = {
  classic: document.getElementById('mode-classic'),
  zen: document.getElementById('mode-zen'),
  speed: document.getElementById('mode-speed')
};

Object.entries(modeBtns).forEach(([m,btn])=>{
  btn.addEventListener('click', ()=>{
    Object.values(modeBtns).forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    mode = m;
    resetGame();
  });
});

helpBtn.addEventListener('click', ()=>howto.showModal());

muteBtn.addEventListener('click', async ()=>{
  await audio.init();
  const next = muteBtn.getAttribute('aria-pressed')!=='true';
  muteBtn.setAttribute('aria-pressed', String(next));
  muteBtn.textContent = next ? '🔇' : '🔊';
  audio.setMuted(next);
});

startBtn.addEventListener('click', startGame);

pads.forEach(p=>{
  p.addEventListener('pointerdown', onPadPress, {passive:true});
});

function vibrate(ms=15){ if(navigator.vibrate) navigator.vibrate(ms); }

async function startGame(){
  await audio.init();
  resetGame();
  nextRound();
}

function resetGame(){
  sequence = [];
  userIndex = 0;
  round = 0;
  roundEl.textContent = '0';
}

function rngInt(n){ return Math.floor(Math.random()*n); }

async function nextRound(){
  round++;
  roundEl.textContent = String(round);
  sequence.push(rngInt(4));
  await playback();
  userIndex = 0;
}

function glow(padIndex, ms=120){
  const el = pads[padIndex];
  el.classList.add('glow');
  setTimeout(()=>el.classList.remove('glow'), ms);
}

async function playback(){
  playingBack = true;
  const tempoBase = 0.55; // seconds between notes at start
  const speedup = Math.max(0.35, tempoBase - (round*0.01)); // ramps faster
  const startAt = audio.ctx.currentTime + 0.35;
  const schedule = [];

  sequence.forEach((pad,i)=>{
    const t = startAt + i*speedup;
    schedule.push({pad, timeOffset: t - startAt});
    setTimeout(()=>{ glow(pad); }, (t - audio.ctx.currentTime)*1000);
  });

  audio.scheduleSequence(startAt, schedule);
  await wait((speedup*sequence.length + 0.2)*1000);
  playingBack = false;
}

function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }

function onPadPress(e){
  if (playingBack) return;
  const padIndex = Number(e.currentTarget.dataset.pad);
  const rect = e.currentTarget.getBoundingClientRect();
  fx.burst(rect.left + rect.width/2, rect.top + rect.height/2);
  vibrate(12);
  glow(padIndex, 80);
  if (audio.ctx) audio.playHit(audio.ctx.currentTime, padIndex);

  // input check
  if (padIndex === sequence[userIndex]){
    userIndex++;
    if (userIndex === sequence.length){
      // round complete
      if (mode === 'speed'){
        // optional: timer logic goes here
      }
      if (round > best){ best = round; localStorage.setItem('echotap_best', String(best)); bestEl.textContent = best; }
      setTimeout(nextRound, 380);
    }
  } else {
    // fail
    if (mode === 'zen'){
      // no fail, just keep waiting for correct input
      return;
    }
    failSplash();
    resetGame();
  }
}

function failSplash(){
  document.body.animate(
    [{backgroundColor:'transparent'},{backgroundColor:'rgba(255,50,50,.15)'},{backgroundColor:'transparent'}],
    {duration:360, easing:'ease-out'}
  );
}
  
// Share
document.getElementById('share').addEventListener('click', async ()=>{
  const text = `I reached Round ${best} in EchoTap!`;
  if (navigator.share){
    try { await navigator.share({title:'EchoTap', text}); } catch{}
  } else {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }
});
