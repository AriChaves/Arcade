/* Sube y sube — estilo Doodle Jump */
(function(){
"use strict";
let A, W, H;
let P, plats, camY, maxH, t, over, msg, msgT;
const top=()=>46;
function addPlat(y){ const w=Math.max(46,74-maxH/400); const kind=Math.random()<Math.min(0.3,maxH/6000)?'move':(Math.random()<Math.min(0.2,maxH/9000)?'break':'n');
  plats.push({x:A.rnd(4,W-w-4),y,w,kind,vx:kind==='move'?A.rnd(40,90)*(Math.random()<.5?-1:1):0,gone:false}); }
const game={
  id:'jump', name:'Sube y sube', accent:'#6FE0B0',
  desc:'Rebota de plataforma en plataforma lo más alto que puedas.',
  keys:'<kbd>←</kbd><kbd>→</kbd> o <kbd>A</kbd><kbd>D</kbd> para moverte (sales por un lado y entras por el otro)',
  overTitle:'Te caíste', fmt:v=>Math.round(v)+' m',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; P={x:W/2,y:H-60,vy:-520}; plats=[]; camY=0; maxH=0; t=0; over=false; msg='¡arriba!'; msgT=1.4;
    plats.push({x:W/2-40,y:H-30,w:80,kind:'n',vx:0}); for(let y=H-90;y>-200;y-=A.rnd(48,72)) addPlat(y); },
  update(dt){ if(over) return; t+=dt; if(msgT>0) msgT-=dt;
    let mv=0; if(A.keys['arrowleft']||A.keys['a']) mv--; if(A.keys['arrowright']||A.keys['d']) mv++;
    P.x+=mv*Math.max(220,W*0.6)*dt; if(P.x<-10) P.x=W+10; if(P.x>W+10) P.x=-10;
    const g=1300*(H/480); P.vy+=g*dt; const py=P.y; P.y+=P.vy*dt;
    for(const p of plats){ if(p.kind==='move'){ p.x+=p.vx*dt; if(p.x<0||p.x+p.w>W) p.vx*=-1; }
      if(!p.gone&&P.vy>0&&py+10<=p.y&&P.y+10>=p.y&&P.x>p.x-6&&P.x<p.x+p.w+6){
        if(p.kind==='break'){ p.gone=true; A.burst(P.x,p.y,'#F09A6B',6); } else { P.vy=-Math.max(480,H*1.25); P.y=p.y-10; } } }
    const line=top()+(H-top())*0.4;
    if(P.y<line){ const d=line-P.y; P.y=line; camY+=d; for(const p of plats) p.y+=d; maxH=Math.max(maxH,camY/10); }
    plats=plats.filter(p=>p.y<H+20); let hi=Math.min(...plats.map(p=>p.y)); while(hi>top()-60){ hi-=A.rnd(52,Math.min(92,70+maxH/60)); addPlat(hi); }
    if(P.y>H+20){ over=true; A.end({score:Math.round(maxH), rows:[[Math.round(maxH)+' m','subiste'],[Math.floor(t)+'s','en el aire']]}); return; }
    A.hud([Math.round(maxH)+' m']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.45)'; ctx.fillRect(0,top(),W,H-top());
    for(const p of plats){ if(p.gone) continue; ctx.fillStyle=p.kind==='move'?'#9ED8FF':p.kind==='break'?'#F09A6B':'#5FD6C0'; A.roundRect(p.x,p.y,p.w,8,4); ctx.fill(); }
    ctx.fillStyle='#FFCE5C'; A.roundRect(P.x-11,P.y-12,22,22,6); ctx.fill();
    ctx.fillStyle='#0D1A1E'; ctx.beginPath(); ctx.arc(P.x-4,P.y-3,2.4,0,6.283); ctx.arc(P.x+4,P.y-3,2.4,0,6.283); ctx.fill();
    if(msgT>0) A.text(msg,W/2,top()+40,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
