/* Tiro al blanco — dianas que se encogen */
(function(){
"use strict";
let A, W, H;
const ID='target', TOP=46, TIME=45;
let tg, ch, score, hits, shots, misses, over, left, spawnT, t, msg, msgT, flash, combo;
function isOn(){ return window.__padGame===ID; }
function overlayShown(){ const o=document.getElementById('over'); return o && !o.classList.contains('hide'); }
function r0(){ return Math.max(24, Math.min(46, Math.min(W,H-TOP)*0.1)); }
function finish(why){
  if(over) return; over=true; game.overTitle=why;
  const acc=shots?Math.round(hits/shots*100):0;
  A.end({score, rows:[[hits,'aciertos'],[acc+'%','puntería']]});
}
function spawn(){
  const R=r0(), m=R+6;
  for(let k=0;k<12;k++){
    const x=A.rnd(m,W-m), y=A.rnd(TOP+m,H-m);
    if(tg.every(o=>Math.hypot(o.x-x,o.y-y)>o.R+R+6)){
      const life=Math.max(1.4, 2.6-t*0.025);
      tg.push({x,y,R,age:0,life}); return;
    }
  }
}
function shoot(x,y){
  if(over) return;
  shots++;
  let best=null, bd=1e9;
  for(const o of tg){ const r=o.R*(1-o.age/o.life); const d=Math.hypot(o.x-x,o.y-y); if(d<=r+6 && d<bd){ best=o; bd=d; } }
  if(best){
    const r=best.R*(1-best.age/best.life), bull=bd<r*0.35;
    combo++; const pts=(bull?30:15)+Math.round((1-best.age/best.life)*10)+Math.min(combo-1,5)*2;
    score+=pts; hits++; tg.splice(tg.indexOf(best),1);
    A.burst(best.x,best.y,bull?'#FFCE5C':'#5FD6C0',bull?16:10);
    msg=(bull?'¡centro! ':'')+'+'+pts; msgT=0.7;
  } else { combo=0; flash=0.15; }
}
const game={
  id:ID, name:'Tiro al blanco', accent:'#EE7563',
  desc:'Las dianas aparecen y se encogen: dispárales antes de que desaparezcan.',
  keys:'<kbd>←</kbd><kbd>↑</kbd><kbd>→</kbd><kbd>↓</kbd> mover la mira · <kbd>Espacio</kbd> disparar · o toca las dianas',
  overTitle:'Fin del tiro', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(!isOn()||over||!tg||overlayShown()) return; const r=cv.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
      ch.x=x; ch.y=Math.max(TOP,y); shoot(x,y); e.preventDefault(); });
    setInterval(()=>{ if(cv.dataset.ta===ID && !isOn()){ cv.style.touchAction=''; cv.dataset.ta=''; } },300);
  },
  resize(w,h){ W=w; H=h; if(ch){ ch.x=A.clamp(ch.x,0,W); ch.y=A.clamp(ch.y,TOP,H); } },
  start(){ W=A.W; H=A.H; const cv=document.getElementById('c'); cv.style.touchAction='none'; cv.dataset.ta=ID;
    tg=[]; ch={x:W/2,y:(TOP+H)/2}; score=0; hits=0; shots=0; misses=0; over=false; left=TIME; spawnT=0.5; t=0; flash=0; combo=0;
    msg='toca las dianas antes de que se achiquen'; msgT=2.2; game.overTitle='Fin del tiro'; },
  keydown(e){ const k=e.key.toLowerCase();
    if(k===' '||k==='spacebar'||k==='enter') shoot(ch.x,ch.y); },
  update(dt){
    if(over) return;
    t+=dt; left-=dt; if(msgT>0) msgT-=dt; if(flash>0) flash-=dt;
    const sp=Math.max(260,W*0.55);
    if(A.keys['arrowleft']||A.keys['a']) ch.x-=sp*dt;
    if(A.keys['arrowright']||A.keys['d']) ch.x+=sp*dt;
    if(A.keys['arrowup']||A.keys['w']) ch.y-=sp*dt;
    if(A.keys['arrowdown']||A.keys['s']) ch.y+=sp*dt;
    ch.x=A.clamp(ch.x,0,W); ch.y=A.clamp(ch.y,TOP,H);
    spawnT-=dt;
    const maxN=t<10?2:t<25?3:4;
    if(spawnT<=0 && tg.length<maxN){ spawn(); spawnT=Math.max(0.35,0.9-t*0.012); }
    for(let i=tg.length-1;i>=0;i--){ const o=tg[i]; o.age+=dt;
      if(o.age>=o.life){ tg.splice(i,1); misses++; combo=0; A.burst(o.x,o.y,'#7E9A9E',6); A.shake(0.3);
        if(misses>=3){ A.hud([score+' pts','fallos 3/3',Math.ceil(Math.max(0,left))+'s']); return finish('Se escaparon 3 dianas'); }
        msg='se escapó ('+misses+'/3)'; msgT=1; } }
    A.hud([score+' pts','fallos '+misses+'/3',Math.ceil(Math.max(0,left))+'s'],{pct:Math.max(0,left)/TIME,col:left<10?'#EE7563':'#5FD6C0'});
    if(left<=0) return finish('¡Tiempo!');
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=flash>0?'rgba(238,117,99,.12)':'rgba(18,36,41,.55)'; ctx.fillRect(0,TOP,W,H-TOP);
    for(const o of tg){
      const k=1-o.age/o.life, r=o.R*k; if(r<1) continue;
      const rings=['#EE7563','#E9F2EF','#EE7563','#E9F2EF','#FFCE5C'];
      for(let i=0;i<5;i++){ ctx.fillStyle=rings[i]; ctx.beginPath(); ctx.arc(o.x,o.y,r*(1-i*0.19),0,6.283); ctx.fill(); }
      ctx.strokeStyle='rgba(13,26,30,.6)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(o.x,o.y,r,0,6.283); ctx.stroke();
      ctx.strokeStyle=k<0.35?'#EE7563':'rgba(233,242,239,.35)'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(o.x,o.y,o.R+4,-Math.PI/2,-Math.PI/2+6.283*k); ctx.stroke();
    }
    // crosshair
    ctx.strokeStyle='#5FD6C0'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(ch.x,ch.y,11,0,6.283); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ch.x-17,ch.y); ctx.lineTo(ch.x-5,ch.y); ctx.moveTo(ch.x+5,ch.y); ctx.lineTo(ch.x+17,ch.y);
    ctx.moveTo(ch.x,ch.y-17); ctx.lineTo(ch.x,ch.y-5); ctx.moveTo(ch.x,ch.y+5); ctx.lineTo(ch.x,ch.y+17); ctx.stroke();
    if(msgT>0) A.text(msg,W/2,H-16,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
