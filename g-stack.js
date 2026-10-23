/* La torre — apila bloques (Stack) */
(function(){
"use strict";
let A, W, H;
let blocks, mv, dir, speed, floors, perfect, over, camY, msg, msgT, bh, cut;
const COLS=['#5FD6C0','#9ED8FF','#C58BFF','#EE7563','#F09A6B','#FFCE5C','#6FE0B0'];
function base(){ return H-24; }
function spawn(){ const last=blocks[blocks.length-1]; dir=floors%2?1:-1; mv={x:dir>0?-last.w:W,w:last.w,y:last.y-bh}; }
function place(){ if(over) return; const last=blocks[blocks.length-1];
  const l=Math.max(mv.x,last.x), r=Math.min(mv.x+mv.w,last.x+last.w);
  if(r-l<=0){ over=true; cut={x:mv.x,y:mv.y,w:mv.w,vy:0}; A.shake(1); A.end({score:floors, rows:[[floors,'pisos'],[perfect,'perfectos']]}); return; }
  let nx=l, nw=r-l;
  if(Math.abs(mv.x-last.x)<4){ nx=last.x; nw=last.w; perfect++; msg='¡perfecto!'; msgT=0.9; A.burst(nx+nw/2,mv.y,'#FFCE5C',10); }
  else cut={x:mv.x<last.x?mv.x:r, y:mv.y, w:mv.w-nw, vy:0};
  blocks.push({x:nx,w:nw,y:mv.y,c:COLS[floors%COLS.length]}); floors++; speed=Math.min(W*1.1,160+floors*9);
  spawn(); }
const game={
  id:'stack', name:'La torre', accent:'#9ED8FF',
  desc:'Suelta cada bloque justo encima del anterior. Lo que sobra se cae.',
  keys:'<kbd>Espacio</kbd> o toca la pantalla para soltar el bloque',
  overTitle:'Se cayó la torre', fmt:v=>Math.round(v)+' pisos',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',()=>{ if(window.__padGame==='stack'&&blocks) place(); }); },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; bh=Math.max(16,Math.min(26,(H-60)/14)); const w0=Math.min(W*0.5,240); blocks=[{x:(W-w0)/2,w:w0,y:base()-bh,c:'#25454D'}]; floors=0; perfect=0; over=false; camY=0; speed=160; cut=null; msg='toca para soltar'; msgT=1.6; spawn(); },
  keydown(e){ const k=e.key.toLowerCase(); if(k===' '||k==='spacebar'||k==='enter'||k==='arrowdown') place(); },
  update(dt){ if(msgT>0) msgT-=dt;
    if(cut){ cut.vy+=900*dt; cut.y+=cut.vy*dt; if(cut.y>H+camY+40) cut=null; }
    if(over) return;
    mv.x+=dir*speed*dt; if(mv.x+mv.w>W+mv.w*0.2&&dir>0) dir=-1; if(mv.x<-mv.w*0.2&&dir<0) dir=1;
    const want=Math.max(0,(base()-mv.y)-(H-46)*0.55); camY+=(want-camY)*Math.min(1,dt*5);
    A.hud([floors+' pisos', perfect+' perfectos']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.save(); ctx.translate(0,camY);
    for(const b of blocks){ ctx.fillStyle=b.c; A.roundRect(b.x,b.y,b.w,bh-2,3); ctx.fill(); }
    if(!over){ ctx.fillStyle=COLS[floors%COLS.length]; A.roundRect(mv.x,mv.y,mv.w,bh-2,3); ctx.fill(); }
    if(cut){ ctx.globalAlpha=0.6; ctx.fillStyle='#EE7563'; A.roundRect(cut.x,cut.y,cut.w,bh-2,3); ctx.fill(); ctx.globalAlpha=1; }
    ctx.restore();
    if(msgT>0) A.text(msg,W/2,70,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
