/* Apaga las luces — Lights Out 5x5 */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const N=5;
let b, cur, level, solved, movesLeft, used, totalMoves, over, wait, msg, msgT, cell, ox, oy, side, pops, presses;

function layout(){
  cell=Math.floor(Math.min((W-24)/N,(H-46-34)/N));
  side = W-cell*N > 300;               // room for a side panel (desktop)
  ox=Math.round(side ? (W-cell*N)/2-60 : (W-cell*N)/2);
  oy=Math.round(52+(H-46-28-cell*N)/2);
}
function toggle(i){
  const r=(i/N)|0, c=i%N;
  const t=[[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
  for(const [rr,cc] of t) if(rr>=0&&rr<N&&cc>=0&&cc<N){ const k=rr*N+cc; b[k]=b[k]?0:1; pops[k]=1; }
}
function newLevel(){
  const k=Math.min(3+level,15);             // distinct presses from a dark board: always solvable in <= k
  do{
    b=new Array(N*N).fill(0); presses=[];
    const pool=[...Array(N*N).keys()];
    for(let i=0;i<k;i++){ const j=A.ri(pool.length); presses.push(pool[j]); toggle(pool[j]); pool.splice(j,1); }
  }while(b.every(v=>!v));
  pops.fill(0);
  movesLeft=k+Math.max(3,8-level);           // slack shrinks with level
  used=0; wait=false;
  msg='nivel '+(level+1)+' · apaga todas las luces'; msgT=1.8;
}
function press(i){
  if(over||wait) return;
  cur=i; toggle(i); used++; totalMoves++; movesLeft--;
  if(b.every(v=>!v)){
    solved++; level++; wait=true; msg='¡nivel superado!'; msgT=1.2;
    A.burst(ox+cell*N/2,oy+cell*N/2,'#FFCE5C',18);
    later(()=>{ if(!over) newLevel(); },1100);
  } else if(movesLeft<=0){
    over=true; A.shake(0.6); msg='sin movidas'; msgT=3;
    later(()=>A.end({score:solved, rows:[[solved,'niveles'],[totalMoves,'movidas']]}),900);
  }
}
const game={
  id:'lights', name:'Apaga las luces', accent:'#FFCE5C',
  desc:'Cada toque cambia la casilla y sus vecinas: apágalas todas antes de quedarte sin movidas.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> pulsar · o toca la casilla',
  overTitle:'Se acabaron las movidas', fmt:v=>Math.round(v)+(Math.round(v)===1?' nivel':' niveles'),
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='lights'||!b) return; const r=cv.getBoundingClientRect();
      const c=Math.floor((e.clientX-r.left-ox)/cell), rr=Math.floor((e.clientY-r.top-oy)/cell);
      if(c>=0&&c<N&&rr>=0&&rr<N) press(rr*N+c); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); pops=new Array(N*N).fill(0); cur=12; level=0; solved=0; totalMoves=0; over=false; newLevel(); },
  keydown(e){ const k=e.key.toLowerCase(); let r=(cur/N)|0, c=cur%N;
    if(k==='arrowleft'||k==='a') c=(c+N-1)%N; else if(k==='arrowright'||k==='d') c=(c+1)%N;
    else if(k==='arrowup'||k==='w') r=(r+N-1)%N; else if(k==='arrowdown'||k==='s') r=(r+1)%N;
    else if(k===' '||k==='spacebar'||k==='enter'){ press(cur); return; }
    cur=r*N+c; },
  dbg(){ return {b:b.slice(), presses:presses.slice(), ox, oy, cell, movesLeft, level, cur}; },
  update(dt){ if(msgT>0) msgT-=dt; for(let i=0;i<N*N;i++) if(pops[i]>0) pops[i]=Math.max(0,pops[i]-dt*5);
    A.hud(['nivel '+(level+1), movesLeft+' movidas', solved+' superados'], {pct:movesLeft/(movesLeft+used||1), col:movesLeft<=2?'#EE7563':'#FFCE5C'}); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.9)'; A.roundRect(ox-8,oy-8,cell*N+16,cell*N+16,10); ctx.fill();
    for(let i=0;i<N*N;i++){ const x=ox+(i%N)*cell, y=oy+((i/N)|0)*cell, p=1+pops[i]*0.08, s=(cell-8)*p;
      if(b[i]){ ctx.fillStyle='rgba(255,206,92,.95)'; ctx.shadowColor='rgba(255,206,92,.55)'; ctx.shadowBlur=12; }
      else { ctx.fillStyle='rgba(37,69,77,.75)'; ctx.shadowBlur=0; }
      A.roundRect(x+cell/2-s/2,y+cell/2-s/2,s,s,7); ctx.fill(); ctx.shadowBlur=0;
      if(i===cur&&!over){ ctx.strokeStyle='#5FD6C0'; ctx.lineWidth=3; A.roundRect(x+2,y+2,cell-4,cell-4,8); ctx.stroke(); } }
    const lit=b.filter(v=>v).length;
    if(side){ const sx=ox+cell*N+30; ctx.textAlign='left';
      A.text('Nivel '+(level+1),sx,oy+14,20,'#FFCE5C',700);
      A.text(movesLeft+' movidas',sx,oy+46,15,movesLeft<=2?'#EE7563':'#E9F2EF',700);
      A.text(lit+' luces encendidas',sx,oy+72,13,'#7E9A9E');
      A.text('Tocar una casilla',sx,oy+110,12,'#7E9A9E'); A.text('cambia ella y sus',sx,oy+128,12,'#7E9A9E'); A.text('cuatro vecinas.',sx,oy+146,12,'#7E9A9E');
      ctx.textAlign='center'; }
    const ty=Math.min(oy+cell*N+20,H-10);
    if(msgT>0) A.text(msg,ox+cell*N/2,ty,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
    else if(!side) A.text(movesLeft+' movidas · '+lit+' luces',ox+cell*N/2,ty,12,'#7E9A9E',700); }
};
window.Arcade.register(game);
})();
