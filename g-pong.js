/* Code Review — pong contra el revisor */
(function(){
"use strict";
let A, W, H;
let me, cpu, ball, sMe, sCpu, rally, best, t, over, serveT, msg, msgT;
const top=()=>46, PH=()=>Math.max(54,(H-top())*0.2), WIN=7;
function serve(dir){ ball={x:W/2,y:(top()+H)/2,vx:0,vy:0,dir}; serveT=0.9; rally=0; }
function finish(){ over=true; const won=sMe>sCpu; A.end({score:sMe*100+best*5-sCpu*20+(won?300:0), rows:[[sMe+' – '+sCpu,'marcador'],[best,'mejor rally'],[won?'aprobado':'rechazado','review']]}); }
const game={
  id:'pong', name:'Code Review', accent:'#9ED8FF',
  desc:'Pong contra el revisor. El primero en llegar a 7 gana.',
  keys:'<kbd>↑</kbd><kbd>↓</kbd> o <kbd>W</kbd><kbd>S</kbd> mover tu paleta',
  overTitle:'Review terminado',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; me={y:(top()+H)/2}; cpu={y:(top()+H)/2}; sMe=0; sCpu=0; best=0; t=0; over=false; msg='primero a 7'; msgT=2; serve(1); },
  update(dt){
    if(over) return; t+=dt; if(msgT>0) msgT-=dt;
    const ph=PH(), lo=top()+ph/2+4, hi=H-ph/2-4, sp=(H-top())*1.5;
    let mv=0; if(A.keys['arrowup']||A.keys['w']) mv--; if(A.keys['arrowdown']||A.keys['s']) mv++;
    me.y=A.clamp(me.y+mv*sp*dt,lo,hi);
    const target=ball.vx>0?ball.y:(top()+H)/2, cs=sp*(0.5+Math.min(sMe,6)*0.05);
    cpu.y=A.clamp(cpu.y+A.clamp(target-cpu.y,-cs*dt,cs*dt),lo,hi);
    if(serveT>0){ serveT-=dt; if(serveT<=0){ const s=Math.max(220,W*0.45); const a=A.rnd(-0.5,0.5); ball.vx=Math.cos(a)*s*ball.dir; ball.vy=Math.sin(a)*s; } }
    ball.x+=ball.vx*dt; ball.y+=ball.vy*dt;
    if(ball.y<top()+6){ ball.y=top()+6; ball.vy=Math.abs(ball.vy); }
    if(ball.y>H-6){ ball.y=H-6; ball.vy=-Math.abs(ball.vy); }
    const lx=22, rx=W-22;
    const hit=(px,py,dir)=>{ const off=A.clamp((ball.y-py)/(ph/2),-1,1); const s=Math.min(Math.hypot(ball.vx,ball.vy)*1.06,W*1.4); const a=off*0.9; ball.vx=Math.cos(a)*s*dir; ball.vy=Math.sin(a)*s; ball.x=px+dir*8; rally++; best=Math.max(best,rally); A.burst(ball.x,ball.y,dir>0?'#9ED8FF':'#EE7563',5); };
    if(ball.vx<0 && ball.x<lx+8 && ball.x>lx-8 && Math.abs(ball.y-me.y)<ph/2+6) hit(lx,me.y,1);
    if(ball.vx>0 && ball.x>rx-8 && ball.x<rx+8 && Math.abs(ball.y-cpu.y)<ph/2+6) hit(rx,cpu.y,-1);
    if(ball.x<-20){ sCpu++; A.shake(0.8); msg='punto del revisor'; msgT=1.2; if(sCpu>=WIN) return finish(); serve(-1); }
    if(ball.x>W+20){ sMe++; msg='¡punto tuyo!'; msgT=1.2; if(sMe>=WIN) return finish(); serve(1); }
    A.hud(['tú '+sMe,'revisor '+sCpu,'rally '+rally]);
  },
  draw(){
    const ctx=A.ctx, ph=PH(); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.5)'; ctx.fillRect(0,top(),W,H-top());
    ctx.setLineDash([6,8]); ctx.strokeStyle='rgba(37,69,77,.95)'; ctx.beginPath(); ctx.moveTo(W/2,top()); ctx.lineTo(W/2,H); ctx.stroke(); ctx.setLineDash([]);
    A.text(String(sMe),W/2-40,top()+36,28,'rgba(158,216,255,.35)',700); A.text(String(sCpu),W/2+40,top()+36,28,'rgba(238,117,99,.35)',700);
    ctx.fillStyle='#9ED8FF'; A.roundRect(16,me.y-ph/2,8,ph,4); ctx.fill();
    ctx.fillStyle='#EE7563'; A.roundRect(W-24,cpu.y-ph/2,8,ph,4); ctx.fill();
    ctx.fillStyle='#E9F2EF'; ctx.beginPath(); ctx.arc(ball.x,ball.y,6,0,6.283); ctx.fill();
    if(msgT>0) A.text(msg,W/2,H-16,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
