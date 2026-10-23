/* Ping — vuela entre firewalls (Flappy) */
(function(){
"use strict";
let A, W, H;
let P, walls, score, t, over, spawnT, msg, msgT, started;
const top=()=>46;
function gap(){ return Math.max(92, Math.min(140, (H-top())*0.36) - score*1.2); }
const game={
  id:'flappy', name:'Ping', accent:'#FFCE5C',
  desc:'Un paquete que aletea entre firewalls. Un toque para subir.',
  keys:'<kbd>Espacio</kbd> o <kbd>↑</kbd> para subir',
  overTitle:'Paquete perdido',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; P={x:Math.min(110,W*0.25),y:(top()+H)/2,vy:0}; walls=[]; score=0; t=0; over=false; spawnT=0.4; started=false; msg='toca para despegar'; msgT=99; },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return;
    if(k===' '||k==='spacebar'||k==='arrowup'||k==='w'){ started=true; if(msgT>50) msgT=0.6; P.vy=-Math.max(250,(H-top())*0.78); A.burst(P.x-8,P.y+4,'#FFCE5C',2); } },
  update(dt){
    if(over) return; if(msgT>0) msgT-=dt;
    A.hud([score+' firewalls', Math.floor(t)+'s']);
    if(!started){ P.y=(top()+H)/2+Math.sin(performance.now()/300)*6; return; }
    t+=dt;
    const g=(H-top())*2.6; P.vy+=g*dt; P.y+=P.vy*dt;
    const sp=150+Math.min(score*3,90);
    spawnT-=dt;
    if(spawnT<=0){ spawnT=Math.max(1.15,1.6-score*0.01)*(W/700+0.55); const gp=gap(); const gy=A.rnd(top()+30+gp/2,H-30-gp/2); walls.push({x:W+30,gy,gp,w:44,passed:false}); }
    for(let i=walls.length-1;i>=0;i--){ const w=walls[i]; w.x-=sp*dt;
      if(w.x+w.w<-10){ walls.splice(i,1); continue; }
      if(!w.passed && w.x+w.w<P.x){ w.passed=true; score++; if(score%10===0){ msg=score+' firewalls'; msgT=1.4; } }
      if(P.x+9>w.x && P.x-9<w.x+w.w && (P.y-8<w.gy-w.gp/2 || P.y+8>w.gy+w.gp/2)) return crash();
    }
    if(P.y>H-6||P.y<top()+4) return crash();
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.5)'; ctx.fillRect(0,top(),W,H-top());
    for(const w of walls){
      ctx.fillStyle='rgba(238,117,99,.16)'; ctx.strokeStyle='rgba(238,117,99,.75)'; ctx.lineWidth=1.5;
      const a=w.gy-w.gp/2, b=w.gy+w.gp/2;
      ctx.fillRect(w.x,top(),w.w,a-top()); ctx.strokeRect(w.x+.5,top()-2,w.w-1,a-top()+2);
      ctx.fillRect(w.x,b,w.w,H-b); ctx.strokeRect(w.x+.5,b,w.w-1,H-b+2);
      ctx.save(); ctx.translate(w.x+w.w/2,(top()+a)/2); ctx.rotate(-Math.PI/2); if(a-top()>60) A.text('firewall',0,0,10,'#EE7563',700); ctx.restore();
    }
    const ang=A.clamp(P.vy/600,-0.6,0.9);
    ctx.save(); ctx.translate(P.x,P.y); ctx.rotate(ang);
    ctx.fillStyle='#FFCE5C'; A.roundRect(-11,-8,22,16,4); ctx.fill();
    A.text('{}',0,1,10,'#0D1A1E',700); ctx.restore();
    if(msgT>0) A.text(msg,W/2,top()+30,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
function crash(){ over=true; A.shake(1.3); A.burst(P.x,P.y,'#EE7563',20); A.end({score, rows:[[score,'firewalls'],[Math.floor(t)+'s','en vuelo']]}); }
window.Arcade.register(game);
})();
