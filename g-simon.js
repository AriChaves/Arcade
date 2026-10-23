/* Simón — repite la secuencia */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const PADS=[{k:'arrowup',c:'#5FD6C0',t:'▲'},{k:'arrowright',c:'#FFCE5C',t:'▶'},{k:'arrowdown',c:'#EE7563',t:'▼'},{k:'arrowleft',c:'#C58BFF',t:'◀'}];
let seq, step, mode, showI, showT, lit, litT, round, over, msg, cx, cy, R;
function layout(){ R=Math.min(W*0.42,(H-60)/2-4); cx=W/2; cy=46+(H-46)/2; }
function padAt(x,y){ const dx=x-cx, dy=y-cy, d=Math.hypot(dx,dy); if(d<R*0.3||d>R) return -1;
  if(Math.abs(dy)>Math.abs(dx)) return dy<0?0:2; return dx>0?1:3; }
function nextRound(){ round++; seq.push(A.ri(4)); mode='show'; showI=0; showT=0.7; step=0; msg='mira…'; }
function press(i){ if(over||mode!=='input') return; lit=i; litT=0.25;
  if(i===seq[step]){ step++; if(step===seq.length){ mode='wait'; showT=0.8; msg='¡bien!'; } }
  else { over=true; mode='over'; A.shake(1.2); msg='¡ups!'; later(()=>A.end({score:round-1, rows:[[round-1,'rondas'],[seq.length,'largo de la secuencia']]}),700); } }
const game={
  id:'simon', name:'Simón', accent:'#C58BFF',
  desc:'Memoriza la secuencia de colores y repítela. Cada ronda es más larga.',
  keys:'<kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd><kbd>←</kbd> o toca los colores',
  overTitle:'Se te olvidó la secuencia', fmt:v=>Math.round(v)+' rondas',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='simon'||!seq) return; const r=cv.getBoundingClientRect(); const i=padAt(e.clientX-r.left,e.clientY-r.top); if(i>=0) press(i); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); seq=[]; round=0; over=false; lit=-1; litT=0; nextRound(); showT=1.2; },
  keydown(e){ const k=e.key.toLowerCase(); const m={w:'arrowup',d:'arrowright',s:'arrowdown',a:'arrowleft'}; const i=PADS.findIndex(p=>p.k===(m[k]||k)); if(i>=0) press(i); },
  update(dt){ if(litT>0){ litT-=dt; if(litT<=0) lit=-1; }
    if(mode==='show'){ showT-=dt; if(showT<=0){ if(showI<seq.length){ lit=seq[showI]; litT=Math.max(0.22,0.5-round*0.02); showI++; showT=litT+0.18; } else { mode='input'; msg='tu turno'; } } }
    if(mode==='wait'){ showT-=dt; if(showT<=0) nextRound(); }
    A.hud(['ronda '+round, mode==='input'?(seq.length-step)+' por tocar':'mirando']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    PADS.forEach((p,i)=>{ const a0=[-Math.PI*0.75,-Math.PI*0.25,Math.PI*0.25,Math.PI*0.75][i];
      ctx.beginPath(); ctx.arc(cx,cy,R,a0+0.05,a0+Math.PI/2-0.05); ctx.arc(cx,cy,R*0.32,a0+Math.PI/2-0.12,a0+0.12,true); ctx.closePath();
      ctx.fillStyle=p.c; ctx.globalAlpha=lit===i?1:0.22; ctx.fill(); ctx.globalAlpha=1;
      const am=a0+Math.PI/4; A.text(p.t,cx+Math.cos(am)*R*0.66,cy+Math.sin(am)*R*0.66,Math.max(14,R*0.16),lit===i?'#0D1A1E':p.c,700); });
    A.text(msg,cx,cy,Math.max(11,R*0.11),'#E9F2EF',700); }
};
window.Arcade.register(game);
})();
