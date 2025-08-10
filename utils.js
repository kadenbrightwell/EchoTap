export const wait = (ms) => new Promise((r)=>setTimeout(r, ms));
export const clamp = (v,min,max)=> Math.max(min, Math.min(max, v));
export const supportsVibrate = () => 'vibrate' in navigator;
export const raf = (fn)=> new Promise(r=> requestAnimationFrame((t)=>{ fn?.(t); r(t); }));
