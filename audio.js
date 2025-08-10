export class EchoAudio {
  constructor(){
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.volume = 0.9;
    this.latencyComp = 0.02; // UI-audio sync lead
    this.padFreq = [330, 392, 466, 554]; // musical-ish steps
  }
  async init(){
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({latencyHint:'interactive'});
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : this.volume;
    this.master.connect(this.ctx.destination);
  }
  setVolume(v){
    this.volume = v;
    if (this.master) this.master.gain.value = this.muted ? 0 : v;
  }
  setMuted(flag){
    this.muted = flag;
    if (this.master) this.master.gain.value = flag ? 0 : this.volume;
  }
  blip(when, index){
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(this.padFreq[index % this.padFreq.length], when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.55, when + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    o.connect(g).connect(this.master);
    o.start(when);
    o.stop(when + 0.2);
  }
  schedule(startTime, steps){ // steps: [{pad, offset}]
    for (const s of steps){
      this.blip(startTime + s.offset - this.latencyComp, s.pad);
    }
  }
}
