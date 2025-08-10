// Simple finite-state machine for game flow.
export class FSM {
  constructor(){
    this.state = 'idle'; // idle | countdown | playback | input | fail
    this.listeners = new Set();
  }
  get(){ return this.state; }
  set(next){
    if (this.state === next) return;
    this.state = next;
    for (const l of this.listeners) l(next);
  }
  on(fn){ this.listeners.add(fn); return ()=>this.listeners.delete(fn); }
}
