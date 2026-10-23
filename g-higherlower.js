/* Mayor o menor — adivina la siguiente carta */
(function(){
"use strict";
let A, W, H;
const SU=['♠','♥','♦','♣'], RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let cur, nxt, streak, bestStreak, over, revealT, guess, endT, btns, ch, cw, msg, msgCol, flash;
function rc(){ return {r:A.ri(13), s:A.ri(4)}; }
function layout(){ const bh=Math.max(46,Math.min(64,H*0.13)); const gap=12, bw=Math.min(230,(W-32-gap)/2), x0=(W-bw*2-gap)/2, by=H-bh-10;
  btns=[{id:'up',t:'▲ Mayor',x:x0,y:by,w:bw,h:bh},{id:'dn',t:'▼ Menor',x:x0+bw+gap,y:by,w:bw,h:bh}];
  ch=Math.floor(Math.min(170,by-46-76)); cw=Math.floor(ch*0.7); }
function choose(g){ if(over||revealT>0||endT>0) return; guess=g; nxt=rc(); revealT=0.55; }
function resolve(){
  const ok = nxt.r===cur.r || (guess==='up' ? nxt.r>cur.r : nxt.r<cur.r);
  if(ok){ streak++; bestStreak=Math.max(bestStreak,streak);
    msg=nxt.r===cur.r?'¡empate, cuenta como acierto!':'¡bien! racha '+streak; msgCol='#5FD6C0'; flash=0.4;
    A.burst(W/2+cw*0.8,46+(btns[0].y-46)/2,'#5FD6C0',10); cur=nxt; nxt=null; guess=null; }
  else { over=true; msg='era '+RK[nxt.r]+' · fallaste'; msgCol='#EE7563'; A.shake(0.6); endT=1.4; }
}
function drawCard(c,x,y,hidden){ const ctx=A.ctx;
  ctx.fillStyle=hidden?'#25454D':'#F4F1E8'; A.roundRect(x,y,cw,ch,Math.max(6,cw*0.09)); ctx.fill();
  ctx.strokeStyle=hidden?'rgba(95,214,192,.5)':'rgba(13,26,30,.5)'; ctx.lineWidth=1.5; ctx.stroke();
  if(hidden){ A.text('?',x+cw/2,y+ch/2,ch*0.35,'rgba(95,214,192,.75)',700); return; }
  const red=c.s===1||c.s===2, col=red?'#C8372D':'#14181A';
  ctx.textAlign='left'; A.text(RK[c.r],x+cw*0.1,y+ch*0.13,Math.max(12,ch*0.17),col,700);
  ctx.textAlign='center'; A.text(SU[c.s],x+cw/2,y+ch*0.55,ch*0.4,col,500);
  A.text(RK[c.r],x+cw/2,y+ch*0.86,Math.max(11,ch*0.13),col,700); }
const game={
  id:'higherlower', name:'Mayor o menor', accent:'#9ED8FF',
  desc:'¿La siguiente carta es mayor o menor? Un error y se acaba tu racha.',
  keys:'<kbd>↑</kbd> mayor · <kbd>↓</kbd> menor · o toca los botones · A vale 1, K vale 13, empate cuenta como acierto',
  overTitle:'Se acabó la racha', fmt:v=>Math.round(v)+' aciertos',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='higherlower'||!btns||!cur) return; const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
      const b=btns.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h); if(b) choose(b.id); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); cur=rc(); nxt=null; streak=0; bestStreak=0; over=false; revealT=0; guess=null; endT=0; flash=0;
    msg='¿la siguiente es mayor o menor?'; msgCol='#E9F2EF'; },
  keydown(e){ const k=e.key.toLowerCase();
    if(k==='arrowup'||k==='w'||k==='1') choose('up'); else if(k==='arrowdown'||k==='s'||k==='2') choose('dn'); },
  update(dt){ if(flash>0) flash-=dt;
    if(revealT>0){ revealT-=dt; if(revealT<=0) resolve(); }
    if(endT>0){ endT-=dt; if(endT<=0){ endT=-1; A.end({score:streak, rows:[[streak,'aciertos'],[RK[cur.r]+SU[cur.s]+' → '+RK[nxt.r]+SU[nxt.s],'última']]}); } }
    A.hud(['racha '+streak, 'carta '+RK[cur.r]]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const cy=52+((btns[0].y-52)-ch-22)/2+18, gap=Math.min(70,W*0.08);
    const x1=W/2-cw-gap/2, x2=W/2+gap/2;
    A.text('actual',x1+cw/2,cy-10,11,'#7E9A9E',700); A.text('siguiente',x2+cw/2,cy-10,11,'#7E9A9E',700);
    drawCard(cur,x1,cy,false);
    if(nxt&&revealT<=0.3){ drawCard(nxt,x2,cy,false); if(over){ ctx.strokeStyle='#EE7563'; ctx.lineWidth=3; A.roundRect(x2-3,cy-3,cw+6,ch+6,9); ctx.stroke(); } }
    else drawCard(null,x2,cy,true);
    if(guess) A.text(guess==='up'?'▲':'▼',W/2,cy+ch/2,Math.min(28,gap*0.6),'#FFCE5C',700);
    A.text(msg,W/2,cy+ch+14,Math.min(14,W/28),msgCol,700);
    for(const b of btns){ const on=guess===b.id;
      ctx.fillStyle=on?'rgba(158,216,255,.35)':b.id==='up'?'rgba(111,224,176,.18)':'rgba(238,117,99,.16)'; A.roundRect(b.x,b.y,b.w,b.h,12); ctx.fill();
      ctx.strokeStyle=b.id==='up'?'#6FE0B0':'#EE7563'; ctx.lineWidth=1.5; ctx.stroke();
      A.text(b.t,b.x+b.w/2,b.y+b.h/2,Math.min(18,b.w/8),'#E9F2EF',700); }
  }
};
window.Arcade.register(game);
})();
