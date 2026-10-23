/* Helicóptero — cueva que se cierra */
(function(){
"use strict";
let A, W, H;
const ID='heli', TOP=46, STEP=6;
let cols, heli, dist, over, started, held, blocks, nextBlock, msg, msgT, t, smoke;
function playH(){ return H-TOP; }
function gapAt(d){ const h=playH(); return Math.max(Math.max(82,h*0.34), h*0.8-d*0.018); }
function speed(){ return Math.min(330, 150+dist*0.006); }
let cC, dC;
function newCol(){
  const g=gapAt(dist+W);
  dC+=A.rnd(-0.55,0.55); dC=A.clamp(dC,-2.4,2.4); cC+=dC;
  const lo=TOP+g/2+6, hi=H-g/2-6;
  if(cC<lo){ cC=lo; dC=Math.abs(dC); } if(cC>hi){ cC=hi; dC=-Math.abs(dC); }
  return {top:cC-g/2, bot:cC+g/2};
}
function build(){
  cols=[]; cC=(TOP+H)/2; dC=0;
  const n=Math.ceil(W/STEP)+3;
  for(let i=0;i<n;i++){ const g=gapAt(0); cols.push({top:cC-g/2, bot:cC+g/2}); }
}
function isOn(){ return window.__padGame===ID; }
function overlayShown(){ const o=document.getElementById('over'); return o && !o.classList.contains('hide'); }
function crash(){
  if(over) return; over=true; A.shake(1.3); A.burst(heli.x,heli.y,'#EE7563',22); A.burst(heli.x,heli.y,'#FFCE5C',10);
  const m=Math.floor(dist/10);
  A.end({score:m, rows:[[m+' m','recorridos'],[Math.floor(t)+'s','en el aire']]});
}
let off=0;
const game={
  id:ID, name:'Helicóptero', accent:'#9ED8FF',
  desc:'Vuela por una cueva que se cierra. Mantén apretado para subir.',
  keys:'Mantén <kbd>Espacio</kbd> o <kbd>↑</kbd> para subir, suelta para bajar · o mantén el dedo en el juego',
  overTitle:'¡Choque!', fmt:v=>Math.round(v)+' m',
  init(api){ A=api; const cv=document.getElementById('c');
    const down=e=>{ if(!isOn()||over||overlayShown()) return; held=true; started=true; if(msgT>50) msgT=0.6; try{cv.setPointerCapture(e.pointerId)}catch(_){} e.preventDefault(); };
    const up=()=>{ held=false; };
    cv.addEventListener('pointerdown',down);
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); cv.addEventListener('lostpointercapture',up);
    window.addEventListener('pointerup',up);
    cv.addEventListener('contextmenu',e=>{ if(isOn()) e.preventDefault(); });
    setInterval(()=>{ if(cv.dataset.ta===ID && !isOn()){ cv.style.touchAction=''; cv.dataset.ta=''; } },300);
  },
  resize(w,h){ W=w; H=h; if(cols){ const n=Math.ceil(W/STEP)+3; while(cols.length<n) cols.push(newCol()); } },
  start(){ W=A.W; H=A.H; const cv=document.getElementById('c'); cv.style.touchAction='none'; cv.dataset.ta=ID;
    build(); heli={x:Math.max(70,Math.min(140,W*0.2)), y:(TOP+H)/2, vy:0}; dist=0; off=0; over=false; started=false; held=false;
    blocks=[]; nextBlock=700; msg='mantén apretado para subir'; msgT=99; t=0; smoke=[]; },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return;
    if(k===' '||k==='spacebar'||k==='arrowup'||k==='w'||k==='enter'){ started=true; if(msgT>50) msgT=0.6; } },
  update(dt){
    if(over) return;
    if(msgT>0 && msgT<50) msgT-=dt;
    const up=held||A.keys[' ']||A.keys['arrowup']||A.keys['w']||A.keys['enter'];
    A.hud([Math.floor(dist/10)+' m', 'cueva '+Math.round(gapAt(dist)/playH()*100)+'%']);
    if(!started){ heli.y=(TOP+H)/2+Math.sin(performance.now()/300)*5; return; }
    t+=dt;
    const h=playH();
    heli.vy += (up ? -h*2.0 : h*1.6)*dt;
    heli.vy = A.clamp(heli.vy, -h*0.6, h*0.65);
    heli.y += heli.vy*dt;
    const sp=speed(); dist+=sp*dt; off+=sp*dt;
    while(off>=STEP){ off-=STEP; cols.shift(); cols.push(newCol()); }
    for(const b of blocks) b.x-=sp*dt;
    blocks=blocks.filter(b=>b.x+b.w>-10);
    if(dist>nextBlock){
      nextBlock=dist+A.rnd(420,700);
      const c=cols[cols.length-1], g=c.bot-c.top, bh=g*0.28;
      const y = Math.random()<0.5 ? c.top+A.rnd(0,g*0.12) : c.bot-bh-A.rnd(0,g*0.12);
      blocks.push({x:W+4, y, w:18, h:bh});
    }
    if(Math.random()<dt*14) smoke.push({x:heli.x-18,y:heli.y+2,a:0.5});
    for(const s of smoke){ s.x-=sp*dt*0.9; s.a-=dt*0.9; } smoke=smoke.filter(s=>s.a>0);
    // collisions
    const r=8;
    if(heli.y-r<TOP||heli.y+r>H) return crash();
    const i0=Math.floor((heli.x-16+off)/STEP), i1=Math.floor((heli.x+16+off)/STEP);
    for(let i=Math.max(0,i0);i<=Math.min(cols.length-1,i1);i++){ const c=cols[i]; if(heli.y-r<c.top||heli.y+r>c.bot) return crash(); }
    for(const b of blocks) if(heli.x+14>b.x && heli.x-14<b.x+b.w && heli.y+r>b.y && heli.y-r<b.y+b.h) return crash();
    if(Math.floor(dist/1000)!==Math.floor((dist-sp*dt)/1000)){ msg=Math.floor(dist/10)+' m'; msgT=1.2; }
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    // cave walls
    ctx.fillStyle='#193036';
    ctx.beginPath(); ctx.moveTo(0,TOP);
    cols.forEach((c,i)=>ctx.lineTo(i*STEP-off,c.top)); ctx.lineTo(W+20,TOP); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0,H);
    cols.forEach((c,i)=>ctx.lineTo(i*STEP-off,c.bot)); ctx.lineTo(W+20,H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#5FD6C0'; ctx.lineWidth=2;
    ctx.beginPath(); cols.forEach((c,i)=>i?ctx.lineTo(i*STEP-off,c.top):ctx.moveTo(-off,c.top)); ctx.stroke();
    ctx.beginPath(); cols.forEach((c,i)=>i?ctx.lineTo(i*STEP-off,c.bot):ctx.moveTo(-off,c.bot)); ctx.stroke();
    for(const b of blocks){ ctx.fillStyle='#EE7563'; A.roundRect(b.x,b.y,b.w,b.h,4); ctx.fill(); }
    for(const s of smoke){ ctx.globalAlpha=s.a; ctx.fillStyle='#7E9A9E'; ctx.beginPath(); ctx.arc(s.x,s.y,4,0,6.283); ctx.fill(); }
    ctx.globalAlpha=1;
    // helicopter
    const ang=A.clamp(heli.vy/900,-0.3,0.35);
    ctx.save(); ctx.translate(heli.x,heli.y); ctx.rotate(ang);
    ctx.fillStyle='#9ED8FF'; ctx.fillRect(-20,-2,14,4); ctx.fillRect(-22,-6,3,9);
    ctx.beginPath(); ctx.ellipse(0,0,13,9,0,0,6.283); ctx.fill();
    ctx.fillStyle='#0D1A1E'; ctx.beginPath(); ctx.ellipse(5,-2,5,4,0,0,6.283); ctx.fill();
    ctx.fillStyle='#E9F2EF'; ctx.fillRect(-1,-13,2,4);
    const rw=14*Math.abs(Math.sin(performance.now()/40)); ctx.fillRect(-rw,-14,rw*2,2);
    ctx.fillStyle='#7E9A9E'; ctx.fillRect(-9,10,18,2);
    ctx.restore();
    if(msgT>0) A.text(msg,W/2,(TOP+H)/2+48,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
