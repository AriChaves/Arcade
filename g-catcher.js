/* Atrapa la fruta — canasta, frutas y bombas */
(function(){
"use strict";
let A, W, H;
const ID='catcher', TOP=46;
const FRUITS=[{c:'#EE7563',n:'manzana'},{c:'#F09A6B',n:'naranja'},{c:'#C58BFF',n:'uva'},{c:'#FFCE5C',n:'limón'},{c:'#6FE0B0',n:'pera'}];
let bx, bw, by, items, score, caught, lives, miss, over, spawnT, t, tx, drag, msg, msgT, inv;
function isOn(){ return window.__padGame===ID; }
function overlayShown(){ const o=document.getElementById('over'); return o && !o.classList.contains('hide'); }
function layout(){ bw=Math.max(62,Math.min(110,W*0.14)); by=H-24; if(bx!==undefined) bx=A.clamp(bx,bw/2,W-bw/2); }
function itemR(){ return Math.max(11,Math.min(16,(H-TOP)*0.045)); }
function loseLife(why){
  lives--; miss=0; A.shake(0.8); inv=0.4;
  if(lives<=0){ over=true;
    A.end({score, rows:[[score+' pts','puntos'],[caught,'frutas']]}); }
  else { msg=why+' · '+lives+(lives===1?' vida':' vidas'); msgT=1.5; }
}
function fallSpeed(){ return (H-TOP)*(0.42+Math.min(t,150)*0.006); }
const game={
  id:ID, name:'Atrapa la fruta', accent:'#6FE0B0',
  desc:'Mueve la canasta para atrapar fruta. ¡Cuidado con las bombas!',
  keys:'<kbd>←</kbd><kbd>→</kbd> o <kbd>A</kbd><kbd>D</kbd> mover la canasta · o arrastra el dedo sobre el juego',
  overTitle:'Se acabó la cosecha', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    const pos=e=>{ const r=cv.getBoundingClientRect(); return e.clientX-r.left; };
    cv.addEventListener('pointerdown',e=>{ if(!isOn()||over||overlayShown()) return; drag=true; tx=pos(e); try{cv.setPointerCapture(e.pointerId)}catch(_){} e.preventDefault(); });
    cv.addEventListener('pointermove',e=>{ if(!isOn()||!drag) return; tx=pos(e); });
    const up=()=>{ drag=false; tx=null; };
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); cv.addEventListener('lostpointercapture',up);
    setInterval(()=>{ if(cv.dataset.ta===ID && !isOn()){ cv.style.touchAction=''; cv.dataset.ta=''; } },300);
  },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; bx=undefined; layout(); bx=W/2; const cv=document.getElementById('c'); cv.style.touchAction='none'; cv.dataset.ta=ID;
    items=[]; score=0; caught=0; lives=3; miss=0; over=false; spawnT=0.6; t=0; tx=null; drag=false; inv=0;
    msg='atrapa la fruta, evita las bombas'; msgT=2.4; },
  update(dt){
    if(over) return;
    t+=dt; if(msgT>0) msgT-=dt; if(inv>0) inv-=dt;
    const sp=W*1.05;
    let dx=0; if(A.keys['arrowleft']||A.keys['a']) dx-=1; if(A.keys['arrowright']||A.keys['d']) dx+=1;
    if(dx) bx+=dx*sp*dt;
    else if(tx!=null){ const d=tx-bx; bx+=A.clamp(d,-sp*1.4*dt,sp*1.4*dt); }
    bx=A.clamp(bx,bw/2,W-bw/2);
    spawnT-=dt;
    if(spawnT<=0){
      spawnT=Math.max(0.42,1.05-t*0.007)*A.rnd(0.8,1.2);
      const r=itemR(), bomb=t>3 && Math.random()<Math.min(0.32,0.14+t*0.002);
      items.push({x:A.rnd(r+4,W-r-4), y:TOP-r, r, bomb, f:A.pick(FRUITS), vy:fallSpeed()*A.rnd(0.85,1.15), rot:A.rnd(0,6)});
    }
    for(let i=items.length-1;i>=0;i--){ const it=items[i];
      it.y+=it.vy*dt; it.rot+=dt*2;
      if(it.y+it.r>=by-8 && it.y-it.r<=by+6 && Math.abs(it.x-bx)<bw/2+it.r*0.4){
        items.splice(i,1);
        if(it.bomb){ A.burst(it.x,it.y,'#EE7563',22); loseLife('¡bomba!'); if(over) return; }
        else { caught++; score+=10+Math.floor(t/20)*2; A.burst(it.x,by-6,it.f.c,8); }
        continue;
      }
      if(it.y-it.r>H){ items.splice(i,1);
        if(!it.bomb){ miss++; A.burst(it.x,H-4,'#7E9A9E',5); if(miss>=3){ loseLife('3 frutas perdidas'); if(over) return; } else { msg='se cayó una ('+miss+'/3)'; msgT=1; } } }
    }
    A.hud([score+' pts', '♥'.repeat(Math.max(0,lives)), 'perdidas '+miss+'/3']);
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.6)'; ctx.fillRect(0,TOP,W,H-TOP);
    ctx.fillStyle='#193036'; ctx.fillRect(0,H-8,W,8);
    for(const it of items){
      if(it.bomb){
        ctx.fillStyle='#0D1A1E'; ctx.strokeStyle='#EE7563'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(it.x,it.y,it.r,0,6.283); ctx.fill(); ctx.stroke();
        ctx.strokeStyle='#7E9A9E'; ctx.beginPath(); ctx.moveTo(it.x+it.r*0.5,it.y-it.r*0.8); ctx.quadraticCurveTo(it.x+it.r,it.y-it.r*1.5,it.x+it.r*1.2,it.y-it.r*1.3); ctx.stroke();
        ctx.fillStyle=(Math.floor(performance.now()/120)%2)?'#FFCE5C':'#EE7563';
        ctx.beginPath(); ctx.arc(it.x+it.r*1.2,it.y-it.r*1.3,3,0,6.283); ctx.fill();
        A.text('!',it.x,it.y+1,Math.max(10,it.r),'#EE7563',800);
      } else {
        ctx.fillStyle=it.f.c; ctx.beginPath(); ctx.arc(it.x,it.y,it.r,0,6.283); ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(it.x-it.r*0.35,it.y-it.r*0.35,it.r*0.3,0,6.283); ctx.fill();
        ctx.strokeStyle='#6FE0B0'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(it.x,it.y-it.r); ctx.lineTo(it.x+Math.cos(it.rot)*3,it.y-it.r-6); ctx.stroke();
      }
    }
    // basket
    const x0=bx-bw/2, h=20;
    ctx.globalAlpha=(inv>0&&Math.floor(inv*12)%2)?0.4:1;
    ctx.fillStyle='#F09A6B';
    ctx.beginPath(); ctx.moveTo(x0,by-h/2); ctx.lineTo(x0+bw,by-h/2); ctx.lineTo(x0+bw-8,by+h/2); ctx.lineTo(x0+8,by+h/2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(13,26,30,.45)'; ctx.lineWidth=1.5;
    for(let i=1;i<5;i++){ const xx=x0+bw*i/5; ctx.beginPath(); ctx.moveTo(xx,by-h/2); ctx.lineTo(xx+(i<2.5?2:-2),by+h/2); ctx.stroke(); }
    ctx.fillStyle='#FFCE5C'; ctx.fillRect(x0-2,by-h/2-3,bw+4,4);
    ctx.globalAlpha=1;
    if(msgT>0) A.text(msg,W/2,TOP+24,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
