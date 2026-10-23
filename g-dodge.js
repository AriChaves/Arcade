/* Esquiva — bloques que caen, aguanta lo más que puedas */
(function(){
"use strict";
let A, W, H;
const ID='dodge', TOP=46, COLS=['#EE7563','#C58BFF','#F09A6B','#9ED8FF'];
let px, ps, py, blocks, t, over, spawnT, tx, drag, msg, msgT, trail;
function isOn(){ return window.__padGame===ID; }
function overlayShown(){ const o=document.getElementById('over'); return o && !o.classList.contains('hide'); }
function layout(){ ps=Math.max(20,Math.min(28,W*0.045)); py=H-ps/2-10; if(px!==undefined) px=A.clamp(px,ps/2,W-ps/2); }
const game={
  id:ID, name:'Esquiva', accent:'#C58BFF',
  desc:'Caen bloques cada vez más seguido. Esquívalos el mayor tiempo posible.',
  keys:'<kbd>←</kbd><kbd>→</kbd> o <kbd>A</kbd><kbd>D</kbd> moverte · o arrastra el dedo sobre el juego',
  overTitle:'¡Te aplastaron!', fmt:v=>(Math.round(v*10)/10).toFixed(1)+' s',
  init(api){ A=api; const cv=document.getElementById('c');
    const pos=e=>{ const r=cv.getBoundingClientRect(); return e.clientX-r.left; };
    cv.addEventListener('pointerdown',e=>{ if(!isOn()||over||overlayShown()) return; drag=true; tx=pos(e); try{cv.setPointerCapture(e.pointerId)}catch(_){} e.preventDefault(); });
    cv.addEventListener('pointermove',e=>{ if(!isOn()||!drag) return; tx=pos(e); });
    const up=()=>{ drag=false; tx=null; };
    cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up); cv.addEventListener('lostpointercapture',up);
    setInterval(()=>{ if(cv.dataset.ta===ID && !isOn()){ cv.style.touchAction=''; cv.dataset.ta=''; } },300);
  },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; px=undefined; layout(); px=W/2; const cv=document.getElementById('c'); cv.style.touchAction='none'; cv.dataset.ta=ID;
    blocks=[]; t=0; over=false; spawnT=0.5; tx=null; drag=false; trail=[]; msg='¡esquiva los bloques!'; msgT=2; },
  update(dt){
    if(over) return;
    t+=dt; if(msgT>0) msgT-=dt;
    const sp=Math.max(300,W*0.75);
    let dx=0; if(A.keys['arrowleft']||A.keys['a']) dx-=1; if(A.keys['arrowright']||A.keys['d']) dx+=1;
    if(dx) px+=dx*sp*dt; else if(tx!=null) px+=A.clamp(tx-px,-sp*1.3*dt,sp*1.3*dt);
    px=A.clamp(px,ps/2,W-ps/2);
    trail.push({x:px,a:0.35}); for(const p of trail) p.a-=dt*1.6; trail=trail.filter(p=>p.a>0);
    spawnT-=dt;
    const dens=Math.min(t,90);
    if(spawnT<=0){
      spawnT=Math.max(0.16, 0.62-dens*0.006)*(560/Math.max(W,280))**0.5;
      const w=A.rnd(ps*1.1, ps*(1.6+dens*0.03)), h=A.rnd(ps*0.8,ps*1.4);
      blocks.push({x:A.rnd(0,W-w), y:TOP-h, w, h, vy:(H-TOP)*A.rnd(0.55,0.8)*(1+dens*0.012), c:A.pick(COLS)});
    }
    for(let i=blocks.length-1;i>=0;i--){ const b=blocks[i]; b.y+=b.vy*dt;
      if(b.y>H){ blocks.splice(i,1); continue; }
      const m=2;
      if(px+ps/2-m>b.x && px-ps/2+m<b.x+b.w && py+ps/2-m>b.y && py-ps/2+m<b.y+b.h){
        over=true; A.shake(1.2); A.burst(px,py,'#5FD6C0',22);
        const s=Math.round(t*10)/10;
        A.end({score:s, rows:[[s.toFixed(1)+' s','sobreviviste'],[Math.round(dens/0.9)+'%','lluvia de bloques']]});
        return;
      }
    }
    if(Math.floor(t/15)!==Math.floor((t-dt)/15)){ msg=Math.floor(t)+' segundos'; msgT=1.2; }
    A.hud([t.toFixed(1)+' s', 'bloques '+blocks.length]);
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.55)'; ctx.fillRect(0,TOP,W,H-TOP);
    ctx.fillStyle='#25454D'; ctx.fillRect(0,H-4,W,4);
    for(const b of blocks){ ctx.fillStyle=b.c; A.roundRect(b.x,b.y,b.w,b.h,4); ctx.fill();
      ctx.fillStyle='rgba(13,26,30,.25)'; ctx.fillRect(b.x+3,b.y+b.h-5,b.w-6,3); }
    for(const p of trail){ ctx.globalAlpha=Math.max(0,p.a); ctx.fillStyle='#5FD6C0'; ctx.fillRect(p.x-ps/2,py-ps/2,ps,ps); }
    ctx.globalAlpha=1;
    ctx.fillStyle='#5FD6C0'; A.roundRect(px-ps/2,py-ps/2,ps,ps,5); ctx.fill();
    ctx.fillStyle='#0D1A1E'; ctx.fillRect(px-ps*0.25,py-ps*0.15,3,4); ctx.fillRect(px+ps*0.25-3,py-ps*0.15,3,4);
    if(msgT>0) A.text(msg,W/2,TOP+24,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
