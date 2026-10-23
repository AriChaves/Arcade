/* Pipeline — defensa por carriles */
(function(){
"use strict";
let A, W, H;

const COLS=7, ROWS=4;
const TOWERS = [
  {id:'lint',  name:'lint',  cost:20, rate:2.6, dmg:5,  range:0.95, col:'#5FD6C0', desc:'rápido'},
  {id:'test',  name:'test',  cost:38, rate:1.1, dmg:9,  range:1.25, col:'#FFCE5C', splash:36, desc:'salpica'},
  {id:'type',  name:'type',  cost:58, rate:0.75,dmg:17, range:3.0,  col:'#C58BFF', beam:true, desc:'atraviesa'},
  {id:'cache', name:'cache', cost:26, rate:0,   dmg:0,  range:1.1,  col:'#7E9A9E', slow:0.5, desc:'frena'}
];
const EN = {
  nul:  {g:'null',      hp:22,  sp:34, bounty:6,  col:'#EE7563', size:13},
  und:  {g:'undefined', hp:42,  sp:29, bounty:10, col:'#F09A6B', size:12},
  nan:  {g:'NaN',       hp:28,  sp:54, bounty:9,  col:'#F2C14E', size:13},
  semi: {g:';',         hp:14,  sp:66, bounty:4,  col:'#8FE3D0', size:17},
  tank: {g:'<<<<<<<',   hp:150, sp:21, bounty:24, col:'#C58BFF', size:12}
};

let cells, enemies, shots, beams, creds, uptime, wave, phase, calmT, queue, qT, cur, score, msg, msgT;
let gx, gy, cw, ch;

function layout(){
  gx = 42; gy = 48;
  const gw = W-gx-12, gh = H - gy - 34;
  cw = gw/COLS; ch = gh/ROWS;
}
function cx(c){ return gx + c*cw + cw/2; }
function cy(r){ return gy + r*ch + ch/2; }

function reset(){
  cells = new Array(COLS*ROWS).fill(null);
  enemies=[]; shots=[]; beams=[];
  creds=70; uptime=5; wave=0; score=0;
  phase='calm'; calmT=5; queue=[]; qT=0;
  cur={c:1,r:1}; msg='primera oleada en camino'; msgT=3;
}

function genWave(n){
  const q=[]; const count = 4 + n*2;
  let at = 0;
  for(let i=0;i<count;i++){
    const r=Math.random(); let t;
    if(n>=5 && r<0.10) t=EN.tank;
    else if(n>=3 && r<0.32) t=EN.nan;
    else if(n>=4 && r<0.46) t=EN.semi;
    else if(n>=2 && r<0.62) t=EN.und;
    else t=EN.nul;
    q.push({t, at, row:A.ri(ROWS)});
    at += Math.max(0.3, 0.85 - n*0.025);
  }
  if(n%4===0){
    for(let i=0;i<2+Math.floor(n/4);i++) q.push({t:EN.tank, at: at+0.8+i*1.1, row:A.ri(ROWS)});
  }
  return q;
}

function startWave(){
  wave++; phase='run'; queue=genWave(wave); qT=0;
  msg='oleada '+wave; msgT=1.6;
}

function place(i){
  const t = TOWERS[i];
  const k = cur.r*COLS + cur.c;
  const existing = cells[k];
  if(existing){
    if(existing.t !== t){ msg='esa celda ya tiene '+existing.t.name; msgT=1.6; return; }
    const up = Math.round(t.cost * (existing.lv+1) * 0.8);
    if(creds < up){ msg='faltan '+(up-creds)+' créditos'; msgT=1.6; return; }
    creds -= up; existing.lv++;
    msg = t.name+' nivel '+existing.lv; msgT=1.4;
    return;
  }
  if(creds < t.cost){ msg='faltan '+(t.cost-creds)+' créditos'; msgT=1.6; return; }
  creds -= t.cost;
  cells[k] = {t, lv:1, cd:0, x:cx(cur.c), y:cy(cur.r)};
}

function removeTower(){
  const k = cur.r*COLS + cur.c;
  const tw = cells[k];
  if(!tw) return;
  let spent = tw.t.cost;
  for(let l=1;l<tw.lv;l++) spent += Math.round(tw.t.cost*(l+1)*0.8);
  creds += Math.round(spent*0.5);
  cells[k]=null;
  msg='quitaste '+tw.t.name; msgT=1.4;
}

function hurt(e, d){
  e.hp -= d; e.fx = 1;
  if(e.hp<=0 && !e.dead){
    e.dead = true;
    creds += e.t.bounty;
    score += e.t.bounty;
    A.burst(e.x, e.y, e.t.col, 6);
  }
}

const game = {
  id:'pipeline',
  name:'Pipeline',
  accent:'#5FD6C0',
  desc:'Defensa por carriles: linters, tests y type checks con presupuesto.',
  keys:'<kbd>WASD</kbd>/<kbd>flechas</kbd> mover cursor · <kbd>1</kbd>–<kbd>4</kbd> construir o mejorar · <kbd>x</kbd> quitar · <kbd>Enter</kbd> llamar la oleada ya',
  overTitle:'Producción caída',
  fmt: v=>Math.round(v)+' pts',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; layout(); if(cells) for(let i=0;i<cells.length;i++){ const t=cells[i]; if(t){ t.x=cx(i%COLS); t.y=cy(Math.floor(i/COLS)); } } },
  start(){ W=A.W; H=A.H; layout(); reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    if(k==='a'||k==='arrowleft') cur.c=Math.max(0,cur.c-1);
    if(k==='d'||k==='arrowright') cur.c=Math.min(COLS-1,cur.c+1);
    if(k==='w'||k==='arrowup') cur.r=Math.max(0,cur.r-1);
    if(k==='s'||k==='arrowdown') cur.r=Math.min(ROWS-1,cur.r+1);
    if(k>='1'&&k<='4') place(+k-1);
    if(k==='x') removeTower();
    if(k==='enter' && phase==='calm'){
      const bonus = Math.round(calmT*4);
      creds += bonus; msg='+'+bonus+' créditos por apurarte'; msgT=1.8;
      calmT = 0;
    }
  },

  update(dt){
    if(msgT>0) msgT-=dt;

    if(phase==='calm'){
      calmT -= dt;
      if(calmT<=0) startWave();
    } else {
      qT += dt;
      while(queue.length && queue[0].at <= qT){
        const s = queue.shift();
        const scale = 1 + wave*0.16;
        enemies.push({t:s.t, x:gx-30, y:cy(s.row), row:s.row, hp:s.t.hp*scale, max:s.t.hp*scale, slow:0, fx:0, dead:false});
      }
      if(!queue.length && !enemies.length){
        phase='calm'; calmT=6;
        const r = 22 + wave*6;
        creds += r; score += 30 + wave*10;
        msg='oleada '+wave+' contenida · +'+r+' créditos'; msgT=2.4;
      }
    }

    /* torres */
    for(let i=0;i<cells.length;i++){
      const tw=cells[i]; if(!tw) continue;
      const T=tw.t;
      if(T.slow) continue;
      tw.cd -= dt;
      if(tw.cd>0) continue;
      const range = T.range*cw;
      let target=null, bx=-1;
      for(const e of enemies){
        if(e.dead) continue;
        if(T.beam){
          if(e.row!==Math.floor(i/COLS)) continue;
          if(e.x < tw.x-10 || e.x > tw.x+range) continue;
        } else if(A.dist(e,tw) > range) continue;
        if(e.x > bx){ bx=e.x; target=e; }
      }
      if(!target) continue;
      tw.cd = 1/(T.rate*(1+ (tw.lv-1)*0.35));
      const dmg = T.dmg * tw.lv;
      if(T.beam){
        beams.push({x1:tw.x, y:tw.y, x2:tw.x+range, life:0.14});
        for(const e of enemies){
          if(e.dead || e.row!==Math.floor(i/COLS)) continue;
          if(e.x>=tw.x-10 && e.x<=tw.x+range) hurt(e, dmg);
        }
      } else {
        shots.push({x:tw.x, y:tw.y, tgt:target, dmg, splash:T.splash||0, col:T.col});
      }
    }

    /* cache: frena */
    for(const e of enemies) e.slow = 0;
    for(let i=0;i<cells.length;i++){
      const tw=cells[i]; if(!tw || !tw.t.slow) continue;
      const range = tw.t.range*cw;
      for(const e of enemies) if(A.dist(e,tw) < range) e.slow = Math.max(e.slow, tw.t.slow*(1+(tw.lv-1)*0.18));
    }

    /* disparos */
    for(let i=shots.length-1;i>=0;i--){
      const s=shots[i];
      if(s.tgt.dead){ shots.splice(i,1); continue; }
      const d=A.dist(s,s.tgt)||1;
      const step=520*dt;
      if(d<=step+4){
        hurt(s.tgt, s.dmg);
        if(s.splash) for(const e of enemies){ if(e!==s.tgt && !e.dead && A.dist(e,s.tgt)<s.splash) hurt(e, s.dmg*0.55); }
        shots.splice(i,1);
      } else {
        s.x += (s.tgt.x-s.x)/d*step;
        s.y += (s.tgt.y-s.y)/d*step;
      }
    }
    for(let i=beams.length-1;i>=0;i--){ beams[i].life-=dt; if(beams[i].life<=0) beams.splice(i,1); }

    /* enemigos */
    for(let i=enemies.length-1;i>=0;i--){
      const e=enemies[i];
      e.fx=Math.max(0,e.fx-dt*4);
      if(e.dead){ enemies.splice(i,1); continue; }
      e.x += e.t.sp*(1-Math.min(e.slow,0.75))*dt;
      if(e.x > gx + cw*COLS + 14){
        enemies.splice(i,1);
        uptime--; A.shake(1); A.burst(gx+cw*COLS, e.y, '#EE7563', 12);
        msg='se escapó un '+e.t.g.trim(); msgT=2;
        if(uptime<=0){
          A.end({score, rows:[[score,'puntos'],[wave,'oleadas'],[Math.round(creds),'créditos']]});
          return;
        }
      }
    }

    A.hud([
      'oleada '+wave+(phase==='calm'?' · en '+Math.ceil(calmT)+'s':''),
      creds+' créditos',
      'uptime '+'▮'.repeat(Math.max(0,uptime)),
      score+' pts'
    ]);
  },

  draw(){
    const ctx=A.ctx;
    ctx.textBaseline='middle'; ctx.textAlign='center';

    /* carriles */
    for(let r=0;r<ROWS;r++){
      ctx.fillStyle = r%2 ? 'rgba(25,48,54,.5)' : 'rgba(18,36,41,.6)';
      ctx.fillRect(gx, gy+r*ch, cw*COLS, ch);
    }
    ctx.strokeStyle='rgba(37,69,77,.8)'; ctx.lineWidth=1;
    ctx.beginPath();
    for(let c=0;c<=COLS;c++){ ctx.moveTo(gx+c*cw, gy); ctx.lineTo(gx+c*cw, gy+ch*ROWS); }
    for(let r=0;r<=ROWS;r++){ ctx.moveTo(gx, gy+r*ch); ctx.lineTo(gx+cw*COLS, gy+r*ch); }
    ctx.stroke();

    /* entrada */
    ctx.save();
    ctx.translate(gx-20, gy+ch*ROWS/2); ctx.rotate(-Math.PI/2);
    A.text('git push', 0, 0, 10, 'rgba(126,154,158,.8)', 700);
    ctx.restore();

    /* borde de producción */
    ctx.strokeStyle='rgba(238,117,99,.75)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(gx+cw*COLS+2, gy); ctx.lineTo(gx+cw*COLS+2, gy+ch*ROWS); ctx.stroke();
    ctx.save();
    ctx.translate(gx+cw*COLS+14, gy+ch*ROWS/2); ctx.rotate(Math.PI/2);
    A.text('PRODUCCIÓN', 0, 0, 10, 'rgba(238,117,99,.9)', 700);
    ctx.restore();

    /* cursor */
    const curTower = cells[cur.r*COLS+cur.c];
    ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2;
    ctx.strokeRect(gx+cur.c*cw+2, gy+cur.r*ch+2, cw-4, ch-4);
    if(curTower){
      ctx.beginPath();
      ctx.arc(curTower.x, curTower.y, curTower.t.range*cw, 0, 6.283);
      ctx.strokeStyle='rgba(255,206,92,.25)'; ctx.lineWidth=1; ctx.stroke();
    }

    /* torres */
    for(let i=0;i<cells.length;i++){
      const tw=cells[i]; if(!tw) continue;
      ctx.fillStyle='rgba(13,26,30,.85)';
      A.roundRect(tw.x-cw*0.34, tw.y-ch*0.3, cw*0.68, ch*0.6, 5); ctx.fill();
      ctx.strokeStyle=tw.t.col; ctx.lineWidth=1.5; ctx.stroke();
      A.text(tw.t.name, tw.x, tw.y-3, Math.min(11, cw*0.19), tw.t.col, 700);
      A.text('lv'+tw.lv, tw.x, tw.y+10, 9, 'rgba(126,154,158,.9)');
    }

    /* beams */
    for(const b of beams){
      ctx.strokeStyle='rgba(197,139,255,'+(b.life/0.14*0.8)+')';
      ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(b.x1,b.y); ctx.lineTo(b.x2,b.y); ctx.stroke();
    }

    /* enemigos */
    for(const e of enemies){
      A.text(e.t.g, e.x, e.y, e.t.size, e.fx>0?'#FFFFFF':e.t.col, 500);
      const wpx = Math.min(44, cw*0.7);
      ctx.fillStyle='rgba(13,26,30,.8)';
      ctx.fillRect(e.x-wpx/2, e.y-15, wpx, 3);
      ctx.fillStyle=e.t.col;
      ctx.fillRect(e.x-wpx/2, e.y-15, wpx*A.clamp(e.hp/e.max,0,1), 3);
    }

    /* disparos */
    for(const s of shots){ ctx.fillStyle=s.col; ctx.beginPath(); ctx.arc(s.x,s.y,3,0,6.283); ctx.fill(); }

    /* barra de torres */
    const by = gy+ch*ROWS+18;
    let tx = gx;
    for(let i=0;i<TOWERS.length;i++){
      const T=TOWERS[i];
      const label = (i+1)+' '+T.name+' '+T.cost;
      ctx.textAlign='left';
      A.text(label, tx, by, 11, creds>=T.cost?T.col:'rgba(126,154,158,.55)', 500);
      ctx.font='500 11px "JetBrains Mono", monospace';
      tx += ctx.measureText(label).width + 16;
    }
    if(msgT>0){
      ctx.textAlign='right';
      A.text(msg, W-10, by, 11, 'rgba(233,242,239,'+A.clamp(msgT,0,1)+')');
    }
  }
};

window.Arcade.register(game);
})();
