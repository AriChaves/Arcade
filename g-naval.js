/* Batalla naval — contra la computadora */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const N=8, SIZES=[4,3,3,2,2];
let me, ai, cur, turn, aiT, over, msg, msgT, shots, hits, bc, sc, ex, ey, mx, my, flash;

function layout(){
  bc=Math.floor(Math.min((H-46-52)/N,(W*0.66-20)/N,52));
  sc=Math.floor(Math.min(bc,(W-bc*N-44)/N));
  const total=bc*N+30+sc*N;
  ex=Math.round((W-total)/2); ey=Math.round(46+24+(H-46-52-bc*N)/2);
  mx=ex+bc*N+30; my=ey;
}
function board(){
  const ship=new Array(N*N).fill(-1), shot=new Array(N*N).fill(0), ships=[];
  SIZES.forEach((len,si)=>{
    for(;;){ const hz=Math.random()<0.5, r=A.ri(hz?N:N-len+1), c=A.ri(hz?N-len+1:N), cells=[];
      for(let k=0;k<len;k++) cells.push(hz?r*N+c+k:(r+k)*N+c);
      if(cells.every(i=>ship[i]<0)){ cells.forEach(i=>ship[i]=si); ships.push({cells,hit:0,sunk:false}); break; } }
  });
  return {ship,shot,ships};
}
// returns 0 miss, 1 hit, 2 sunk, -1 already shot
function fire(bd,i){
  if(bd.shot[i]) return -1;
  const s=bd.ship[i]; if(s<0){ bd.shot[i]=1; return 0; }
  bd.shot[i]=2; const sh=bd.ships[s]; sh.hit++;
  if(sh.hit===sh.cells.length){ sh.sunk=true; return 2; } return 1;
}
const alive=bd=>bd.ships.filter(s=>!s.sunk).length;
function myShot(i){
  if(over||turn!=='me') return;
  cur=i; const r=fire(ai,i); if(r<0){ msg='ya disparaste ahí'; msgT=0.8; return; }
  shots++; const x=ex+(i%N+.5)*bc, y=ey+((i/N|0)+.5)*bc;
  if(r===0){ msg='agua'; msgT=0.9; }
  else { hits++; A.burst(x,y,'#F09A6B',r===2?18:9); msg=r===2?'¡hundido! ('+ai.ships[ai.ship[i]].cells.length+')':'¡tocado!'; msgT=1.1; if(r===2) A.shake(0.3); }
  if(!alive(ai)){ finish(true); return; }
  turn='ai'; aiT=0.7;
}
function aiPick(){
  const bd=me, open=i=>!bd.shot[i];
  const hot=[]; for(let i=0;i<N*N;i++) if(bd.shot[i]===2&&!bd.ships[bd.ship[i]].sunk) hot.push(i);
  const set=new Set(hot), line=[], near=[];
  for(const h of hot){ const r=h/N|0, c=h%N;
    for(const [dr,dc] of [[0,1],[1,0]]){
      const has=(rr,cc)=>rr>=0&&rr<N&&cc>=0&&cc<N&&set.has(rr*N+cc);
      if(!has(r+dr,c+dc)&&!has(r-dr,c-dc)) continue;
      let a=0; while(has(r-dr*(a+1),c-dc*(a+1))) a++; let b=0; while(has(r+dr*(b+1),c+dc*(b+1))) b++;
      for(const [rr,cc] of [[r-dr*(a+1),c-dc*(a+1)],[r+dr*(b+1),c+dc*(b+1)]]) if(rr>=0&&rr<N&&cc>=0&&cc<N&&open(rr*N+cc)) line.push(rr*N+cc); }
    for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]){ const rr=r+dr, cc=c+dc; if(rr>=0&&rr<N&&cc>=0&&cc<N&&open(rr*N+cc)) near.push(rr*N+cc); } }
  if(line.length) return A.pick(line);
  if(near.length) return A.pick(near);
  const par=[], any=[]; for(let i=0;i<N*N;i++) if(open(i)){ any.push(i); if(((i/N|0)+i%N)%2===0) par.push(i); }
  return A.pick(par.length?par:any);
}
function aiShot(){
  const i=aiPick(), r=fire(me,i), x=mx+(i%N+.5)*sc, y=my+((i/N|0)+.5)*sc; flash={i,t:1};
  if(r===0){ msg='la computadora falló · tu turno'; msgT=1.2; }
  else { A.burst(x,y,'#EE7563',r===2?14:7); A.shake(r===2?0.5:0.25); msg=r===2?'te hundieron un barco':'te dieron · tu turno'; msgT=1.3; }
  if(!alive(me)){ finish(false); return; }
  turn='me';
}
function finish(won){
  over=true; game.overTitle=won?'¡Ganaste la batalla!':'Hundieron tu flota';
  msg=won?'¡flota enemiga hundida!':'perdiste tu flota'; msgT=4;
  const sc2=won?100+(N*N-shots)*15:hits*5;
  later(()=>A.end({score:sc2, rows:[[shots,'disparos'],[hits,'aciertos']]}),1300);
}
function grid(ctx,x0,y0,cs,bd,showShips,isEnemy){
  ctx.fillStyle='rgba(18,36,41,.95)'; A.roundRect(x0-4,y0-4,cs*N+8,cs*N+8,8); ctx.fill();
  for(let i=0;i<N*N;i++){ const x=x0+(i%N)*cs, y=y0+(i/N|0)*cs, s=bd.ship[i], st=bd.shot[i];
    let col='rgba(37,69,77,.55)';
    if(showShips&&s>=0) col=bd.ships[s].sunk?'rgba(238,117,99,.35)':'rgba(126,154,158,.75)';
    if(isEnemy&&st===2&&bd.ships[s].sunk) col='rgba(240,154,107,.35)';
    if(over&&isEnemy&&s>=0&&!st) col='rgba(126,154,158,.35)';
    ctx.fillStyle=col; ctx.fillRect(x+1,y+1,cs-2,cs-2);
    if(st===1){ ctx.fillStyle='rgba(158,216,255,.7)'; ctx.beginPath(); ctx.arc(x+cs/2,y+cs/2,Math.max(1.5,cs*0.12),0,6.283); ctx.fill(); }
    if(st===2){ ctx.strokeStyle=isEnemy?'#F09A6B':'#EE7563'; ctx.lineWidth=Math.max(1.5,cs*0.09); const p=cs*0.25;
      ctx.beginPath(); ctx.moveTo(x+p,y+p); ctx.lineTo(x+cs-p,y+cs-p); ctx.moveTo(x+cs-p,y+p); ctx.lineTo(x+p,y+cs-p); ctx.stroke(); }
  }
}
const game={
  id:'naval', name:'Batalla naval', accent:'#F09A6B',
  desc:'Hunde los 5 barcos de la computadora antes de que ella hunda los tuyos, con pocos disparos.',
  keys:'<kbd>flechas</kbd> apuntar · <kbd>Espacio</kbd> disparar · o toca la casilla del tablero enemigo',
  overTitle:'Batalla terminada', fmt:v=>Math.round(v)+' pts',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='naval'||!ai) return; const r=cv.getBoundingClientRect();
      const c=Math.floor((e.clientX-r.left-ex)/bc), rr=Math.floor((e.clientY-r.top-ey)/bc);
      if(c>=0&&c<N&&rr>=0&&rr<N) myShot(rr*N+c); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); me=board(); ai=board(); cur=27; turn='me'; over=false; shots=0; hits=0; flash=null;
    game.overTitle='Batalla terminada'; msg='dispara al tablero enemigo'; msgT=2; },
  keydown(e){ const k=e.key.toLowerCase(); let r=cur/N|0, c=cur%N;
    if(k==='arrowleft'||k==='a') c=(c+N-1)%N; else if(k==='arrowright'||k==='d') c=(c+1)%N;
    else if(k==='arrowup'||k==='w') r=(r+N-1)%N; else if(k==='arrowdown'||k==='s') r=(r+1)%N;
    else if(k===' '||k==='spacebar'||k==='enter'){ myShot(cur); return; }
    cur=r*N+c; },
  dbg(){ return {enemy:ai.ship.slice(), shot:ai.shot.slice(), ex, ey, bc, turn, cur}; },
  update(dt){ if(msgT>0) msgT-=dt; if(flash){ flash.t-=dt; if(flash.t<=0) flash=null; }
    if(!over&&turn==='ai'){ aiT-=dt; if(aiT<=0) aiShot(); }
    A.hud([turn==='me'&&!over?'tu turno':'computadora', shots+' disparos', 'barcos '+alive(ai)+' vs '+alive(me)]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='left'; ctx.textBaseline='middle';
    const fs=W<500?11:13;
    A.text('Flota enemiga',ex,ey-14,fs,'#F09A6B',700);
    A.text('Tu flota',mx,my-14,fs,'#5FD6C0',700);
    grid(ctx,ex,ey,bc,ai,false,true);
    grid(ctx,mx,my,sc,me,true,false);
    if(flash){ const i=flash.i; ctx.strokeStyle='rgba(238,117,99,'+flash.t+')'; ctx.lineWidth=2; ctx.strokeRect(mx+(i%N)*sc,my+(i/N|0)*sc,sc,sc); }
    if(!over&&turn==='me'){ const x=ex+(cur%N)*bc, y=ey+(cur/N|0)*bc; ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2.5; ctx.strokeRect(x+1.5,y+1.5,bc-3,bc-3); }
    // fleet status under my grid
    let ly=my+sc*N+18; const lh=fs+5;
    me.ships.forEach((s,i)=>{ if(ly>H-24) return; const n=s.cells.length; for(let k=0;k<n;k++){ ctx.fillStyle=s.sunk?'rgba(238,117,99,.6)':'rgba(126,154,158,.8)'; ctx.fillRect(mx+k*(Math.min(10,sc)+2),ly-4,Math.min(10,sc),8); } ly+=lh-4; });
    ctx.textAlign='center';
    if(msgT>0) A.text(msg,W/2,H-12,W<500?11:13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
