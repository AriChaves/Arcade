/* Buscaminas — con cursor de teclado, primer casilla siempre segura */
(function(){
"use strict";
let A, W, H;

const LEVELS=[
  {name:'fácil',   c:9,  r:9,  m:10, base:900},
  {name:'medio',   c:16, r:12, m:34, base:2000},
  {name:'difícil', c:22, r:14, m:76, base:3400}
];
const NUMCOL=['','#5FD6C0','#8FE3D0','#FFCE5C','#F09A6B','#EE7563','#C58BFF','#9ED8FF','#E9F2EF'];

let phase, lv, C, R, M, mine, open, flag, num, cur, t, started, dead, won, msg, msgT, cell, ox, oy, boom;

function layout(){
  if(!C) return;
  cell = Math.floor(Math.min((W-32)/C, (H-88)/R));
  ox = Math.round((W-cell*C)/2);
  oy = 56 + Math.round((H-68-cell*R)/2);
}

function reset(){
  mine=new Array(C*R).fill(false);
  open=new Array(C*R).fill(false);
  flag=new Array(C*R).fill(false);
  num=new Array(C*R).fill(0);
  cur=((R/2)|0)*C+((C/2)|0);
  t=0; started=false; dead=false; won=false; boom=-1;
  msg=lv.name+' · '+M+' minas'; msgT=2.4;
}

function neighbors(i){
  const r=(i/C)|0, c=i%C, out=[];
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    if(!dr&&!dc) continue;
    const nr=r+dr, nc=c+dc;
    if(nr<0||nc<0||nr>=R||nc>=C) continue;
    out.push(nr*C+nc);
  }
  return out;
}

function plant(safe){
  const banned=new Set([safe, ...neighbors(safe)]);
  let placed=0;
  while(placed<M){
    const i=A.ri(C*R);
    if(mine[i]||banned.has(i)) continue;
    mine[i]=true; placed++;
  }
  for(let i=0;i<C*R;i++) num[i]=neighbors(i).filter(j=>mine[j]).length;
  started=true;
}

function reveal(i){
  if(open[i]||flag[i]) return;
  open[i]=true;
  if(mine[i]){
    dead=true; boom=i; A.shake(1.4);
    A.burst(ox+(i%C)*cell+cell/2, oy+(((i/C)|0))*cell+cell/2, '#EE7563', 18);
    for(let k=0;k<C*R;k++) if(mine[k]) open[k]=true;
    A.end({score:0, rows:[['💥'.replace('💥','boom'),''],[countOpen(),'casillas']]});
    return;
  }
  if(num[i]===0) for(const j of neighbors(i)) reveal(j);
}

function countOpen(){ let n=0; for(let i=0;i<C*R;i++) if(open[i]&&!mine[i]) n++; return n; }

function chord(i){
  if(!open[i]||!num[i]) return;
  const nb=neighbors(i);
  if(nb.filter(j=>flag[j]).length!==num[i]) { msg='faltan banderas alrededor'; msgT=1.4; return; }
  for(const j of nb) if(!flag[j]) { reveal(j); if(dead) return; }
  checkWin();
}

function checkWin(){
  if(dead) return;
  for(let i=0;i<C*R;i++) if(!mine[i] && !open[i]) return;
  won=true; phase='won';
  for(let k=0;k<20;k++) A.burst(ox+A.rnd(0,cell*C), oy+A.rnd(0,cell*R), '#5FD6C0', 1);
}

function finish(){
  const score=lv.base;
  A.end({score, rows:[[score,'puntos'],[lv.name,'nivel'],[M,'minas']]});
}
function fmtT(s){ const m=Math.floor(s/60); return m+':'+String(Math.floor(s%60)).padStart(2,'0'); }

const game = {
  id:'mines',
  name:'Buscaminas',
  accent:'#9ED8FF',
  desc:'El de siempre pero con cursor de teclado. La primera casilla nunca es mina.',
  keys:'<kbd>flechas</kbd> moverte · <kbd>Espacio</kbd> destapar · <kbd>F</kbd> bandera · <kbd>C</kbd> abrir alrededor de un número',
  overTitle:'Campo despejado',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; phase='pick'; msg=''; msgT=0; t=0; C=0; },

  keydown(e){
    const k=e.key.toLowerCase();
    if(phase==='pick'){
      const n=parseInt(k,10);
      if(n>=1&&n<=3){ lv=LEVELS[n-1]; C=lv.c; R=lv.r; M=lv.m; layout(); reset(); phase='play'; }
      return;
    }
    if(phase==='won'){ finish(); return; }
    if(phase!=='play'||dead) return;

    if(k==='arrowleft'||k==='a') cur = cur%C ? cur-1 : cur+C-1;
    else if(k==='arrowright'||k==='d') cur = (cur%C)===C-1 ? cur-C+1 : cur+1;
    else if(k==='arrowup'||k==='w') cur = cur<C ? cur+C*(R-1) : cur-C;
    else if(k==='arrowdown'||k==='s') cur = cur>=C*(R-1) ? cur-C*(R-1) : cur+C;
    else if(k===' '||k==='spacebar'||k==='enter'){
      if(!started) plant(cur);
      reveal(cur);
      if(!dead) checkWin();
    }
    else if(k==='f'){ if(!open[cur]) flag[cur]=!flag[cur]; }
    else if(k==='c'){ chord(cur); if(!dead) checkWin(); }
  },

  update(dt){
    if(phase!=='play'&&phase!=='won') return;
    if(phase==='play' && started && !dead) t+=dt;
    if(msgT>0) msgT-=dt;
    let f=0; for(let i=0;i<C*R;i++) if(flag[i]) f++;
    A.hud([(M-f)+' minas', countOpen()+'/'+(C*R-M)+' casillas', lv.name]);
  },

  draw(){
    const ctx=A.ctx;
    ctx.textAlign='center'; ctx.textBaseline='middle';

    if(phase==='pick'){
      A.text('elegí el campo',W/2,H/2-92,12,'#7E9A9E');
      for(let i=0;i<3;i++){
        const l=LEVELS[i], y=H/2-50+i*52;
        ctx.fillStyle='rgba(25,48,54,.95)';
        A.roundRect(W/2-150,y,300,44,8); ctx.fill();
        ctx.strokeStyle='#9ED8FF'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='#9ED8FF';
        A.roundRect(W/2-138,y+11,22,22,5); ctx.fill();
        A.text(String(i+1),W/2-127,y+22.5,13,'#0D1A1E',700);
        ctx.textAlign='left';
        A.text(l.name,W/2-100,y+22,15,'#E9F2EF',700);
        ctx.textAlign='right';
        A.text(l.c+'×'+l.r+' · '+l.m+' minas',W/2+138,y+22,11,'#7E9A9E');
        ctx.textAlign='center';
      }
      A.text('la primera casilla que destapes nunca tiene mina',W/2,H/2+128,11,'#7E9A9E');
      return;
    }

    const cr=(cur/C)|0, cc=cur%C;
    for(let i=0;i<C*R;i++){
      const r=(i/C)|0, c=i%C;
      const x=ox+c*cell, y=oy+r*cell;
      if(open[i]){
        ctx.fillStyle = i===boom ? 'rgba(238,117,99,.55)' : 'rgba(13,26,30,.75)';
        ctx.fillRect(x,y,cell,cell);
        ctx.strokeStyle='rgba(37,69,77,.5)'; ctx.lineWidth=1;
        ctx.strokeRect(x+.5,y+.5,cell-1,cell-1);
        if(mine[i]){
          ctx.fillStyle = i===boom ? '#FFFFFF' : '#EE7563';
          ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,cell*0.2,0,6.283); ctx.fill();
          ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=1.5;
          ctx.beginPath();
          for(let k=0;k<4;k++){
            const a=k*Math.PI/4;
            ctx.moveTo(x+cell/2-Math.cos(a)*cell*0.32, y+cell/2-Math.sin(a)*cell*0.32);
            ctx.lineTo(x+cell/2+Math.cos(a)*cell*0.32, y+cell/2+Math.sin(a)*cell*0.32);
          }
          ctx.stroke();
        } else if(num[i]){
          A.text(String(num[i]), x+cell/2, y+cell/2+1, cell*0.58, NUMCOL[num[i]], 700);
        }
      } else {
        ctx.fillStyle='rgba(33,63,70,.98)';
        A.roundRect(x+1,y+1,cell-2,cell-2,3); ctx.fill();
        ctx.strokeStyle='rgba(37,69,77,.9)'; ctx.lineWidth=1; ctx.stroke();
        if(flag[i]){
          ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=1.6;
          ctx.beginPath();
          ctx.moveTo(x+cell*0.36, y+cell*0.22); ctx.lineTo(x+cell*0.36, y+cell*0.78);
          ctx.stroke();
          ctx.fillStyle='#EE7563';
          ctx.beginPath();
          ctx.moveTo(x+cell*0.36,y+cell*0.22);
          ctx.lineTo(x+cell*0.72,y+cell*0.36);
          ctx.lineTo(x+cell*0.36,y+cell*0.5);
          ctx.closePath(); ctx.fill();
        }
      }
    }

    /* cursor */
    ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2;
    ctx.strokeRect(ox+cc*cell+1, oy+cr*cell+1, cell-2, cell-2);

    if(phase==='won'){
      ctx.fillStyle='rgba(10,20,23,.86)'; ctx.fillRect(0,0,W,H);
      A.text('¡campo despejado!', W/2, H/2-16, 19, '#9ED8FF', 700);
      A.text('cualquier tecla para ver el puntaje', W/2, H/2+16, 12, '#7E9A9E');
      return;
    }
    if(msgT>0) A.text(msg, W/2, Math.min(oy+cell*R+18, H-10), 11.5, 'rgba(233,242,239,'+A.clamp(msgT,0,1)+')');
  }
};

window.Arcade.register(game);
})();
