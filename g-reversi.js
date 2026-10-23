/* Reversi — contra la computadora */
(function(){
"use strict";
let A, W, H;
const N=8, ME=1, AI=2, DIRS=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
let b, turn, over, cell, ox, oy, cr, cc, aiT, msg, msgT, endT, last, flips, legal;
function layout(){ cell=Math.floor(Math.min((W-24)/N,(H-58)/N)); ox=Math.round((W-cell*N)/2); oy=52+Math.round((H-56-cell*N)/2); }
function flipsFor(bd,r,c,p){ if(bd[r][c]) return []; const o=3-p, out=[];
  for(const [dr,dc] of DIRS){ const line=[]; let rr=r+dr, cc2=c+dc;
    while(rr>=0&&rr<N&&cc2>=0&&cc2<N&&bd[rr][cc2]===o){ line.push([rr,cc2]); rr+=dr; cc2+=dc; }
    if(line.length&&rr>=0&&rr<N&&cc2>=0&&cc2<N&&bd[rr][cc2]===p) out.push(...line); }
  return out; }
function moves(p){ const m=[]; for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const f=flipsFor(b,r,c,p); if(f.length) m.push({r,c,f}); } return m; }
function count(p){ let n=0; for(const row of b) for(const v of row) if(v===p) n++; return n; }
function put(m,p){ b[m.r][m.c]=p; for(const [r,c] of m.f) b[r][c]=p; last={r:m.r,c:m.c}; flips=m.f.map(([r,c])=>({r,c,t:0.35}));
  A.burst(ox+(m.c+.5)*cell,oy+(m.r+.5)*cell,p===ME?'#5FD6C0':'#EE7563',6+m.f.length*2); }
function isCorner(r,c){ return (r===0||r===N-1)&&(c===0||c===N-1); }
function aiPick(ms){ let best=null, bs=-1e9;
  for(const m of ms){ let s=m.f.length;
    if(isCorner(m.r,m.c)) s+=100;
    else if(m.r===0||m.r===N-1||m.c===0||m.c===N-1) s+=4;
    /* avoid squares next to an empty corner */
    for(const [kr,kc] of [[0,0],[0,N-1],[N-1,0],[N-1,N-1]]) if(!b[kr][kc]&&Math.abs(m.r-kr)<=1&&Math.abs(m.c-kc)<=1&&!isCorner(m.r,m.c)) s-=25;
    s+=Math.random()*0.9;
    if(s>bs){ bs=s; best=m; } }
  return best; }
function nextTurn(){
  const other=3-turn;
  if(moves(other).length){ turn=other; }
  else if(moves(turn).length){ msg=(other===ME?'no tienes jugadas: pasas':'la computadora pasa'); msgT=1.8; }
  else { finish(); return; }
  legal=turn===ME?moves(ME):[];
  if(turn===AI) aiT=0.6;
}
function finish(){ over=true; legal=[]; const me=count(ME), ai=count(AI);
  const win=me>ai; game.overTitle=win?'¡Ganaste!':me===ai?'Empate':'Ganó la computadora';
  msg=game.overTitle+' · '+me+' a '+ai; msgT=9; endT=1.5; }
function playAt(r,c){ if(over||turn!==ME||aiT>0) return; const m=legal.find(m=>m.r===r&&m.c===c);
  if(!m){ msg='ahí no se puede'; msgT=0.9; return; } put(m,ME); nextTurn(); }
const game={
  id:'reversi', name:'Reversi', accent:'#5FD6C0',
  desc:'Encierra las fichas de la computadora para voltearlas. Gana quien tenga más.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> poner ficha · o toca la casilla marcada',
  overTitle:'Partida terminada', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='reversi'||!b) return; const rc=cv.getBoundingClientRect();
      const c=Math.floor((e.clientX-rc.left-ox)/cell), r=Math.floor((e.clientY-rc.top-oy)/cell);
      if(r>=0&&r<N&&c>=0&&c<N){ cr=r; cc=c; playAt(r,c); } }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); b=Array.from({length:N},()=>new Array(N).fill(0));
    b[3][3]=AI; b[4][4]=AI; b[3][4]=ME; b[4][3]=ME; turn=ME; over=false; aiT=0; endT=0; last=null; flips=[];
    legal=moves(ME); cr=2; cc=3; msg='tú eres verde · empiezas'; msgT=1.6; },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return;
    if(k==='arrowleft'||k==='a') cc=(cc+N-1)%N; else if(k==='arrowright'||k==='d') cc=(cc+1)%N;
    else if(k==='arrowup'||k==='w') cr=(cr+N-1)%N; else if(k==='arrowdown'||k==='s') cr=(cr+1)%N;
    else if(k===' '||k==='spacebar'||k==='enter') playAt(cr,cc); },
  update(dt){ if(msgT>0) msgT-=dt; for(const f of flips) f.t-=dt;
    if(!over&&turn===AI){ aiT-=dt; if(aiT<=0){ aiT=0; const ms=moves(AI); if(ms.length) put(aiPick(ms),AI); nextTurn(); } }
    if(endT>0){ endT-=dt; if(endT<=0){ endT=-1; const me=count(ME), ai=count(AI), bonus=me>ai?20:0;
      A.end({score:me+bonus, rows:[[me,'tus fichas'],[ai,'computadora'],[me>ai?'+20':'0','bono']]}); } }
    A.hud(['tú '+count(ME),'compu '+count(AI), over?'fin':turn===ME?'tu turno':'piensa…']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#1E4A3A'; A.roundRect(ox-5,oy-5,cell*N+10,cell*N+10,8); ctx.fill();
    ctx.strokeStyle='rgba(13,26,30,.55)'; ctx.lineWidth=1;
    for(let i=0;i<=N;i++){ ctx.beginPath(); ctx.moveTo(ox+i*cell,oy); ctx.lineTo(ox+i*cell,oy+N*cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox,oy+i*cell); ctx.lineTo(ox+N*cell,oy+i*cell); ctx.stroke(); }
    if(turn===ME&&!over&&aiT<=0) for(const m of legal){ ctx.fillStyle='rgba(255,206,92,.45)'; ctx.beginPath(); ctx.arc(ox+(m.c+.5)*cell,oy+(m.r+.5)*cell,cell*0.13,0,6.283); ctx.fill(); }
    for(let r=0;r<N;r++) for(let c=0;c<N;c++){ const v=b[r][c]; if(!v) continue;
      const f=flips.find(f=>f.r===r&&f.c===c&&f.t>0), sx=f?Math.abs(Math.cos((1-f.t/0.35)*Math.PI)):1;
      ctx.fillStyle=v===ME?'#5FD6C0':'#EE7563';
      ctx.beginPath(); ctx.ellipse(ox+(c+.5)*cell,oy+(r+.5)*cell,Math.max(1,cell*0.38*sx),cell*0.38,0,0,6.283); ctx.fill(); }
    if(last){ ctx.fillStyle='rgba(13,26,30,.6)'; ctx.beginPath(); ctx.arc(ox+(last.c+.5)*cell,oy+(last.r+.5)*cell,cell*0.08,0,6.283); ctx.fill(); }
    if(!over){ ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2.5; ctx.strokeRect(ox+cc*cell+1.5,oy+cr*cell+1.5,cell-3,cell-3); }
    if(msgT>0){ const a=A.clamp(msgT,0,1), tw=Math.min(W-20,msg.length*8.5+30), y=oy+cell*N/2;
      ctx.globalAlpha=a; ctx.fillStyle='rgba(13,26,30,.85)'; A.roundRect(W/2-tw/2,y-16,tw,32,8); ctx.fill(); ctx.globalAlpha=1;
      A.text(msg,W/2,y,13,'rgba(233,242,239,'+a+')',700); }
  }
};
window.Arcade.register(game);
})();
