/* Come-bugs — laberinto estilo Pac-Man */
(function(){
"use strict";
let A, W, H;
const MAP=[
'###############',
'#o.....#.....o#',
'#.###.###.###.#',
'#.............#',
'#.##.#####.##.#',
'#....#   #....#',
'####.# G #.####',
'#......P......#',
'#.##.#####.##.#',
'#o...........o#',
'###############'];
const RC=MAP.length, CC=MAP[0].length, GCOL=['#EE7563','#C58BFF','#F09A6B'];
let grid, P, ghosts, dots, score, lives, level, scared, t, over, cell, ox, oy, msg, msgT, startT;
function layout(){ cell=Math.floor(Math.min((W-10)/CC,(H-52)/RC)); ox=Math.round((W-cell*CC)/2); oy=48+Math.round((H-50-cell*RC)/2); }
const wall=(c,r)=>r<0||r>=RC||c<0||c>=CC||grid[r][c]==='#';
const D={l:[-1,0],r:[1,0],u:[0,-1],d:[0,1]};
function buildLevel(){ grid=MAP.map(r=>r.split('')); dots=0; ghosts=[];
  for(let r=0;r<RC;r++) for(let c=0;c<CC;c++){ const ch=grid[r][c];
    if(ch==='.'||ch==='o') dots++; if(ch==='P'){ grid[r][c]=' '; } if(ch==='G'){ grid[r][c]=' '; } }
  placeActors(); }
function placeActors(){ P={c:7,r:7,x:7,y:7,dir:'l',want:'l'}; ghosts=[0,1,2].slice(0,Math.min(3,1+level)).map(i=>({c:6+i,r:5,x:6+i,y:5,dir:'u',col:GCOL[i],eaten:0})); scared=0; startT=1.2; }
function step(o,sp,dt,chooser){
  const tx=o.c+D[o.dir][0], ty=o.r+D[o.dir][1];
  if(Math.abs(o.x-o.c)<0.001&&Math.abs(o.y-o.r)<0.001){ chooser(o); }
  const nx=o.c+D[o.dir][0], ny=o.r+D[o.dir][1];
  if(wall(nx,ny)){ o.x=o.c; o.y=o.r; return; }
  const dx=nx-o.x, dy=ny-o.y, d=Math.hypot(dx,dy), mv=sp*dt;
  if(mv>=d){ o.c=nx; o.r=ny; o.x=nx; o.y=ny; } else { o.x+=dx/d*mv; o.y+=dy/d*mv; } }
function pChoose(o){ const w=D[o.want]; if(!wall(o.c+w[0],o.r+w[1])) o.dir=o.want; const ch=grid[o.r][o.c];
  if(ch==='.'){ grid[o.r][o.c]=' '; score+=10; dots--; } else if(ch==='o'){ grid[o.r][o.c]=' '; score+=50; dots--; scared=7; ghosts.forEach(g=>g.eaten=0); }
  if(dots<=0){ level++; score+=300; msg='¡nivel '+level+'!'; msgT=1.6; buildLevel(); } }
function gChoose(g){ const opts=Object.keys(D).filter(k=>{ const v=D[k]; return !wall(g.c+v[0],g.r+v[1]) && !(D[k][0]===-D[g.dir][0]&&D[k][1]===-D[g.dir][1]); });
  const all=opts.length?opts:Object.keys(D).filter(k=>!wall(g.c+D[k][0],g.r+D[k][1]));
  if(Math.random()<0.25+(scared>0?0.5:0)){ g.dir=A.pick(all); return; }
  all.sort((a,b)=>{ const da=Math.hypot(g.c+D[a][0]-P.c,g.r+D[a][1]-P.r), db=Math.hypot(g.c+D[b][0]-P.c,g.r+D[b][1]-P.r); return scared>0?db-da:da-db; }); g.dir=all[0]; }
const game={
  id:'pacman', name:'Come-bugs', accent:'#FFCE5C',
  desc:'Cómete todos los puntos del laberinto sin que te atrapen los bugs.',
  keys:'<kbd>flechas</kbd> o <kbd>WASD</kbd> para moverte · las bolas grandes asustan a los bugs',
  overTitle:'Te atraparon',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); score=0; lives=3; level=1; t=0; over=false; msg='¡a comer!'; msgT=1.4; buildLevel(); },
  keydown(e){ const k=e.key.toLowerCase(), m={arrowleft:'l',a:'l',arrowright:'r',d:'r',arrowup:'u',w:'u',arrowdown:'d',s:'d'}; if(m[k]) P.want=m[k]; },
  update(dt){ if(over) return; t+=dt; if(msgT>0) msgT-=dt; A.hud([score+' pts','nivel '+level,'vidas '+'●'.repeat(Math.max(0,lives))]); if(startT>0){ startT-=dt; return; }
    scared=Math.max(0,scared-dt);
    step(P,5.2,dt,pChoose);
    for(const g of ghosts){ if(g.dead){ g.dead-=dt; if(g.dead<=0){ g.dead=0; g.c=7; g.r=5; g.x=7; g.y=5; } continue; } step(g,scared>0?2.6:3.4+level*0.25,dt,gChoose);
      if(Math.hypot(g.x-P.x,g.y-P.y)<0.6){
        if(scared>0){ g.eaten++; score+=200; A.burst(ox+(g.x+.5)*cell,oy+(g.y+.5)*cell,'#5FD6C0',10); g.dead=2; g.x=g.c=-5; }
        else { lives--; A.shake(1.2); if(lives<=0){ over=true; A.end({score, rows:[[score,'puntos'],[level,'nivel']]}); return; } msg='¡te atraparon! quedan '+lives; msgT=1.5; placeActors(); return; } } }
    A.hud([score+' pts','nivel '+level,'vidas '+'●'.repeat(Math.max(0,lives))]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let r=0;r<RC;r++) for(let c=0;c<CC;c++){ const ch=grid[r][c], x=ox+c*cell, y=oy+r*cell;
      if(ch==='#'){ ctx.fillStyle='rgba(37,69,77,.9)'; A.roundRect(x+1,y+1,cell-2,cell-2,4); ctx.fill(); }
      else if(ch==='.'){ ctx.fillStyle='#E9F2EF'; ctx.fillRect(x+cell/2-1.5,y+cell/2-1.5,3,3); }
      else if(ch==='o'){ ctx.fillStyle='#5FD6C0'; ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,cell*0.22,0,6.283); ctx.fill(); } }
    for(const g of ghosts){ if(g.dead) continue; const x=ox+(g.x+.5)*cell, y=oy+(g.y+.5)*cell, r=cell*0.4;
      ctx.fillStyle=scared>0?(scared<2&&Math.floor(t*8)%2?'#E9F2EF':'#5B7CFA'):g.col; ctx.beginPath(); ctx.ellipse(x,y,r,r*0.8,0,0,6.283); ctx.fill();
      ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x-r*0.4,y-r*0.6); ctx.lineTo(x-r*0.6,y-r); ctx.moveTo(x+r*0.4,y-r*0.6); ctx.lineTo(x+r*0.6,y-r); ctx.stroke();
      ctx.fillStyle='#0D1A1E'; ctx.beginPath(); ctx.arc(x-r*0.3,y-r*0.1,r*0.15,0,6.283); ctx.arc(x+r*0.3,y-r*0.1,r*0.15,0,6.283); ctx.fill(); }
    const x=ox+(P.x+.5)*cell, y=oy+(P.y+.5)*cell, mo=0.25+0.25*Math.abs(Math.sin(t*12)), ang={r:0,d:Math.PI/2,l:Math.PI,u:-Math.PI/2}[P.dir];
    ctx.fillStyle='#FFCE5C'; ctx.beginPath(); ctx.moveTo(x,y); ctx.arc(x,y,cell*0.42,ang+mo,ang-mo+6.283); ctx.closePath(); ctx.fill();
    if(msgT>0) A.text(msg,W/2,oy+cell*5.5,13,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
