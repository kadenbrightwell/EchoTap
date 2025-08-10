export class FX {
  constructor(canvas){
    this.c = canvas.getContext('2d');
    this.canvas = canvas;
    this.px = Math.max(1, devicePixelRatio || 1);
    this.resize();
    addEventListener('resize', ()=>this.resize());
    this.sparks = [];
    this.loop();
  }
  resize(){
    this.canvas.width = this.canvas.clientWidth * this.px;
    this.canvas.height = this.canvas.clientHeight * this.px;
  }
  burst(x,y,color='white'){
    const n = 20;
    for(let i=0;i<n;i++){
      this.sparks.push({
        x:x*this.px, y:y*this.px,
        vx:(Math.random()-0.5)*5,
        vy:(Math.random()-0.7)*5,
        life:1,
        color
      });
    }
  }
  loop(){
    requestAnimationFrame(()=>this.loop());
    const ctx=this.c, w=this.canvas.width, h=this.canvas.height;
    ctx.clearRect(0,0,w,h);
    this.sparks = this.sparks.filter(s=>s.life>0.02);
    for(const s of this.sparks){
      s.x+=s.vx; s.y+=s.vy; s.vy+=0.06; s.life*=0.94;
      ctx.globalAlpha = s.life;
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI*2); ctx.fillStyle = s.color; ctx.fill();
    }
    ctx.globalAlpha=1;
  }
}
