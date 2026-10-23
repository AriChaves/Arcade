/* Bug Invaders — bichos que bajan en formación */
(function(){
"use strict";
let A, W, H;
let P, bugs, shots, bombs, dir, stepT, wave, score, lives, t, over, cd, msg, msgT, inv;
const top=()=>46, BUGS=['#EE7563','#C58BFF','#F09A6B','#5FD6C0','#FFCE5C'];
function makeWave(){
  bugs=[]; const cols=Math.max(5,Math.min(10,Math.floor((W-40)/40))), rows=Math.min(5,3+Math.floor(wave/2));
  const sx=Math.min(40,(W-40)/cols), x0=(W-sx*(cols-1))/2;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) bugs.push({x:x0+c*sx,y:top()+26+r*26,r,alive:true,f:0});
  dir=1; stepT=0; msg='oleada '+wave; msgT=1.6;
}
function lose(){ lives--; A.shake(1.2); A.burst(P.x,P.y,'#EE7563',18); bombs=[];
  if(lives<=0){ over=true; A.end({score, rows:[[score,'puntos'],[wave,'oleadas'],[Math.floor(t)+'s','resististe']]}); return; }
  inv=1.6; msg='te picó un bug · quedan '+lives; msgT=1.6; }
const game={
  id:'invaders', name:'Bug Invaders', accent:'#EE7563',
  desc:'Los bugs bajan en formación. Dispara antes de que lleguen a producción.',
  keys:'<kbd>←</kbd><kbd>→</kbd> mover · <kbd>Espacio</kbd> disparar',
  overTitle:'Los bugs llegaron a producción',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; if(P) P.y=H-22; },
  start(){ W=A.W; H=A.H; P={x:W/2,y:H-22}; shots=[]; bombs=[]; wave=1; score=0; lives=3; t=0; over=false; cd=0; inv=0; makeWave(); },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return;
    if((k===' '||k==='spacebar') && cd<=0 && shots.length<3){ shots.push({x:P.x,y:P.y-12}); cd=0.28; } },
  update(dt){
    if(over) return; t+=dt; cd-=dt; inv=Math.max(0,inv-dt); if(msgT>0) msgT-=dt;
    let mv=0; if(A.keys['arrowleft']||A.keys['a']) mv--; if(A.keys['arrowright']||A.keys['d']) mv++;
    P.x=A.clamp(P.x+mv*Math.max(200,W*0.45)*dt,16,W-16);
    const alive=bugs.filter(b=>b.alive);
    const speed=Math.max(0.06,(0.55-wave*0.04)*(0.25+alive.length/bugs.length*0.75));
    stepT+=dt;
    if(stepT>=speed){ stepT=0; let edge=false;
      for(const b of alive){ b.x+=dir*8; b.f^=1; if(b.x<14||b.x>W-14) edge=true; }
      if(edge){ dir=-dir; for(const b of alive){ b.x+=dir*8; b.y+=12; } } }
    if(alive.length && Math.random()<dt*(0.8+wave*0.25)){ const b=A.pick(alive); bombs.push({x:b.x,y:b.y+8}); }
    for(let i=shots.length-1;i>=0;i--){ const s=shots[i]; s.y-=420*dt; if(s.y<top()){ shots.splice(i,1); continue; }
      for(const b of alive){ if(b.alive && Math.abs(b.x-s.x)<13 && Math.abs(b.y-s.y)<10){ b.alive=false; shots.splice(i,1); score+=10*(5-b.r)+wave*2; A.burst(b.x,b.y,BUGS[b.r%5],8); break; } } }
    for(let i=bombs.length-1;i>=0;i--){ const b=bombs[i]; b.y+=(150+wave*12)*dt; if(b.y>H){ bombs.splice(i,1); continue; }
      if(inv<=0 && Math.abs(b.x-P.x)<14 && Math.abs(b.y-P.y)<10){ bombs.splice(i,1); lose(); if(over) return; } }
    for(const b of alive) if(b.y>P.y-16){ lives=1; lose(); return; }
    if(!bugs.some(b=>b.alive)){ wave++; score+=100; makeWave(); }
    A.hud([score+' pts','oleada '+wave,'vidas '+'●'.repeat(Math.max(0,lives))]);
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.5)'; ctx.fillRect(0,top(),W,H-top());
    for(const b of bugs){ if(!b.alive) continue; const c=BUGS[b.r%5];
      ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(b.x,b.y,8,6,0,0,6.283); ctx.fill();
      ctx.strokeStyle=c; ctx.lineWidth=1.5; ctx.beginPath(); const l=b.f?3:-3;
      ctx.moveTo(b.x-8,b.y); ctx.lineTo(b.x-12,b.y+l); ctx.moveTo(b.x+8,b.y); ctx.lineTo(b.x+12,b.y+l);
      ctx.moveTo(b.x-3,b.y-6); ctx.lineTo(b.x-5,b.y-10); ctx.moveTo(b.x+3,b.y-6); ctx.lineTo(b.x+5,b.y-10); ctx.stroke(); }
    ctx.fillStyle='#FFCE5C'; for(const s of shots) ctx.fillRect(s.x-1.5,s.y-6,3,10);
    for(const b of bombs) A.text('!',b.x,b.y,13,'#EE7563',700);
    ctx.globalAlpha=inv>0&&Math.floor(t*20)%2?0.3:1;
    ctx.fillStyle='#5FD6C0'; ctx.beginPath(); ctx.moveTo(P.x,P.y-12); ctx.lineTo(P.x+14,P.y+8); ctx.lineTo(P.x-14,P.y+8); ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
    if(msgT>0) A.text(msg,W/2,(top()+H)/2+30,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
