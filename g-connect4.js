/* Conecta 4 — contra la computadora */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const CC=7, RR=6, ME=1, AI=2;
let b, col, turn, over, t, msg, msgT, cell, ox, oy, drop, aiT, moves, win;
function layout(){ cell=Math.floor(Math.min((W-24)/CC,(H-96)/RR)); ox=Math.round((W-cell*CC)/2); oy=Math.round(46+cell*0.9+(H-46-cell*0.9-cell*RR)/2); }
function rowFor(c){ for(let r=RR-1;r>=0;r--) if(!b[r][c]) return r; return -1; }
function line4(p){ const D=[[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<RR;r++) for(let c=0;c<CC;c++) if(b[r][c]===p) for(const [dr,dc] of D){ const cs=[[r,c]];
    for(let k=1;k<4;k++){ const rr=r+dr*k, cc=c+dc*k; if(rr<0||rr>=RR||cc<0||cc>=CC||b[rr][cc]!==p) break; cs.push([rr,cc]); } if(cs.length===4) return cs; }
  return null; }
function wins(p,c){ const r=rowFor(c); if(r<0) return false; b[r][c]=p; const w=!!line4(p); b[r][c]=0; return w; }
function aiPick(){
  const ok=[]; for(let c=0;c<CC;c++) if(rowFor(c)>=0) ok.push(c);
  for(const c of ok) if(wins(AI,c)) return c;
  for(const c of ok) if(wins(ME,c)) return c;
  const safe=ok.filter(c=>{ const r=rowFor(c); b[r][c]=AI; const bad=r>0&&wins(ME,c); b[r][c]=0; return !bad; });
  const pool=safe.length?safe:ok;
  pool.sort((x,y)=>Math.abs(x-3)-Math.abs(y-3)+A.rnd(-1.6,1.6));
  return pool[0];
}
function place(c,p){ const r=rowFor(c); if(r<0) return false; drop={c,r,p,y:-1}; return true; }
function settle(){ const {c,r,p}=drop; b[r][c]=p; drop=null; moves++;
  const w=line4(p);
  if(w){ win=w; over=true; const me=p===ME; A.shake(me?0.4:1); A.burst(ox+(c+.5)*cell,oy+(r+.5)*cell,me?'#5FD6C0':'#EE7563',16);
    game.overTitle=me?'¡Ganaste!':'Ganó la computadora'; later(()=>A.end({score:me?Math.max(100,600-moves*10):0, rows:[[me?'ganaste':'perdiste',''],[moves,'fichas']]}),900); return; }
  if(moves===CC*RR){ over=true; game.overTitle='Empate'; later(()=>A.end({score:50, rows:[['empate',''],[moves,'fichas']]}),600); return; }
  turn=p===ME?AI:ME; if(turn===AI) aiT=0.5; }
function play(c){ if(over||turn!==ME||drop) return; if(place(c,ME)) col=c; }
const game={
  id:'connect4', name:'Conecta 4', accent:'#FFCE5C',
  desc:'Contra la computadora: junta cuatro en línea antes que ella.',
  keys:'<kbd>←</kbd><kbd>→</kbd> elegir columna · <kbd>Espacio</kbd> soltar ficha · o toca la columna',
  overTitle:'Partida terminada', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='connect4'||!b) return; const r=cv.getBoundingClientRect(); const c=Math.floor((e.clientX-r.left-ox)/cell); if(c>=0&&c<CC){ col=c; play(c); } }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); b=Array.from({length:RR},()=>new Array(CC).fill(0)); col=3; turn=ME; over=false; t=0; moves=0; drop=null; win=null; msg='tú eres verde · empiezas'; msgT=2; },
  keydown(e){ const k=e.key.toLowerCase();
    if(k==='arrowleft'||k==='a') col=(col+CC-1)%CC; else if(k==='arrowright'||k==='d') col=(col+1)%CC;
    else if(k===' '||k==='spacebar'||k==='enter'||k==='arrowdown'||k==='s') play(col); },
  update(dt){ t+=dt; if(msgT>0) msgT-=dt;
    if(drop){ drop.y+=dt*14; if(drop.y>=drop.r) settle(); }
    else if(!over&&turn===AI){ aiT-=dt; if(aiT<=0) place(aiPick(),AI); }
    A.hud([turn===ME&&!over?'tu turno':'computadora', moves+' fichas']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    if(turn===ME&&!over&&!drop){ ctx.fillStyle='rgba(95,214,192,.85)'; ctx.beginPath(); ctx.arc(ox+(col+.5)*cell,oy-cell*0.55,cell*0.36,0,6.283); ctx.fill(); }
    ctx.fillStyle='rgba(25,48,54,1)'; A.roundRect(ox-6,oy-6,cell*CC+12,cell*RR+12,10); ctx.fill();
    const disc=(r,c,p,a)=>{ ctx.globalAlpha=a||1; ctx.fillStyle=p===ME?'#5FD6C0':p===AI?'#EE7563':'#0D1A1E'; ctx.beginPath(); ctx.arc(ox+(c+.5)*cell,oy+(r+.5)*cell,cell*0.38,0,6.283); ctx.fill(); ctx.globalAlpha=1; };
    for(let r=0;r<RR;r++) for(let c=0;c<CC;c++) disc(r,c,b[r][c]);
    if(drop) disc(drop.y,drop.c,drop.p);
    if(win){ ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=3; for(const [r,c] of win){ ctx.beginPath(); ctx.arc(ox+(c+.5)*cell,oy+(r+.5)*cell,cell*0.4,0,6.283); ctx.stroke(); } }
    if(msgT>0) A.text(msg,W/2,H-10,11.5,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
