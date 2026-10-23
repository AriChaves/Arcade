/* Carreras — tres carriles, esquiva autos y junta monedas */
(function(){
"use strict";
let A, W, H;
const ID='racer', TOP=46, CARCOL=['#EE7563','#C58BFF','#F09A6B','#9ED8FF','#FFCE5C'];
let lane, px, cars, coins, dist, speed, lives, inv, over, nextRow, coinN, t, roadX, roadW, lw, carW, carH, py, dash, msg, msgT;
function layout(){
  roadW=Math.min(W*0.7, 330); roadX=(W-roadW)/2; lw=roadW/3;
  carW=Math.min(lw*0.56, 46); carH=Math.min(carW*1.7, (H-TOP)*0.17);
  py=H-carH/2-12;
}
function laneX(l){ return roadX+lw*(l+0.5); }
function isOn(){ return window.__padGame===ID; }
function overlayShown(){ const o=document.getElementById('over'); return o && !o.classList.contains('hide'); }
function move(d){ if(over) return; lane=A.clamp(lane+d,0,2); }
function score(){ return Math.floor(dist/20)+coinN*10; }
function spawnRow(){
  const n=Math.random()<Math.min(0.65,0.2+dist/12000)?2:1;
  const ls=[0,1,2].sort(()=>Math.random()-0.5), blocked=ls.slice(0,n), free=ls.slice(n);
  for(const l of blocked) cars.push({l, y:TOP-carH, col:A.pick(CARCOL), v:0.35});
  if(Math.random()<0.55) coins.push({l:A.pick(free), y:TOP-carH*0.5});
}
function hit(){
  lives--; inv=1.6; A.shake(0.9); A.burst(laneX(lane),py,'#EE7563',16);
  if(lives<=0){ over=true; const s=score();
    A.end({score:s, rows:[[s+' pts','puntos'],[coinN,'monedas']]}); }
  else { msg='¡auch! '+lives+(lives===1?' vida':' vidas'); msgT=1.2; }
}
const game={
  id:ID, name:'Carreras', accent:'#F09A6B',
  desc:'Cambia de carril para esquivar autos y junta monedas. Cada vez más rápido.',
  keys:'<kbd>←</kbd><kbd>→</kbd> o <kbd>A</kbd><kbd>D</kbd> cambiar de carril · o toca a la izquierda o derecha del juego',
  overTitle:'Fin de la carrera', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(!isOn()||over||overlayShown()) return; const r=cv.getBoundingClientRect(); const x=e.clientX-r.left;
      move(x<laneX(lane)?-1:1); e.preventDefault(); });
    setInterval(()=>{ if(cv.dataset.ta===ID && !isOn()){ cv.style.touchAction=''; cv.dataset.ta=''; } },300);
  },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); const cv=document.getElementById('c'); cv.style.touchAction='none'; cv.dataset.ta=ID;
    lane=1; px=laneX(1); cars=[]; coins=[]; dist=0; speed=0; lives=3; inv=0; over=false; nextRow=120; coinN=0; t=0; dash=0;
    msg='◀ ▶ cambia de carril'; msgT=2.2; },
  keydown(e){ const k=e.key.toLowerCase();
    if(k==='arrowleft'||k==='a') move(-1); else if(k==='arrowright'||k==='d') move(1); },
  update(dt){
    if(over) return;
    t+=dt; if(msgT>0) msgT-=dt; if(inv>0) inv-=dt;
    speed=Math.min(560, 200+dist*0.012)*(H/420);
    dist+=speed*dt; dash=(dash+speed*dt)%40;
    px+=(laneX(lane)-px)*Math.min(1,dt*16);
    nextRow-=speed*dt;
    if(nextRow<=0){ spawnRow(); nextRow=Math.max(carH*4.2, carH*6.2-dist/400); }
    for(const c of cars) c.y+=speed*(1-c.v)*dt;
    for(const c of coins) c.y+=speed*0.65*dt;
    cars=cars.filter(c=>c.y<H+carH); coins=coins.filter(c=>c.y<H+30);
    for(let i=coins.length-1;i>=0;i--){ const c=coins[i];
      if(Math.abs(laneX(c.l)-px)<lw*0.5 && Math.abs(c.y-py)<carH*0.6){ coins.splice(i,1); coinN++; A.burst(px,py-carH/2,'#FFCE5C',8); } }
    if(inv<=0) for(const c of cars){
      if(Math.abs(laneX(c.l)-px)<carW*0.85 && Math.abs(c.y-py)<carH*0.9){ hit(); break; } }
    A.hud([score()+' pts', '♥'.repeat(Math.max(0,lives)), Math.round(speed/(H/420)/4)+' km/h']);
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    // grass + road
    ctx.fillStyle='#122429'; ctx.fillRect(0,TOP,W,H-TOP);
    ctx.fillStyle='#193036'; ctx.fillRect(roadX,TOP,roadW,H-TOP);
    ctx.fillStyle='#E9F2EF'; ctx.fillRect(roadX-3,TOP,3,H-TOP); ctx.fillRect(roadX+roadW,TOP,3,H-TOP);
    ctx.fillStyle='rgba(233,242,239,.45)';
    for(let l=1;l<3;l++) for(let y=TOP-40+dash;y<H;y+=40) ctx.fillRect(roadX+lw*l-1.5,y,3,20);
    // side marks
    ctx.fillStyle='rgba(95,214,192,.18)';
    for(let y=TOP-60+((dash*1.5)%60);y<H;y+=60){ ctx.fillRect(roadX-18,y,8,26); ctx.fillRect(roadX+roadW+10,y,8,26); }
    for(const c of coins){ const x=laneX(c.l), r=Math.min(11,lw*0.16);
      ctx.fillStyle='#FFCE5C'; ctx.beginPath(); ctx.arc(x,c.y,r,0,6.283); ctx.fill();
      A.text('$',x,c.y+1,Math.max(10,r*1.2),'#0D1A1E',700); }
    const car=(x,y,col,me)=>{
      ctx.fillStyle=col; A.roundRect(x-carW/2,y-carH/2,carW,carH,6); ctx.fill();
      ctx.fillStyle='rgba(13,26,30,.75)';
      ctx.fillRect(x-carW*0.34,y+(me?-carH*0.28:carH*0.12),carW*0.68,carH*0.16);
      ctx.fillStyle='#0D1A1E';
      ctx.fillRect(x-carW/2-3,y-carH*0.34,4,carH*0.2); ctx.fillRect(x+carW/2-1,y-carH*0.34,4,carH*0.2);
      ctx.fillRect(x-carW/2-3,y+carH*0.16,4,carH*0.2); ctx.fillRect(x+carW/2-1,y+carH*0.16,4,carH*0.2);
    };
    for(const c of cars) car(laneX(c.l),c.y,c.col,false);
    if(!(inv>0 && Math.floor(inv*10)%2)) car(px,py,'#5FD6C0',true);
    if(msgT>0) A.text(msg,W/2,TOP+24,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
