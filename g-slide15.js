/* Rompecabezas 15 — piezas deslizantes 4x4 */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const N=4;
let b, gap, moves, over, msg, msgT, cell, ox, oy, side, anim, shuf;

function layout(){
  cell=Math.floor(Math.min((W-24)/N,(H-46-34)/N));
  side=W-cell*N>300;
  ox=Math.round(side?(W-cell*N)/2-70:(W-cell*N)/2);
  oy=Math.round(52+(H-46-28-cell*N)/2);
}
function nb(i){ const r=(i/N)|0, c=i%N, o=[]; if(r>0)o.push(i-N); if(r<N-1)o.push(i+N); if(c>0)o.push(i-1); if(c<N-1)o.push(i+1); return o; }
function shuffle(){
  b=[]; for(let i=1;i<N*N;i++) b.push(i); b.push(0); gap=N*N-1; shuf=[gap];
  let prev=-1;
  // random walk of the gap from the solved state: always solvable
  for(let k=0;k<160||solvedNow();k++){
    const o=nb(gap).filter(x=>x!==prev); const j=A.pick(o);
    b[gap]=b[j]; b[j]=0; prev=gap; gap=j; shuf.push(gap);
  }
}
function solvedNow(){ for(let i=0;i<N*N-1;i++) if(b[i]!==i+1) return false; return true; }
function slideFrom(i){ // move tile at i into the gap (i next to gap)
  b[gap]=b[i]; b[i]=0; anim[gap]={from:i,t:1}; gap=i; moves++;
}
function tap(i){
  if(over||i===gap) return;
  const r=(i/N)|0, c=i%N, gr=(gap/N)|0, gc=gap%N;
  if(r!==gr&&c!==gc) return;
  // slide a whole row/column toward the gap
  while(gap!==i){ const step = r===gr ? (c>gc?1:-1) : (r>gr?N:-N); slideFrom(gap+step); }
  check();
}
function key(dr,dc){ // arrow: the tile on the opposite side of the gap moves in that direction
  if(over) return; const gr=(gap/N)|0, gc=gap%N, r=gr-dr, c=gc-dc;
  if(r<0||r>=N||c<0||c>=N) return; slideFrom(r*N+c); check();
}
function check(){
  if(!solvedNow()) return;
  over=true;
  const sc=Math.max(50,Math.round(3000-moves*6));
  msg='¡resuelto!'; msgT=3; A.burst(ox+cell*N/2,oy+cell*N/2,'#6FE0B0',24);
  game.overTitle='¡Rompecabezas resuelto!';
  later(()=>A.end({score:sc, rows:[[moves,'movidas']]}),900);
}
const game={
  id:'slide15', name:'Rompecabezas 15', accent:'#6FE0B0',
  desc:'Ordena las fichas del 1 al 15 deslizándolas hacia el hueco, con las menos movidas posibles. Sin reloj.',
  keys:'<kbd>flechas</kbd> mueven la ficha hacia el hueco · o toca una ficha en la fila o columna del hueco',
  overTitle:'¡Rompecabezas resuelto!', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='slide15'||!b) return; const r=cv.getBoundingClientRect();
      const c=Math.floor((e.clientX-r.left-ox)/cell), rr=Math.floor((e.clientY-r.top-oy)/cell);
      if(c>=0&&c<N&&rr>=0&&rr<N) tap(rr*N+c); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); anim={}; moves=0; over=false; game.overTitle='¡Rompecabezas resuelto!'; shuffle(); msg='ordena del 1 al 15'; msgT=2; },
  keydown(e){ const k=e.key.toLowerCase();
    if(k==='arrowleft'||k==='a') key(0,-1); else if(k==='arrowright'||k==='d') key(0,1);
    else if(k==='arrowup'||k==='w') key(-1,0); else if(k==='arrowdown'||k==='s') key(1,0); },
  dbg(){ return {b:b.slice(), gap, shuf:shuf.slice(), ox, oy, cell}; },
  update(dt){ if(msgT>0) msgT-=dt;
    for(const k in anim){ anim[k].t-=dt*9; if(anim[k].t<=0) delete anim[k]; }
    const ok=b.filter((v,i)=>v===i+1).length;
    A.hud([moves+' movidas', ok+'/15 en su lugar']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.9)'; A.roundRect(ox-8,oy-8,cell*N+16,cell*N+16,10); ctx.fill();
    for(let i=0;i<N*N;i++){ const v=b[i]; if(!v) continue;
      let x=ox+(i%N)*cell, y=oy+((i/N)|0)*cell;
      const a=anim[i]; if(a){ const fx=ox+(a.from%N)*cell, fy=oy+((a.from/N)|0)*cell, k=Math.max(0,a.t); x+= (fx-x)*k; y+=(fy-y)*k; }
      const ok=v===i+1;
      ctx.fillStyle=ok?'rgba(111,224,176,.32)':'rgba(37,69,77,1)'; A.roundRect(x+3,y+3,cell-6,cell-6,8); ctx.fill();
      ctx.strokeStyle=ok?'rgba(111,224,176,.8)':'rgba(126,154,158,.35)'; ctx.lineWidth=1.5; ctx.stroke();
      A.text(String(v),x+cell/2,y+cell/2+1,Math.min(30,cell*0.42),ok?'#6FE0B0':'#E9F2EF',700); }
    if(side){ const sx=ox+cell*N+34; ctx.textAlign='left';
      A.text(moves+' movidas',sx,oy+16,18,'#E9F2EF',700);
      A.text('Meta:',sx,oy+90,12,'#7E9A9E');
      const m=16; for(let i=0;i<N*N;i++){ const x=sx+(i%N)*m*1.6, y=oy+112+((i/N)|0)*m*1.4; if(i<15) A.text(String(i+1),x+8,y,11,'#6FE0B0',600); }
      ctx.textAlign='center'; }
    if(msgT>0) A.text(msg,ox+cell*N/2,Math.min(oy+cell*N+20,H-10),12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
