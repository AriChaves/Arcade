/* Garbage Collector — snake con memory leaks */
(function(){
"use strict";
let A, W, H;

const COLS=30, ROWS=15;
let cell, ox, oy;
let snake, dir, pending, food, leaks, leakT, pups, pupT, tick, acc, score, objs, level, longest, dead, msg, msgT;

const KEY=(c,r)=>c+','+r;

function layout(){
  cell = Math.floor(Math.min((W-20)/COLS, (H-58)/ROWS));
  ox = Math.round((W - cell*COLS)/2);
  oy = 46 + Math.round((H - 58 - cell*ROWS)/2);
}

function emptyCell(){
  for(let i=0;i<400;i++){
    const c=A.ri(COLS), r=A.ri(ROWS);
    if(snake.some(s=>s.c===c&&s.r===r)) continue;
    if(leaks.has(KEY(c,r))) continue;
    if(food && food.c===c && food.r===r) continue;
    if(pups.some(p=>p.c===c&&p.r===r)) continue;
    return {c,r};
  }
  return {c:A.ri(COLS), r:A.ri(ROWS)};
}

function reset(){
  snake=[{c:6,r:7},{c:5,r:7},{c:4,r:7}];
  dir={c:1,r:0}; pending=[];
  leaks=new Set(); leakT=9; pups=[]; pupT=13;
  score=0; objs=0; level=1; longest=3; dead=false;
  tick=0.135; acc=0; msg=''; msgT=0;
  food=emptyCell();
}

function grow(n){ for(let i=0;i<n;i++) snake.push(Object.assign({}, snake[snake.length-1])); }

function spreadLeak(){
  if(!leaks.size) return;
  const arr=[...leaks];
  for(let i=0;i<12;i++){
    const [c,r]=A.pick(arr).split(',').map(Number);
    const d=A.pick([[1,0],[-1,0],[0,1],[0,-1]]);
    const nc=c+d[0], nr=r+d[1];
    if(nc<0||nr<0||nc>=COLS||nr>=ROWS) continue;
    const k=KEY(nc,nr);
    if(leaks.has(k)) continue;
    if(snake.some(s=>s.c===nc&&s.r===nr)) continue;
    if(food.c===nc&&food.r===nr) continue;
    leaks.add(k); return;
  }
}

function newLeak(){
  const e=emptyCell();
  const hd=snake[0];
  if(Math.abs(e.c-hd.c)+Math.abs(e.r-hd.r) < 5) return;
  leaks.add(KEY(e.c,e.r));
}

const PUPS = [
  {id:'free',    g:'free()',  col:'#5FD6C0', txt:'free() — heap limpio'},
  {id:'compact', g:'compact', col:'#FFCE5C', txt:'compactaste la memoria'},
  {id:'cycle',   g:'cycle',   col:'#C58BFF', txt:'referencia circular: +puntos, +peso'}
];

function step(){
  if(pending.length) dir = pending.shift();
  const hd = {c:snake[0].c+dir.c, r:snake[0].r+dir.r};

  if(hd.c<0||hd.r<0||hd.c>=COLS||hd.r>=ROWS) return die('te saliste del heap');
  if(leaks.has(KEY(hd.c,hd.r))) return die('chocaste un memory leak');
  for(let i=0;i<snake.length-1;i++) if(snake[i].c===hd.c && snake[i].r===hd.r) return die('referencia circular fatal');

  snake.unshift(hd);

  let ate=false;
  if(hd.c===food.c && hd.r===food.r){
    ate=true; objs++;
    score += 10*level;
    A.burst(ox+hd.c*cell+cell/2, oy+hd.r*cell+cell/2, '#5FD6C0', 5);
    food = emptyCell();
    if(objs % 8 === 0){
      level++;
      tick = Math.max(0.07, 0.135 - level*0.0055);
      newLeak();
      msg='nivel '+level+' — apareció un leak'; msgT=2;
    }
  }

  for(let i=pups.length-1;i>=0;i--){
    const p=pups[i];
    if(p.c===hd.c && p.r===hd.r){
      pups.splice(i,1);
      A.burst(ox+hd.c*cell+cell/2, oy+hd.r*cell+cell/2, p.col, 12);
      msg=p.txt; msgT=2.4;
      if(p.id==='free'){ leaks.clear(); score+=40; }
      if(p.id==='compact'){ const keep=Math.max(3, Math.ceil(snake.length/2)); snake.length=keep; score+=25; }
      if(p.id==='cycle'){ score += 60*level; grow(4); ate=true; }
    }
  }

  if(!ate) snake.pop();
  if(snake.length>longest) longest=snake.length;
}

function die(reason){
  dead=true;
  A.shake(1.2);
  const hd=snake[0];
  A.burst(ox+hd.c*cell+cell/2, oy+hd.r*cell+cell/2, '#EE7563', 20);
  A.end({score, rows:[[score,'puntos'],[objs,'objetos'],[level,'nivel'],[longest,'largo máx']]});
}

const game = {
  id:'gc',
  name:'Garbage Collector',
  accent:'#FFCE5C',
  desc:'Snake en el heap, con memory leaks que se expanden solos.',
  keys:'<kbd>WASD</kbd> o <kbd>flechas</kbd> para girar · agarrá <b>free()</b> para limpiar leaks y <b>compact</b> para achicarte',
  overTitle:'Out of memory',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    let d=null;
    if(k==='a'||k==='arrowleft') d={c:-1,r:0};
    if(k==='d'||k==='arrowright') d={c:1,r:0};
    if(k==='w'||k==='arrowup') d={c:0,r:-1};
    if(k==='s'||k==='arrowdown') d={c:0,r:1};
    if(!d) return;
    const ref = pending.length ? pending[pending.length-1] : dir;
    if(d.c===-ref.c && d.r===-ref.r) return;
    if(d.c===ref.c && d.r===ref.r) return;
    if(pending.length<2) pending.push(d);
  },

  update(dt){
    if(dead) return;
    if(msgT>0) msgT-=dt;

    acc += dt;
    while(acc >= tick){ acc -= tick; step(); if(dead) return; }

    leakT -= dt;
    if(leakT<=0){ leakT = Math.max(3.2, 8 - level*0.35); spreadLeak(); }

    pupT -= dt;
    if(pupT<=0 && pups.length<2){
      pupT = A.rnd(11,17);
      const e=emptyCell(), p=A.pick(PUPS);
      pups.push({c:e.c, r:e.r, id:p.id, g:p.g, col:p.col, txt:p.txt, life:9});
    }
    for(let i=pups.length-1;i>=0;i--){ pups[i].life-=dt; if(pups[i].life<=0) pups.splice(i,1); }

    A.hud([score+' pts','nivel '+level, objs+' objetos','largo '+snake.length,'leaks '+leaks.size]);
  },

  draw(){
    const ctx=A.ctx;
    ctx.textAlign='center'; ctx.textBaseline='middle';

    /* heap */
    ctx.fillStyle='rgba(18,36,41,.75)';
    ctx.fillRect(ox,oy,cell*COLS,cell*ROWS);
    ctx.strokeStyle='rgba(37,69,77,.9)'; ctx.lineWidth=1;
    ctx.strokeRect(ox+.5,oy+.5,cell*COLS-1,cell*ROWS-1);
    ctx.strokeStyle='rgba(37,69,77,.35)';
    ctx.beginPath();
    for(let c=1;c<COLS;c++){ ctx.moveTo(ox+c*cell,oy); ctx.lineTo(ox+c*cell,oy+cell*ROWS); }
    for(let r=1;r<ROWS;r++){ ctx.moveTo(ox,oy+r*cell); ctx.lineTo(ox+cell*COLS,oy+r*cell); }
    ctx.stroke();

    /* leaks */
    for(const k of leaks){
      const [c,r]=k.split(',').map(Number);
      ctx.fillStyle='rgba(197,139,255,.22)';
      ctx.fillRect(ox+c*cell+1, oy+r*cell+1, cell-2, cell-2);
      A.text('▨', ox+c*cell+cell/2, oy+r*cell+cell/2, cell*0.72, 'rgba(197,139,255,.85)');
    }

    /* comida */
    A.text('{}', ox+food.c*cell+cell/2, oy+food.r*cell+cell/2, cell*0.62, '#5FD6C0', 700);

    /* power-ups */
    for(const p of pups){
      const blink = p.life<3 && Math.floor(p.life*6)%2 ? 0.3 : 1;
      ctx.globalAlpha=blink;
      ctx.fillStyle='rgba(13,26,30,.9)';
      A.roundRect(ox+p.c*cell-cell*0.9, oy+p.r*cell+1, cell*2.8, cell-2, 4); ctx.fill();
      ctx.strokeStyle=p.col; ctx.lineWidth=1; ctx.stroke();
      A.text(p.g, ox+p.c*cell+cell/2, oy+p.r*cell+cell/2, Math.min(11,cell*0.52), p.col, 700);
      ctx.globalAlpha=1;
    }

    /* serpiente */
    for(let i=snake.length-1;i>=0;i--){
      const s=snake[i];
      const t = i/Math.max(1,snake.length-1);
      ctx.fillStyle = i===0 ? '#FFCE5C' : 'rgba(95,214,192,'+(0.9-t*0.55)+')';
      A.roundRect(ox+s.c*cell+1.5, oy+s.r*cell+1.5, cell-3, cell-3, 3);
      ctx.fill();
    }
    const hd=snake[0];
    A.text('gc', ox+hd.c*cell+cell/2, oy+hd.r*cell+cell/2, Math.min(10,cell*0.45), '#0D1A1E', 700);

    if(msgT>0){
      ctx.textAlign='center';
      A.text(msg, W/2, oy+cell*ROWS+16, 11.5, 'rgba(233,242,239,'+A.clamp(msgT,0,1)+')');
    }
  }
};

window.Arcade.register(game);
})();
