// audio.js
export class EchoAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.latencyComp = 0.02; // seconds; slight lead to align with UI glow
  }
  async init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({latencyHint: 'interactive'});
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.9;
  }
  setMuted(flag){
    this.muted = flag;
    if (!this.masterGain) return;
    this.masterGain.gain.value = flag ? 0 : 0.9;
  }
  // Play a short percussive blip, pitch mapped per padIndex 0..3
  playHit(when, padIndex){
    if(!this.ctx) return;
    const f = [320, 380, 450, 520][padIndex % 4];
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(f, when);
    g.gain.setValueAtTime(0.001, when);
    g.gain.exponentialRampToValueAtTime(0.5, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    o.connect(g).connect(this.masterGain);
    o.start(when);
    o.stop(when + 0.16);
  }
  // schedule a sequence [{pad, timeOffset}]
  scheduleSequence(startTime, seq){
    seq.forEach(step=>{
      this.playHit(startTime + step.timeOffset - this.latencyComp, step.pad);
    });
  }
}
