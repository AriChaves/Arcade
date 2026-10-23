/* Torres de Hanói */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const COLS=['#EE7563','#F09A6B','#FFCE5C','#6FE0B0','#5FD6C0','#9ED8FF','#C58BFF'];
let pegs, n, level, solved, held, from, cur, limit, moves, totalMoves, over, wait, msg, msgT, dh, baseY, maxW;

function layout(){
  dh=Math.max(14,Math.min(26,Math.floor((H-46-110)/8)));
  baseY=H-34; maxW=Math.min(W/3-14,190);
}
function px(i){ return W*(1+2*i)/6; }
function newLevel(){
  n=Math.min(3+level,7);
  pegs=[[],[],[]]; for(let d=n;d>=1;d--) pegs[0].push(d);
  held=0; from=-1; moves=0; wait=false;
  const min=(1<<n)-1;
  limit=min*2+Math.max(2,6-level);
  msg='nivel '+(level+1)+' · lleva los '+n+' discos a la torre 3'; msgT=2.2;
}
function act(i){
  if(over||wait) return;
  cur=i;
  if(!held){
    if(!pegs[i].length){ msg='esa torre está vacía'; msgT=0.8; return; }
    held=pegs[i].pop(); from=i;
  } else {
    const top=pegs[i][pegs[i].length-1];
    if(top && top<held){ msg='no puedes poner un disco grande sobre uno chico'; msgT=1.2; A.shake(0.25); return; }
    pegs[i].push(held); held=0;
    if(i!==from){ moves++; totalMoves++; }
    from=-1;
    if(pegs[2].length===n){
      solved++; level++; wait=true; msg='¡torre completa!'; msgT=1.3;
      A.burst(px(2),baseY-n*dh,'#FFCE5C',20);
      later(()=>{ if(!over) newLevel(); },1200);
    } else if(moves>=limit){
      over=true; A.shake(0.6); msg='¡sin movidas!'; msgT=3;
      later(()=>A.end({score:solved, rows:[[solved,'niveles'],[n,'discos en el último']]}),800);
    }
  }
}
const game={
  id:'hanoi', name:'Torres de Hanói', accent:'#9ED8FF',
  desc:'Pasa todos los discos a la tercera torre sin poner uno grande sobre uno chico. Tienes movidas contadas, sin reloj.',
  keys:'<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> tomar o soltar en esa torre · <kbd>←</kbd><kbd>→</kbd> + <kbd>Espacio</kbd> · o toca la torre',
  overTitle:'Sin movidas', fmt:v=>Math.round(v)+(Math.round(v)===1?' nivel':' niveles'),
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='hanoi'||!pegs) return; const r=cv.getBoundingClientRect();
      const x=e.clientX-r.left, y=e.clientY-r.top; if(y<46) return; act(Math.max(0,Math.min(2,Math.floor(x/(W/3))))); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); level=0; solved=0; totalMoves=0; cur=0; over=false; newLevel(); },
  keydown(e){ const k=e.key.toLowerCase();
    if(k==='1'||k==='2'||k==='3') act(+k-1);
    else if(k==='arrowleft'||k==='a') cur=(cur+2)%3;
    else if(k==='arrowright'||k==='d') cur=(cur+1)%3;
    else if(k===' '||k==='spacebar'||k==='enter'||k==='arrowup'||k==='arrowdown'||k==='w'||k==='s') act(cur); },
  dbg(){ return {pegs:pegs.map(p=>p.slice()), n, held, moves, limit}; },
  update(dt){ if(msgT>0) msgT-=dt;
    const left=Math.max(0,limit-moves);
    A.hud(['nivel '+(level+1), n+' discos', 'quedan '+left+' movidas'], {pct:left/limit, col:left<=3?'#EE7563':'#9ED8FF'}); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const pegH=dh*8+10, minW=Math.max(26,maxW*0.28);
    const dw=d=>minW+(maxW-minW)*(d-1)/6;
    ctx.fillStyle='rgba(37,69,77,.9)'; A.roundRect(10,baseY,W-20,10,4); ctx.fill();
    for(let i=0;i<3;i++){ const x=px(i);
      if(i===cur&&!over){ ctx.fillStyle='rgba(95,214,192,.08)'; A.roundRect(x-W/6+6,baseY-pegH-30,W/3-12,pegH+46,10); ctx.fill(); }
      ctx.fillStyle=i===2?'rgba(255,206,92,.55)':'rgba(126,154,158,.7)'; A.roundRect(x-4,baseY-pegH,8,pegH,4); ctx.fill();
      A.text(String(i+1),x,baseY+21,12,i===cur?'#5FD6C0':'#7E9A9E',700);
      pegs[i].forEach((d,j)=>{ const w=dw(d), y=baseY-(j+1)*dh;
        ctx.fillStyle=COLS[d-1]; A.roundRect(x-w/2,y+1,w,dh-2,Math.min(8,dh/2)); ctx.fill(); }); }
    if(held){ const w=dw(held), x=px(cur), y=baseY-pegH-24;
      ctx.fillStyle=COLS[held-1]; ctx.shadowColor=COLS[held-1]; ctx.shadowBlur=14; A.roundRect(x-w/2,y,w,dh-2,Math.min(8,dh/2)); ctx.fill(); ctx.shadowBlur=0; }
    if(msgT>0) A.text(msg,W/2,58,W<500?11:13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
