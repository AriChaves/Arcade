/* Aplasta el bug — whack-a-mole */
(function(){
"use strict";
let A, W, H;
const N=9, TIME=40;
let holes, score, hits, miss, t, over, spawnT, cell, ox, oy, fx;
function layout(){ cell=Math.floor(Math.min((W-30)/3,(H-60)/3)); ox=Math.round((W-cell*3)/2); oy=50+Math.round((H-54-cell*3)/2); }
function whack(i){ if(over) return; const h=holes[i]; fx.push({i,t:0.25});
  if(h.up>0){ if(h.kind==='bug'){ score+=10+Math.round(h.up*10); hits++; A.burst(ox+(i%3+.5)*cell,oy+((i/3|0)+.5)*cell,'#5FD6C0',8); } else { score=Math.max(0,score-25); A.shake(0.6); miss++; } h.up=0; }
  else { score=Math.max(0,score-3); } }
const game={
  id:'whack', name:'Aplasta el bug', accent:'#6FE0B0',
  desc:'Los bugs salen de los hoyos: aplástalos rápido, pero no al café.',
  keys:'<kbd>1</kbd>–<kbd>9</kbd> (como el teclado numérico) o toca el hoyo',
  overTitle:'Se acabó el tiempo', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='whack'||!holes) return; const r=cv.getBoundingClientRect(); const c=Math.floor((e.clientX-r.left-ox)/cell), rr=Math.floor((e.clientY-r.top-oy)/cell); if(c>=0&&c<3&&rr>=0&&rr<3) whack(rr*3+c); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); holes=Array.from({length:N},()=>({up:0,kind:'bug'})); score=0; hits=0; miss=0; t=0; over=false; spawnT=0.6; fx=[]; },
  keydown(e){ const map={'7':0,'8':1,'9':2,'4':3,'5':4,'6':5,'1':6,'2':7,'3':8}; if(e.key in map) whack(map[e.key]); },
  update(dt){ if(over) return; t+=dt;
    for(const h of holes) if(h.up>0) h.up=Math.max(0,h.up-dt/h.life);
    for(const f of fx) f.t-=dt; fx=fx.filter(f=>f.t>0);
    spawnT-=dt; if(spawnT<=0){ spawnT=Math.max(0.35,0.9-t*0.014); const free=holes.map((h,i)=>h.up>0?-1:i).filter(i=>i>=0); if(free.length){ const h=holes[A.pick(free)]; h.up=1; h.kind=Math.random()<0.15?'cafe':'bug'; h.life=Math.max(0.7,1.5-t*0.02); } }
    if(t>=TIME){ over=true; A.end({score, rows:[[score,'puntos'],[hits,'bugs aplastados'],[miss,'cafés derramados']]}); }
    A.hud([score+' pts', hits+' bugs', Math.max(0,Math.ceil(TIME-t))+'s'], {pct:1-t/TIME, col:'#6FE0B0'}); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    holes.forEach((h,i)=>{ const x=ox+(i%3+.5)*cell, y=oy+((i/3|0)+.5)*cell, r=cell*0.36;
      ctx.fillStyle='rgba(13,26,30,.9)'; ctx.beginPath(); ctx.ellipse(x,y+r*0.45,r,r*0.38,0,0,6.283); ctx.fill();
      ctx.strokeStyle='rgba(37,69,77,1)'; ctx.lineWidth=1.5; ctx.stroke();
      if(h.up>0){ const pop=Math.min(1,(1-h.up)*6, h.up*6), yy=y+r*0.45-pop*r*0.9;
        ctx.save(); ctx.beginPath(); ctx.rect(x-r-4,y-r*1.6,r*2+8,r*2.05+r*0.4); ctx.clip();
        if(h.kind==='bug'){ ctx.fillStyle='#EE7563'; ctx.beginPath(); ctx.ellipse(x,yy,r*0.55,r*0.45,0,0,6.283); ctx.fill();
          ctx.strokeStyle='#EE7563'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-r*0.2,yy-r*0.4); ctx.lineTo(x-r*0.32,yy-r*0.7); ctx.moveTo(x+r*0.2,yy-r*0.4); ctx.lineTo(x+r*0.32,yy-r*0.7); ctx.stroke();
          ctx.fillStyle='#0D1A1E'; ctx.beginPath(); ctx.arc(x-r*0.18,yy-r*0.08,r*0.08,0,6.283); ctx.arc(x+r*0.18,yy-r*0.08,r*0.08,0,6.283); ctx.fill(); }
        else { ctx.fillStyle='#FFCE5C'; A.roundRect(x-r*0.4,yy-r*0.4,r*0.8,r*0.75,6); ctx.fill(); A.text('café',x,yy,Math.max(9,r*0.24),'#0D1A1E',700); }
        ctx.restore(); }
      if(fx.some(f=>f.i===i)){ ctx.strokeStyle='rgba(233,242,239,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,r*1.05,0,6.283); ctx.stroke(); }
      if(cell>70) A.text(String([7,8,9,4,5,6,1,2,3][i]),x+r*0.95,y-r*0.95,10,'rgba(126,154,158,.5)'); }); }
};
window.Arcade.register(game);
})();
