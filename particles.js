// particles.js
export class Particles {
  constructor(canvas){
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pxRatio = Math.max(1, window.devicePixelRatio || 1);
    this.resize();
    addEventListener('resize', ()=>this.resize());
    this.bursts = [];
    this.loop();
  }
  resize(){
    const {clientWidth:w, clientHeight:h} = this.canvas;
    this.canvas.width = w * this.pxRatio;
    this.canvas.height = h * this.pxRatio;
  }
  burst(x,y){
    const n=16;
    for(let i=0;i<n;i++){
      this.bursts.push({
        x:x*this.pxRatio, y:y*this.pxRatio,
        vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*4,
        life:1
      });
    }
  }
  loop(){
    requestAnimationFrame(()=>this.loop());
    const c=this.ctx, w=this.canvas.width, h=this.canvas.height;
    c.clearRect(0,0,w,h);
    this.bursts = this.bursts.filter(p=>p.life>0.02);
    for(const p of this.bursts){
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.life*=0.94;
      c.globalAlpha = p.life;
      c.beginPath(); c.arc(p.x,p.y,3,0,Math.PI*2); c.fill();
    }
    c.globalAlpha=1;
  }
}
