/* 2048 — fusionar bloques de memoria */
(function(){
"use strict";
let A, W, H;
const N=4;

const SKIN=[
  {v:2,    bg:'rgba(37,69,77,.9)',   fg:'#E9F2EF'},
  {v:4,    bg:'rgba(50,90,96,.95)',  fg:'#E9F2EF'},
  {v:8,    bg:'rgba(95,214,192,.28)',fg:'#5FD6C0'},
  {v:16,   bg:'rgba(95,214,192,.45)',fg:'#CFF7EC'},
  {v:32,   bg:'rgba(143,227,208,.6)',fg:'#0D1A1E'},
  {v:64,   bg:'rgba(255,206,92,.42)',fg:'#FFE3A0'},
  {v:128,  bg:'rgba(255,206,92,.62)',fg:'#0D1A1E'},
  {v:256,  bg:'rgba(240,154,107,.7)',fg:'#0D1A1E'},
  {v:512,  bg:'rgba(238,117,99,.75)',fg:'#FFF3EF'},
  {v:1024, bg:'rgba(197,139,255,.7)',fg:'#150D1E'},
  {v:2048, bg:'rgba(197,139,255,.95)',fg:'#150D1E'},
  {v:4096, bg:'rgba(158,216,255,.9)',fg:'#0D1A1E'}
];
function skin(v){
  for(let i=SKIN.length-1;i>=0;i--) if(v>=SKIN[i].v) return SKIN[i];
  return SKIN[0];
}

let g, score, best2, moves, t, over, won, msg, msgT, cell, ox, oy, pops;

function layout(){
  cell = Math.floor(Math.min((W-40)/N, (H-92)/N));
  ox = Math.round((W-cell*N)/2);
  oy = 58 + Math.round((H-70-cell*N)/2);
}

function reset(){
  g=new Array(N*N).fill(0);
  pops=new Array(N*N).fill(0);
  score=0; moves=0; t=0; over=false; won=false;
  msg='juntá iguales y se fusionan'; msgT=2.4;
  spawn(); spawn();
}

function spawn(){
  const free=[];
  for(let i=0;i<N*N;i++) if(!g[i]) free.push(i);
  if(!free.length) return;
  const i=A.pick(free);
  g[i]=Math.random()<0.9?2:4;
  pops[i]=1;
}

function line(idx){
  /* idx: array de posiciones en el orden de movimiento */
  const vals=idx.map(i=>g[i]).filter(v=>v);
  const out=[];
  for(let i=0;i<vals.length;i++){
    if(i+1<vals.length && vals[i]===vals[i+1]){
      out.push({v:vals[i]*2, merged:true});
      i++;
    } else out.push({v:vals[i], merged:false});
  }
  let changed=false;
  for(let k=0;k<idx.length;k++){
    const cellv = k<out.length ? out[k].v : 0;
    if(g[idx[k]]!==cellv) changed=true;
    if(k<out.length && out[k].merged){
      score += out[k].v;
      pops[idx[k]]=1;
      if(out[k].v>=2048 && !won){ won=true; msg='2048 · seguí si querés'; msgT=3; }
    }
    g[idx[k]]=cellv;
  }
  return changed;
}

function move(dir){
  if(over) return;
  let changed=false;
  for(let k=0;k<N;k++){
    const idx=[];
    for(let j=0;j<N;j++){
      if(dir==='l') idx.push(k*N+j);
      if(dir==='r') idx.push(k*N+(N-1-j));
      if(dir==='u') idx.push(j*N+k);
      if(dir==='d') idx.push((N-1-j)*N+k);
    }
    if(line(idx)) changed=true;
  }
  if(!changed) return;
  moves++;
  spawn();
  if(!canMove()){
    over=true;
    A.shake(1);
    A.end({score, rows:[[score,'puntos'],[Math.max(...g),'bloque máximo'],[moves,'movidas']]});
  }
}

function canMove(){
  for(let i=0;i<N*N;i++){
    if(!g[i]) return true;
    const r=(i/N)|0, c=i%N;
    if(c<N-1 && g[i]===g[i+1]) return true;
    if(r<N-1 && g[i]===g[i+N]) return true;
  }
  return false;
}

const game = {
  id:'p2048',
  name:'2048',
  accent:'#C58BFF',
  desc:'Deslizá y fusioná: dos iguales hacen el siguiente. Clásico, con las flechas.',
  keys:'<kbd>flechas</kbd> o <kbd>WASD</kbd> para deslizar todo el tablero · <kbd>R</kbd> empezar de nuevo',
  overTitle:'Sin movidas posibles',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    if(k==='arrowleft'||k==='a') move('l');
    else if(k==='arrowright'||k==='d') move('r');
    else if(k==='arrowup'||k==='w') move('u');
    else if(k==='arrowdown'||k==='s') move('d');
    else if(k==='r'){ reset(); msg='de nuevo'; msgT=1.4; }
  },

  update(dt){
    if(over) return;
    t+=dt;
    if(msgT>0) msgT-=dt;
    for(let i=0;i<N*N;i++) if(pops[i]>0) pops[i]=Math.max(0,pops[i]-dt*5);
    A.hud([score+' pts', moves+' movidas', 'máx '+Math.max(...g)]);
  },

  draw(){
    const ctx=A.ctx;
    ctx.textAlign='center'; ctx.textBaseline='middle';

    ctx.fillStyle='rgba(18,36,41,.85)';
    A.roundRect(ox-8,oy-8,cell*N+16,cell*N+16,10); ctx.fill();
    ctx.strokeStyle='rgba(37,69,77,.95)'; ctx.lineWidth=1; ctx.stroke();

    for(let i=0;i<N*N;i++){
      const r=(i/N)|0, c=i%N;
      const x=ox+c*cell, y=oy+r*cell;
      ctx.fillStyle='rgba(13,26,30,.55)';
      A.roundRect(x+4,y+4,cell-8,cell-8,7); ctx.fill();
      const v=g[i];
      if(!v) continue;
      const s=skin(v);
      const pop=pops[i]>0 ? 1+pops[i]*0.12 : 1;
      const w=(cell-8)*pop, h=(cell-8)*pop;
      ctx.fillStyle=s.bg;
      A.roundRect(x+cell/2-w/2, y+cell/2-h/2, w, h, 7); ctx.fill();
      const digits=String(v).length;
      A.text(String(v), x+cell/2, y+cell/2+1, Math.min(cell*0.42, cell*1.15/digits), s.fg, 700);
    }

    if(msgT>0) A.text(msg, W/2, Math.min(oy+cell*N+22, H-10), 11.5, 'rgba(233,242,239,'+A.clamp(msgT,0,1)+')');
  }
};

window.Arcade.register(game);
})();
