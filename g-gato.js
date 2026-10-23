/* Gato — tres en línea contra la computadora */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
let b, cur, over, aiT, msg, msgT, cell, ox, oy, line, wins, losses, draws, round;
const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function layout(){ cell=Math.floor(Math.min((W-40)/3,(H-80)/3)); ox=Math.round((W-cell*3)/2); oy=50+Math.round((H-56-cell*3)/2); }
function winner(s){ for(const l of L) if(s[l[0]]&&s[l[0]]===s[l[1]]&&s[l[0]]===s[l[2]]) return l; return null; }
function mm(s,p){ const w=winner(s); if(w) return s[w[0]]==='O'?1:-1; if(s.every(x=>x)) return 0;
  let best=p==='O'?-2:2; for(let i=0;i<9;i++) if(!s[i]){ s[i]=p; const v=mm(s,p==='O'?'X':'O'); s[i]=''; best=p==='O'?Math.max(best,v):Math.min(best,v); } return best; }
function aiMove(){ const free=[]; for(let i=0;i<9;i++) if(!b[i]) free.push(i);
  if(Math.random()<0.22) return A.pick(free);
  let bi=free[0], bv=-2; for(const i of free){ b[i]='O'; const v=mm(b,'X'); b[i]=''; if(v>bv||(v===bv&&Math.random()<0.4)){ bv=v; bi=i; } } return bi; }
function check(){ const w=winner(b);
  if(w||b.every(x=>x)){ line=w; const res=w?(b[w[0]]==='X'?'win':'lose'):'draw';
    if(res==='win') wins++; else if(res==='lose') losses++; else draws++;
    msg=res==='win'?'¡ganaste esta!':res==='lose'?'ganó la computadora':'empate'; msgT=1.4;
    if(losses>=3){ over=true; game.overTitle='Ganó la computadora 3 veces'; later(()=>A.end({score:wins*100+draws*30, rows:[[wins,'ganadas'],[draws,'empates'],[losses,'perdidas']]}),900); }
    else later(()=>{ if(!over) next(); },1200);
    return true; } return false; }
function next(){ round++; b=new Array(9).fill(''); line=null; aiT=round%2===0?0.5:-1; }
function mark(i){ if(over||line||aiT>0||b[i]||b.every(x=>x)) return; b[i]='X'; if(!check()) aiT=0.45; }
const game={
  id:'gato', name:'Gato', accent:'#9ED8FF',
  desc:'Tres en línea contra la computadora. Juegas hasta perder 3 veces.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> marcar · o toca la casilla',
  overTitle:'Se acabaron las vidas', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='gato'||!b) return; const r=cv.getBoundingClientRect(); const c=Math.floor((e.clientX-r.left-ox)/cell), rr=Math.floor((e.clientY-r.top-oy)/cell); if(c>=0&&c<3&&rr>=0&&rr<3){ cur=rr*3+c; mark(cur); } }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); wins=0; losses=0; draws=0; round=0; over=false; cur=4; msg='tú eres X'; msgT=1.6; next(); },
  keydown(e){ const k=e.key.toLowerCase(); let r=cur/3|0, c=cur%3;
    if(k==='arrowleft'||k==='a') c=(c+2)%3; else if(k==='arrowright'||k==='d') c=(c+1)%3;
    else if(k==='arrowup'||k==='w') r=(r+2)%3; else if(k==='arrowdown'||k==='s') r=(r+1)%3;
    else if(k===' '||k==='spacebar'||k==='enter'){ mark(cur); return; }
    cur=r*3+c; },
  update(dt){ if(msgT>0) msgT-=dt;
    if(aiT>0&&!line){ aiT-=dt; if(aiT<=0){ aiT=-1; b[aiMove()]='O'; check(); } }
    A.hud(['ganadas '+wins,'empates '+draws,'vidas '+'●'.repeat(Math.max(0,3-losses))]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.strokeStyle='rgba(37,69,77,1)'; ctx.lineWidth=3; ctx.lineCap='round';
    for(let i=1;i<3;i++){ ctx.beginPath(); ctx.moveTo(ox+i*cell,oy+8); ctx.lineTo(ox+i*cell,oy+cell*3-8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox+8,oy+i*cell); ctx.lineTo(ox+cell*3-8,oy+i*cell); ctx.stroke(); }
    for(let i=0;i<9;i++){ const x=ox+(i%3+.5)*cell, y=oy+((i/3|0)+.5)*cell, s=cell*0.26;
      if(i===cur&&!line){ ctx.fillStyle='rgba(255,206,92,.1)'; A.roundRect(x-cell/2+6,y-cell/2+6,cell-12,cell-12,8); ctx.fill(); }
      ctx.lineWidth=Math.max(4,cell*0.07);
      if(b[i]==='X'){ ctx.strokeStyle='#5FD6C0'; ctx.beginPath(); ctx.moveTo(x-s,y-s); ctx.lineTo(x+s,y+s); ctx.moveTo(x+s,y-s); ctx.lineTo(x-s,y+s); ctx.stroke(); }
      if(b[i]==='O'){ ctx.strokeStyle='#EE7563'; ctx.beginPath(); ctx.arc(x,y,s,0,6.283); ctx.stroke(); } }
    if(line){ const p=i=>[ox+(i%3+.5)*cell, oy+((i/3|0)+.5)*cell]; const [a,c]=[p(line[0]),p(line[2])]; ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(c[0],c[1]); ctx.stroke(); }
    if(msgT>0) A.text(msg,W/2,H-10,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
