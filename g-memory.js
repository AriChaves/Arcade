/* Cache Hit — memoria de pares */
(function(){
"use strict";
let A, W, H;
const R=4, C=4;
const ICONS=['{ }','</>','#','$','&&','=>','[ ]','%'];
const COLS=['#5FD6C0','#FFCE5C','#C58BFF','#EE7563','#9ED8FF','#F09A6B','#6FE0B0','#E9F2EF'];
let cards, cur, open, waitT, moves, pairs, t, over, cell, ox, oy, msg, msgT, misses;
function layout(){ cell=Math.floor(Math.min((W-30)/C,(H-62)/R)); ox=Math.round((W-cell*C)/2); oy=52+Math.round((H-58-cell*R)/2); }
function flip(){
  if(over||waitT>0) return; const c=cards[cur]; if(c.up||c.done) return;
  c.up=true; c.pop=1; open.push(cur);
  if(open.length===2){ moves++; const [a,b]=open.map(i=>cards[i]);
    if(a.v===b.v){ a.done=b.done=true; pairs++; open=[]; A.burst(ox+(cur%C+.5)*cell,oy+((cur/C|0)+.5)*cell,COLS[a.v],10); msg='cache hit'; msgT=1;
      if(pairs===R*C/2){ over=true; const sc=Math.max(50,1000-misses*40); A.end({score:sc, rows:[[sc,'puntos'],[moves,'intentos']]}); } }
    else { misses++; waitT=0.8; msg='cache miss'; msgT=0.8; } }
}
const game={
  id:'memory', name:'Cache Hit', accent:'#6FE0B0',
  desc:'Memoria: voltea dos cartas y encuentra los 8 pares con pocos intentos.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> voltear carta · o toca la carta',
  overTitle:'Caché completo',
  fmt:v=>Math.round(v)+' pts',
  init(api){ A=api;
    const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='memory'||!cards) return; const r=cv.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
      const c=Math.floor((x-ox)/cell), rr=Math.floor((y-oy)/cell); if(c>=0&&c<C&&rr>=0&&rr<R){ cur=rr*C+c; flip(); } }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); const vals=[]; for(let i=0;i<R*C/2;i++) vals.push(i,i);
    for(let i=vals.length-1;i>0;i--){ const j=A.ri(i+1); [vals[i],vals[j]]=[vals[j],vals[i]]; }
    cards=vals.map(v=>({v,up:false,done:false,pop:0})); cur=0; open=[]; waitT=0; moves=0; pairs=0; misses=0; t=0; over=false; msg='encuentra los pares'; msgT=2; },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return; let r=cur/C|0, c=cur%C;
    if(k==='arrowleft'||k==='a') c=(c+C-1)%C; else if(k==='arrowright'||k==='d') c=(c+1)%C;
    else if(k==='arrowup'||k==='w') r=(r+R-1)%R; else if(k==='arrowdown'||k==='s') r=(r+1)%R;
    else if(k===' '||k==='spacebar'||k==='enter'){ flip(); return; }
    cur=r*C+c; },
  update(dt){ if(over) return; t+=dt; if(msgT>0) msgT-=dt;
    for(const c of cards) c.pop=Math.max(0,c.pop-dt*4);
    if(waitT>0){ waitT-=dt; if(waitT<=0){ for(const i of open) cards[i].up=false; open=[]; } }
    A.hud([pairs+'/8 pares', moves+' intentos']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    cards.forEach((cd,i)=>{ const x=ox+(i%C)*cell, y=oy+(i/C|0)*cell, p=cell*0.06*(1+cd.pop*0.5);
      const show=cd.up||cd.done;
      ctx.fillStyle=cd.done?'rgba(111,224,176,.12)':show?'rgba(25,48,54,1)':'rgba(37,69,77,.75)';
      A.roundRect(x+p,y+p,cell-2*p,cell-2*p,8); ctx.fill();
      ctx.strokeStyle=i===cur?'#FFCE5C':cd.done?'rgba(111,224,176,.5)':'rgba(37,69,77,1)'; ctx.lineWidth=i===cur?2.5:1; ctx.stroke();
      if(show) A.text(ICONS[cd.v],x+cell/2,y+cell/2+1,Math.min(cell*0.32,26),COLS[cd.v],700);
      else A.text('?',x+cell/2,y+cell/2+1,Math.min(cell*0.28,20),'rgba(126,154,158,.6)',700); });
    if(msgT>0) A.text(msg,W/2,H-10,11.5,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
