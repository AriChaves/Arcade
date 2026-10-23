/* Cruza la calle — estilo Frogger */
(function(){
"use strict";
let A, W, H;
let P, lanes, score, lives, level, t, over, rows, rh, best, inv, msg, msgT;
const COLS=['#EE7563','#C58BFF','#F09A6B','#9ED8FF','#FFCE5C'];
function build(){ rows=9; rh=Math.floor((H-50)/rows); lanes=[];
  for(let r=1;r<rows-1;r++){ if(r===4){ lanes.push({r,safe:true,cars:[]}); continue; }
    const dir=r%2?1:-1, sp=(50+A.rnd(0,40)+level*14)*dir, n=Math.max(1,Math.round(W/A.rnd(150,230))), len=A.rnd(36,70);
    const cars=[]; for(let i=0;i<n;i++) cars.push({x:i*W/n+A.rnd(0,40),w:len,c:A.pick(COLS)}); lanes.push({r,sp,cars}); } }
function resetP(){ P={c:Math.floor((W/rh)/2),r:rows-1}; best=rows-1; }
function px(){ return (P.c+.5)*rh+(W-Math.floor(W/rh)*rh)/2; }
function ry(r){ return 50+r*rh; }
function hop(dc,dr){ if(over) return; const cols=Math.floor(W/rh); P.c=A.clamp(P.c+dc,0,cols-1); P.r=A.clamp(P.r+dr,0,rows-1);
  if(P.r<best){ best=P.r; score+=10; }
  if(P.r===0){ score+=100+level*20; level++; msg='¡cruzaste! nivel '+level; msgT=1.6; A.burst(px(),ry(0)+rh/2,'#5FD6C0',14); build(); resetP(); } }
function hit(){ lives--; A.shake(1); A.burst(px(),ry(P.r)+rh/2,'#EE7563',14); if(lives<=0){ over=true; A.end({score, rows:[[score,'puntos'],[level-1,'cruces']]}); return; } inv=1.2; resetP(); msg='¡cuidado! quedan '+lives; msgT=1.4; }
const game={
  id:'frogger', name:'Cruza la calle', accent:'#5FD6C0',
  desc:'Cruza los carriles sin que te atropellen. Cada cruce va más rápido.',
  keys:'<kbd>flechas</kbd> o <kbd>WASD</kbd> para saltar',
  overTitle:'Te atropellaron',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; if(lanes){ build(); resetP(); } },
  start(){ W=A.W; H=A.H; score=0; lives=3; level=1; t=0; over=false; inv=0; msg='llega arriba'; msgT=1.6; build(); resetP(); },
  keydown(e){ const k=e.key.toLowerCase();
    if(k==='arrowup'||k==='w') hop(0,-1); else if(k==='arrowdown'||k==='s') hop(0,1); else if(k==='arrowleft'||k==='a') hop(-1,0); else if(k==='arrowright'||k==='d') hop(1,0); },
  update(dt){ if(over) return; t+=dt; inv=Math.max(0,inv-dt); if(msgT>0) msgT-=dt;
    for(const l of lanes){ if(l.safe) continue; for(const c of l.cars){ c.x+=l.sp*dt; if(l.sp>0&&c.x>W+20) c.x=-c.w-20; if(l.sp<0&&c.x<-c.w-20) c.x=W+20; } }
    const l=lanes.find(l=>l.r===P.r); if(l&&!l.safe&&inv<=0){ const x=px(); for(const c of l.cars) if(x+rh*0.3>c.x&&x-rh*0.3<c.x+c.w){ hit(); break; } }
    A.hud([score+' pts','nivel '+level,'vidas '+'●'.repeat(Math.max(0,lives))]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let r=0;r<rows;r++){ const y=ry(r); const safe=r===0||r===rows-1||r===4;
      ctx.fillStyle=safe?'rgba(95,214,192,.08)':'rgba(18,36,41,.75)'; ctx.fillRect(0,y,W,rh);
      if(!safe){ ctx.setLineDash([10,12]); ctx.strokeStyle='rgba(37,69,77,.9)'; ctx.beginPath(); ctx.moveTo(0,y+rh); ctx.lineTo(W,y+rh); ctx.stroke(); ctx.setLineDash([]); } }
    A.text('meta',W/2,ry(0)+rh/2,11,'rgba(95,214,192,.7)',700);
    for(const l of lanes) for(const c of l.cars){ ctx.fillStyle=c.c; A.roundRect(c.x,ry(l.r)+rh*0.18,c.w,rh*0.64,5); ctx.fill(); }
    ctx.globalAlpha=inv>0&&Math.floor(t*16)%2?0.3:1; ctx.fillStyle='#6FE0B0';
    const x=px(), y=ry(P.r)+rh/2, s=rh*0.32; ctx.beginPath(); ctx.arc(x,y,s,0,6.283); ctx.fill();
    ctx.fillStyle='#0D1A1E'; ctx.beginPath(); ctx.arc(x-s*0.38,y-s*0.25,s*0.16,0,6.283); ctx.arc(x+s*0.38,y-s*0.25,s*0.16,0,6.283); ctx.fill(); ctx.globalAlpha=1;
    if(msgT>0) A.text(msg,W/2,ry(4)+rh/2,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
