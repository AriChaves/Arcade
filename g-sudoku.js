/* Sudoku — generador propio con solución única, notas y pistas */
(function(){
"use strict";
let A, W, H;

const DIFFS = [
  {name:'fácil',   rm:38, base:1000},
  {name:'medio',   rm:46, base:1700},
  {name:'difícil', rm:50, base:2600}
];

let sidePanel, phase, genShown, diff, given, grid, sol, notes, cur, t, hints, errs, msg, msgT, noteMode, conflicts, cell, ox, oy, doneT;

const bi = i => 3*((i/27)|0) + (((i%9)/3)|0);

function countSolutions(src, limit){
  const g = src.slice();
  const rows=new Int32Array(9), cols=new Int32Array(9), box=new Int32Array(9);
  for(let i=0;i<81;i++){
    const v=g[i];
    if(v){ const b=1<<v; rows[(i/9)|0]|=b; cols[i%9]|=b; box[bi(i)]|=b; }
  }
  let count=0;
  (function rec(){
    if(count>=limit) return;
    let best=-1, bestUsed=0, bestCnt=10;
    for(let i=0;i<81;i++){
      if(g[i]) continue;
      const used = rows[(i/9)|0] | cols[i%9] | box[bi(i)];
      let cnt=0;
      for(let v=1;v<=9;v++) if(!(used&(1<<v))) cnt++;
      if(cnt<bestCnt){ bestCnt=cnt; best=i; bestUsed=used; if(!cnt) break; }
    }
    if(best===-1){ count++; return; }
    if(!bestCnt) return;
    const r=(best/9)|0, c=best%9, b=bi(best);
    for(let v=1;v<=9;v++){
      const bit=1<<v;
      if(bestUsed&bit) continue;
      g[best]=v; rows[r]|=bit; cols[c]|=bit; box[b]|=bit;
      rec();
      g[best]=0; rows[r]&=~bit; cols[c]&=~bit; box[b]&=~bit;
      if(count>=limit) return;
    }
  })();
  return count;
}

function fullGrid(){
  const g=new Int8Array(81);
  const rows=new Int32Array(9), cols=new Int32Array(9), box=new Int32Array(9);
  (function rec(i){
    if(i===81) return true;
    const r=(i/9)|0, c=i%9, b=bi(i);
    const used=rows[r]|cols[c]|box[b];
    const vals=[1,2,3,4,5,6,7,8,9];
    for(let k=vals.length-1;k>0;k--){ const j=A.ri(k+1); const tmp=vals[k]; vals[k]=vals[j]; vals[j]=tmp; }
    for(const v of vals){
      const bit=1<<v;
      if(used&bit) continue;
      g[i]=v; rows[r]|=bit; cols[c]|=bit; box[b]|=bit;
      if(rec(i+1)) return true;
      g[i]=0; rows[r]&=~bit; cols[c]&=~bit; box[b]&=~bit;
    }
    return false;
  })(0);
  return g;
}

function generate(d){
  sol = fullGrid();
  const p = Int8Array.from(sol);
  const order=[...Array(81).keys()];
  for(let k=order.length-1;k>0;k--){ const j=A.ri(k+1); const tmp=order[k]; order[k]=order[j]; order[j]=tmp; }
  let removed=0;
  for(const i of order){
    if(removed>=d.rm) break;
    const bak=p[i];
    p[i]=0;
    if(countSolutions(p,2)!==1) p[i]=bak;
    else removed++;
  }
  given = Array.from(p, v=>v!==0);
  grid  = Array.from(p);
  notes = Array.from({length:81}, ()=>new Set());
}

function layout(){
  sidePanel = W >= 580;
  const reserve = sidePanel ? 108 : 0;
  const availH = H - 74 - (sidePanel ? 0 : 40);
  cell = Math.floor(Math.min((W - 32 - reserve)/9, availH/9));
  ox = Math.round((W - cell*9 - reserve)/2);
  oy = 52 + Math.round((H - 62 - (sidePanel?0:38) - cell*9)/2);
}

/* cuántas veces está puesto cada número */
function tally(){
  const n=[0,0,0,0,0,0,0,0,0,0];
  for(let i=0;i<81;i++) if(grid[i]) n[grid[i]]++;
  return n;
}

function drawCounter(){
  const ctx=A.ctx, n=tally();
  const cv = grid[cur];
  if(sidePanel){
    const x = ox + cell*9 + 20, w = 84, h = Math.min(cell, 44), gap = (cell*9 - h*9)/8;
    for(let v=1;v<=9;v++){
      const y = oy + (v-1)*(h+gap);
      const full = n[v]>=9;
      ctx.fillStyle = full ? 'rgba(143,227,208,.9)' : (v===cv ? 'rgba(255,206,92,.16)' : 'rgba(25,48,54,.9)');
      A.roundRect(x, y, w, h, 6); ctx.fill();
      ctx.strokeStyle = full ? '#8FE3D0' : 'rgba(37,69,77,.95)';
      ctx.lineWidth = 1; ctx.stroke();
      ctx.textAlign='left';
      A.text(String(v), x+13, y+h/2+1, Math.min(h*0.5,20), full?'#0D1A1E':'#E9F2EF', 700);
      ctx.textAlign='right';
      A.text(full ? 'listo' : 'faltan '+(9-n[v]), x+w-10, y+h/2+1, 9.5, full?'rgba(13,26,30,.75)':'#7E9A9E');
      if(full){
        ctx.strokeStyle='rgba(13,26,30,.55)'; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(x+9,y+h/2); ctx.lineTo(x+26,y+h/2); ctx.stroke();
      }
      ctx.textAlign='center';
    }
  } else {
    const w = (cell*9)/9, y = oy + cell*9 + 6, h = 30;
    for(let v=1;v<=9;v++){
      const x = ox + (v-1)*w;
      const full = n[v]>=9;
      ctx.fillStyle = full ? 'rgba(143,227,208,.9)' : (v===cv ? 'rgba(255,206,92,.16)' : 'rgba(25,48,54,.9)');
      A.roundRect(x+1.5, y, w-3, h, 5); ctx.fill();
      ctx.strokeStyle = full ? '#8FE3D0' : 'rgba(37,69,77,.95)';
      ctx.lineWidth=1; ctx.stroke();
      A.text(String(v), x+w/2, y+12, 13, full?'#0D1A1E':'#E9F2EF', 700);
      A.text(full?'listo':String(9-n[v]), x+w/2, y+23, 8.5, full?'rgba(13,26,30,.75)':'#7E9A9E');
    }
  }
}

function findConflicts(){
  const bad=new Set();
  for(let i=0;i<81;i++){
    const v=grid[i]; if(!v) continue;
    const r=(i/9)|0, c=i%9, b=bi(i);
    for(let j=0;j<81;j++){
      if(j===i || grid[j]!==v) continue;
      if(((j/9)|0)===r || j%9===c || bi(j)===b){ bad.add(i); bad.add(j); }
    }
  }
  conflicts=bad;
}

function place(v){
  const i=cur;
  if(given[i]) { msg='esa la trajo el tablero'; msgT=1.4; return; }
  if(noteMode && v){
    if(grid[i]) grid[i]=0;
    if(notes[i].has(v)) notes[i].delete(v); else notes[i].add(v);
    return;
  }
  if(grid[i]===v){ grid[i]=0; }
  else {
    grid[i]=v;
    notes[i].clear();
    if(v){
      const r=(i/9)|0, c=i%9, b=bi(i);
      for(let j=0;j<81;j++) if(((j/9)|0)===r||j%9===c||bi(j)===b) notes[j].delete(v);
      if(sol[i]!==v) errs++;
    }
  }
  findConflicts();
  checkDone();
}

function hint(){
  const empty=[];
  for(let i=0;i<81;i++) if(!grid[i]||grid[i]!==sol[i]) empty.push(i);
  if(!empty.length) return;
  const i = (!grid[cur]||grid[cur]!==sol[cur]) ? cur : A.pick(empty);
  grid[i]=sol[i]; notes[i].clear(); hints++;
  A.burst(ox+(i%9)*cell+cell/2, oy+((i/9)|0)*cell+cell/2, '#8FE3D0', 8);
  msg='pista usada ('+hints+')'; msgT=1.6;
  findConflicts();
  checkDone();
}

function checkDone(){
  for(let i=0;i<81;i++) if(grid[i]!==sol[i]) return;
  phase='done'; doneT=0;
  A.shake(0.5);
  for(let k=0;k<26;k++) A.burst(ox+A.rnd(0,cell*9), oy+A.rnd(0,cell*9), '#8FE3D0', 1);
}

function finish(){
  const score=Math.max(120, Math.round(diff.base - hints*90 - errs*25));
  A.end({score, rows:[
    [score,'puntos'],
    [diff.name,'nivel'],
    [hints,'pistas'],
    [errs,'errores']
  ]});
}
function fmtT(s){ const m=Math.floor(s/60); return m+':'+String(Math.floor(s%60)).padStart(2,'0'); }

const game = {
  id:'sudoku',
  name:'Sudoku',
  accent:'#8FE3D0',
  desc:'Generado al momento, con solución única y contador de números que ya cerraste.',
  keys:'<kbd>flechas</kbd> moverte · <kbd>1</kbd>–<kbd>9</kbd> escribir · <kbd>0</kbd> borrar · <kbd>N</kbd> notas · <kbd>H</kbd> pista',
  overTitle:'Sudoku resuelto',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); phase='pick'; msg=''; msgT=0; t=0; },

  keydown(e){
    const k=e.key.toLowerCase();

    if(phase==='pick'){
      const n=parseInt(k,10);
      if(n>=1 && n<=3){
        diff=DIFFS[n-1];
        phase='gen'; genShown=false;
      }
      return;
    }
    if(phase==='done'){ finish(); return; }
    if(phase!=='play') return;

    if(k==='arrowleft'||k==='a') cur = cur%9 ? cur-1 : cur+8;
    else if(k==='arrowright'||k==='d') cur = (cur%9)===8 ? cur-8 : cur+1;
    else if(k==='arrowup'||k==='w') cur = cur<9 ? cur+72 : cur-9;
    else if(k==='arrowdown'||k==='s') cur = cur>71 ? cur-72 : cur+9;
    else if(k>='1'&&k<='9') place(+k);
    else if(k==='0'||k==='backspace'||k==='delete'){ grid[cur]=given[cur]?grid[cur]:0; notes[cur].clear(); findConflicts(); }
    else if(k==='n'){ noteMode=!noteMode; msg=noteMode?'modo notas':'modo normal'; msgT=1.4; }
    else if(k==='h') hint();
  },

  update(dt){
    if(phase==='gen'){
      if(!genShown){ genShown=true; return; }
      generate(diff);
      cur=0; while(cur<80 && given[cur]) cur++;
      t=0; hints=0; errs=0; noteMode=false;
      conflicts=new Set();
      phase='play';
      msg=diff.name+' · a jugar'; msgT=2;
      return;
    }
    if(phase==='done'){ doneT+=dt; return; }
    if(phase!=='play') return;
    t+=dt;
    if(msgT>0) msgT-=dt;
    let filled=0;
    for(let i=0;i<81;i++) if(grid[i]) filled++;
    A.hud([diff.name, filled+'/81', noteMode?'NOTAS':'normal', hints+' pistas']);
  },

  draw(){
    const ctx=A.ctx;
    ctx.textAlign='center'; ctx.textBaseline='middle';

    if(phase==='pick'){
      A.text('elegí dificultad',W/2,H/2-92,12,'#7E9A9E');
      for(let i=0;i<3;i++){
        const d=DIFFS[i], y=H/2-50+i*52;
        ctx.fillStyle='rgba(25,48,54,.95)';
        A.roundRect(W/2-150,y,300,44,8); ctx.fill();
        ctx.strokeStyle='#8FE3D0'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='#8FE3D0';
        A.roundRect(W/2-138,y+11,22,22,5); ctx.fill();
        A.text(String(i+1),W/2-127,y+22.5,13,'#0D1A1E',700);
        ctx.textAlign='left';
        A.text(d.name,W/2-100,y+22,15,'#E9F2EF',700);
        ctx.textAlign='right';
        A.text((81-d.rm)+' números dados',W/2+138,y+22,11,'#7E9A9E');
        ctx.textAlign='center';
      }
      A.text('se genera uno nuevo cada vez, siempre con una sola solución',W/2,H/2+128,11,'#7E9A9E');
      return;
    }
    if(phase==='gen'){
      A.text('generando tablero…',W/2,H/2,14,'#8FE3D0',700);
      return;
    }

    const cr=(cur/9)|0, cc=cur%9, cb=bi(cur), cv=grid[cur];

    /* celdas */
    for(let i=0;i<81;i++){
      const r=(i/9)|0, c=i%9;
      const x=ox+c*cell, y=oy+r*cell;
      const peer = r===cr||c===cc||bi(i)===cb;
      const same = cv && grid[i]===cv;
      ctx.fillStyle = i===cur ? 'rgba(255,206,92,.22)'
        : same ? 'rgba(143,227,208,.16)'
        : peer ? 'rgba(37,69,77,.45)'
        : 'rgba(18,36,41,.85)';
      ctx.fillRect(x,y,cell,cell);
    }

    /* líneas */
    ctx.strokeStyle='rgba(37,69,77,.9)'; ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0;i<=9;i++){
      ctx.moveTo(ox+i*cell,oy); ctx.lineTo(ox+i*cell,oy+cell*9);
      ctx.moveTo(ox,oy+i*cell); ctx.lineTo(ox+cell*9,oy+i*cell);
    }
    ctx.stroke();
    ctx.strokeStyle='rgba(143,227,208,.65)'; ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<=9;i+=3){
      ctx.moveTo(ox+i*cell,oy); ctx.lineTo(ox+i*cell,oy+cell*9);
      ctx.moveTo(ox,oy+i*cell); ctx.lineTo(ox+cell*9,oy+i*cell);
    }
    ctx.stroke();

    /* cursor */
    ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2;
    ctx.strokeRect(ox+cc*cell+1, oy+cr*cell+1, cell-2, cell-2);

    /* números */
    for(let i=0;i<81;i++){
      const r=(i/9)|0, c=i%9;
      const x=ox+c*cell+cell/2, y=oy+r*cell+cell/2;
      const v=grid[i];
      if(v){
        const col = conflicts.has(i) ? '#EE7563' : given[i] ? '#E9F2EF' : '#8FE3D0';
        A.text(String(v), x, y+1, cell*0.56, col, given[i]?700:500);
      } else if(notes[i].size){
        for(const n of notes[i]){
          const nx=x+((n-1)%3-1)*cell*0.29, ny=y+(((n-1)/3|0)-1)*cell*0.29;
          A.text(String(n), nx, ny, cell*0.2, 'rgba(126,154,158,.9)');
        }
      }
    }

    if(phase==='done'){
      ctx.fillStyle='rgba(10,20,23,.86)';
      ctx.fillRect(0,0,W,H);
      A.text('¡sudoku resuelto!', W/2, H/2-16, 20, '#8FE3D0', 700);
      A.text('cualquier tecla para ver el puntaje', W/2, H/2+16, 12, '#7E9A9E');
      return;
    }
    drawCounter();
    if(msgT>0 && sidePanel) A.text(msg, ox+cell*4.5, Math.min(oy+cell*9+14, H-10), 11.5, 'rgba(233,242,239,'+A.clamp(msgT,0,1)+')');
  }
};

window.Arcade.register(game);
})();
