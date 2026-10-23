/* Stack Overflow — piezas que caen (Tetris) */
(function(){
"use strict";
let A, W, H;
const CW=10, CH=20;
const SHAPES={
  I:[[0,1],[1,1],[2,1],[3,1]], O:[[1,0],[2,0],[1,1],[2,1]], T:[[1,0],[0,1],[1,1],[2,1]],
  S:[[1,0],[2,0],[0,1],[1,1]], Z:[[0,0],[1,0],[1,1],[2,1]], J:[[0,0],[0,1],[1,1],[2,1]], L:[[2,0],[0,1],[1,1],[2,1]]
};
const COLS={I:'#5FD6C0',O:'#FFCE5C',T:'#C58BFF',S:'#6FE0B0',Z:'#EE7563',J:'#9ED8FF',L:'#F09A6B'};
let grid, cur, next, bag, score, lines, level, fallT, t, over, cell, ox, oy, msg, msgT, flash;

function layout(){
  cell=Math.max(10,Math.floor((H-58)/CH));
  ox=Math.round(W/2-cell*CW/2); oy=50;
}
function newBag(){ const k=Object.keys(SHAPES); for(let i=k.length-1;i>0;i--){const j=A.ri(i+1);[k[i],k[j]]=[k[j],k[i]]} return k; }
function take(){ if(!bag.length) bag=newBag(); const k=bag.pop(); return {k, b:SHAPES[k].map(p=>p.slice()), x:3, y:-1}; }
function cells(p,dx,dy,b){ return (b||p.b).map(([x,y])=>[p.x+x+(dx||0),p.y+y+(dy||0)]); }
function fits(p,dx,dy,b){ return cells(p,dx,dy,b).every(([x,y])=>x>=0&&x<CW&&y<CH&&(y<0||!grid[y][x])); }
function rotate(){
  if(cur.k==='O') return;
  const n=cur.k==='I'?4:3;
  const b=cur.b.map(([x,y])=>[n-1-y,x]);
  for(const kick of [0,-1,1,-2,2]) if(fits(cur,kick,0,b)){ cur.b=b; cur.x+=kick; return; }
}
function lock(){
  for(const [x,y] of cells(cur)){ if(y<0){ end(); return; } grid[y][x]=cur.k; }
  let cleared=0;
  for(let y=CH-1;y>=0;y--){
    if(grid[y].every(v=>v)){ grid.splice(y,1); grid.unshift(new Array(CW).fill(0)); cleared++; y++; }
  }
  if(cleared){
    score+=[0,100,300,500,800][cleared]*level; lines+=cleared; flash=1;
    A.burst(W/2,oy+cell*CH-cell*2,'#5FD6C0',cleared*8);
    const lv=1+Math.floor(lines/10); if(lv>level){ level=lv; msg='nivel '+level+' · más rápido'; msgT=2; }
    else { msg=cleared===4?'¡cuatro líneas!':cleared+(cleared>1?' líneas':' línea'); msgT=1.4; }
  }
  cur=next; next=take();
  if(!fits(cur,0,0)) end();
}
function end(){ if(over) return; over=true; A.shake(1.2); A.end({score, rows:[[score,'puntos'],[lines,'líneas'],[level,'nivel']]}); }
function drop(){ if(fits(cur,0,1)) cur.y++; else lock(); }

const game={
  id:'tetris', name:'Stack Overflow', accent:'#5FD6C0',
  desc:'Piezas que caen: completa líneas antes de que la pila llegue arriba.',
  keys:'<kbd>←</kbd><kbd>→</kbd> mover · <kbd>↑</kbd> girar · <kbd>↓</kbd> bajar rápido · <kbd>Espacio</kbd> soltar de golpe',
  overTitle:'La pila se desbordó',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); grid=Array.from({length:CH},()=>new Array(CW).fill(0)); bag=[]; cur=take(); next=take();
    score=0; lines=0; level=1; fallT=0; t=0; over=false; flash=0; msg='completa filas para borrarlas'; msgT=2.2; },
  keydown(e){
    if(over) return; const k=e.key.toLowerCase();
    if(k==='arrowleft'||k==='a'){ if(fits(cur,-1,0)) cur.x--; }
    else if(k==='arrowright'||k==='d'){ if(fits(cur,1,0)) cur.x++; }
    else if(k==='arrowup'||k==='w'||k==='x') rotate();
    else if(k==='arrowdown'||k==='s'){ drop(); score+=1; fallT=0; }
    else if(k===' '||k==='spacebar'){ let n=0; while(fits(cur,0,1)){ cur.y++; n++; } score+=n*2; lock(); fallT=0; A.shake(0.4); }
  },
  update(dt){
    if(over) return; t+=dt; if(msgT>0) msgT-=dt; flash=Math.max(0,flash-dt*3);
    fallT+=dt; const sp=Math.max(0.07,0.8-(level-1)*0.07);
    if(fallT>=sp){ fallT=0; drop(); }
    A.hud([score+' pts', lines+' líneas', 'nivel '+level]);
  },
  draw(){
    const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.85)'; ctx.fillRect(ox-3,oy-3,cell*CW+6,cell*CH+6);
    ctx.strokeStyle=flash>0?'rgba(95,214,192,'+(0.4+flash*0.6)+')':'rgba(37,69,77,.95)'; ctx.lineWidth=1.5; ctx.strokeRect(ox-3.5,oy-3.5,cell*CW+7,cell*CH+7);
    const sq=(x,y,c,a)=>{ if(y<0) return; ctx.globalAlpha=a||1; ctx.fillStyle=c; A.roundRect(ox+x*cell+1,oy+y*cell+1,cell-2,cell-2,Math.min(3,cell/5)); ctx.fill(); ctx.globalAlpha=1; };
    for(let y=0;y<CH;y++) for(let x=0;x<CW;x++){ if(grid[y][x]) sq(x,y,COLS[grid[y][x]]); else { ctx.fillStyle='rgba(13,26,30,.5)'; ctx.fillRect(ox+x*cell+cell/2-1,oy+y*cell+cell/2-1,2,2); } }
    if(!over){
      let g=0; while(fits(cur,0,g+1)) g++;
      for(const [x,y] of cells(cur,0,g)) sq(x,y,COLS[cur.k],0.18);
      for(const [x,y] of cells(cur)) sq(x,y,COLS[cur.k]);
    }
    /* siguiente */
    const nx=ox+cell*CW+14, room=W-nx;
    if(room>cell*3){ const c2=Math.min(cell,14);
      A.text('sigue',nx+c2*2,oy+8,10,'#7E9A9E',500);
      for(const [x,y] of next.b){ ctx.fillStyle=COLS[next.k]; A.roundRect(nx+x*c2,oy+22+y*c2,c2-2,c2-2,2); ctx.fill(); } }
    if(msgT>0) A.text(msg,W/2,oy+cell*CH/2,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};
window.Arcade.register(game);
})();
