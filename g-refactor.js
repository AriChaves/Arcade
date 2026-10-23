/* Refactor — romper código legacy a pelotazos */
(function(){
"use strict";
let A, W, H;
let pad, balls, bricks, pups, lasers, lives, score, level, t, dead, msg, msgT, wide, slowT, laserT, laserCd, launched;

const TOUGH=/^(var|jQuery|callback|global|goto|eval|except|any|<\?php|GOTO)$/;
const FILES=[
  {name:'legacy/utils.js', rows:[
    ['var','self','=','this',';'],
    ['jQuery','(','document',')','.ready','(','fn',')'],
    ['if','(','x','==','null',')','return','false'],
    ['callback','(','err',',','data',')']
  ]},
  {name:'api/handler.py', rows:[
    ['def','handle','(','req',')',':'],
    ['global','CACHE',',','CONN'],
    ['try',':','parse','(','req.body',')'],
    ['except',':','pass']
  ]},
  {name:'old/index.php', rows:[
    ['<?php','echo','$row','[','"name"',']',';'],
    ['while','(','$r','=','fetch','(',')',')'],
    ['include','(','"header.php"',')'],
    ['eval','(','$input',')']
  ]},
  {name:'build/config.js', rows:[
    ['module','.exports','=','{'],
    ['minify',':','false',',','sourcemap',':','true'],
    ['plugins',':','[','legacy','(',')',']'],
    ['}',';','// no tocar']
  ]}
];
const PUPS=[
  {id:'wide', g:'prettier', col:'#5FD6C0', txt:'paleta más ancha'},
  {id:'multi',g:'fork',     col:'#FFCE5C', txt:'tres pelotas'},
  {id:'slow', g:'debounce', col:'#9ED8FF', txt:'pelota más lenta'},
  {id:'laser',g:'// commit',col:'#C58BFF', txt:'comentá el código: Espacio dispara'}
];

const top=()=>46;
const padY=()=>H-26;

function build(){
  const f=FILES[level%FILES.length];
  bricks=[];
  const x0=14, x1=W-14, y0=top()+14, rh=Math.min(24,(H*0.34)/FILES[0].rows.length), gap=5;
  f.rows.forEach((row,ri)=>{
    const chars=row.reduce((s,tk)=>s+Math.max(2,tk.length),0);
    const unit=(x1-x0-gap*(row.length-1))/chars;
    let x=x0;
    for(const tk of row){
      const w=Math.max(2,tk.length)*unit;
      bricks.push({x,y:y0+ri*(rh+gap),w,h:rh,txt:tk,hp:TOUGH.test(tk)?2:1,fx:0});
      x+=w+gap;
    }
  });
  msg=f.name; msgT=2.6;
}

function reset(){
  level=0; lives=3; score=0; t=0; dead=false;
  pad={x:0,w:92}; pups=[]; lasers=[];
  wide=0; slowT=0; laserT=0; laserCd=0;
  build();
  resetBall();
}
function resetBall(){
  pad.x=W/2-pad.w/2;
  balls=[{x:W/2,y:padY()-12,vx:0,vy:0}];
  launched=false;
}
function speed(){ return (298+level*22)*(slowT>0?0.72:1); }

function launch(){
  if(launched) return;
  launched=true;
  const s=speed(), a=-Math.PI/2+A.rnd(-0.5,0.5);
  balls[0].vx=Math.cos(a)*s; balls[0].vy=Math.sin(a)*s;
}

function drop(x,y){
  if(Math.random()>0.16) return;
  const p=A.pick(PUPS);
  pups.push({x,y,id:p.id,g:p.g,col:p.col,txt:p.txt});
}

function loseLife(){
  lives--;
  A.shake(1.2);
  if(lives<=0){
    dead=true;
    A.end({score, rows:[[score,'puntos'],[level,'archivos'],[bricks.length,'sin refactorizar']]});
    return;
  }
  wide=0; slowT=0; laserT=0;
  pad.w=92;
  resetBall();
  msg='se te escapó · quedan '+lives; msgT=2;
}

const game = {
  id:'refactor',
  name:'Refactor',
  accent:'#9ED8FF',
  desc:'Breakout contra un archivo legacy, token por token.',
  keys:'<kbd>A</kbd>/<kbd>D</kbd> o <kbd>←</kbd><kbd>→</kbd> mover · <kbd>Espacio</kbd> sacar (y disparar con el power-up)',
  overTitle:'El legacy ganó',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; if(bricks) build(); if(balls) resetBall(); },
  start(){ W=A.W; H=A.H; reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    if(dead) return;
    if(k===' '||k==='spacebar'){
      if(!launched) launch();
      else if(laserT>0 && laserCd<=0){
        laserCd=0.22;
        lasers.push({x:pad.x+8,y:padY()-6},{x:pad.x+pad.w-8,y:padY()-6});
      }
    }
  },

  update(dt){
    if(dead) return;
    t+=dt;
    if(msgT>0) msgT-=dt;
    wide=Math.max(0,wide-dt); slowT=Math.max(0,slowT-dt);
    laserT=Math.max(0,laserT-dt); laserCd=Math.max(0,laserCd-dt);
    pad.w = wide>0 ? 138 : 92;

    let mv=0;
    if(A.keys['a']||A.keys['arrowleft']) mv--;
    if(A.keys['d']||A.keys['arrowright']) mv++;
    pad.x=A.clamp(pad.x+mv*560*dt, 8, W-8-pad.w);

    if(!launched){
      balls[0].x=pad.x+pad.w/2; balls[0].y=padY()-12;
    }

    for(let i=balls.length-1;i>=0;i--){
      const b=balls[i];
      if(!launched) break;
      b.x+=b.vx*dt; b.y+=b.vy*dt;

      if(b.x<12){ b.x=12; b.vx=Math.abs(b.vx); }
      if(b.x>W-12){ b.x=W-12; b.vx=-Math.abs(b.vx); }
      if(b.y<top()+6){ b.y=top()+6; b.vy=Math.abs(b.vy); }

      /* paleta */
      if(b.vy>0 && b.y>padY()-9 && b.y<padY()+12 && b.x>pad.x-6 && b.x<pad.x+pad.w+6){
        const off=A.clamp((b.x-(pad.x+pad.w/2))/(pad.w/2),-1,1);
        const a=-Math.PI/2+off*0.95;
        const s=speed();
        b.vx=Math.cos(a)*s; b.vy=Math.sin(a)*s;
        b.y=padY()-10;
        A.burst(b.x,b.y,'#5FD6C0',3);
      }

      if(b.y>H+16){
        balls.splice(i,1);
        if(!balls.length){ loseLife(); return; }
        continue;
      }

      /* ladrillos */
      for(let j=bricks.length-1;j>=0;j--){
        const k=bricks[j];
        if(b.x+5<k.x||b.x-5>k.x+k.w||b.y+5<k.y||b.y-5>k.y+k.h) continue;
        const ox=Math.min(b.x+5-k.x,k.x+k.w-(b.x-5));
        const oy=Math.min(b.y+5-k.y,k.y+k.h-(b.y-5));
        if(ox<oy) b.vx=-b.vx; else b.vy=-b.vy;
        k.hp--; k.fx=1;
        if(k.hp<=0){
          score+=25+level*5;
          A.burst(k.x+k.w/2,k.y+k.h/2,'#9ED8FF',5);
          drop(k.x+k.w/2,k.y+k.h/2);
          bricks.splice(j,1);
        } else { score+=8; }
        break;
      }
    }

    /* láser */
    for(let i=lasers.length-1;i>=0;i--){
      const l=lasers[i];
      l.y-=620*dt;
      if(l.y<top()){ lasers.splice(i,1); continue; }
      for(let j=bricks.length-1;j>=0;j--){
        const k=bricks[j];
        if(l.x>k.x&&l.x<k.x+k.w&&l.y>k.y&&l.y<k.y+k.h){
          k.hp--; k.fx=1;
          if(k.hp<=0){ score+=25+level*5; A.burst(l.x,l.y,'#C58BFF',4); drop(k.x+k.w/2,k.y+k.h/2); bricks.splice(j,1); }
          lasers.splice(i,1);
          break;
        }
      }
    }

    /* power-ups */
    for(let i=pups.length-1;i>=0;i--){
      const p=pups[i];
      p.y+=118*dt;
      if(p.y>H+20){ pups.splice(i,1); continue; }
      if(p.y>padY()-14 && p.x>pad.x-10 && p.x<pad.x+pad.w+10){
        score+=30;
        if(p.id==='wide') wide=16;
        if(p.id==='slow') slowT=11;
        if(p.id==='laser') laserT=12;
        if(p.id==='multi'){
          const src=balls[0];
          if(src && launched) for(let n=0;n<2;n++){
            const a=Math.atan2(src.vy,src.vx)+(n?0.45:-0.45), s=speed();
            balls.push({x:src.x,y:src.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s});
          }
        }
        msg=p.txt; msgT=2;
        A.burst(p.x,p.y,p.col,10);
        pups.splice(i,1);
      }
    }

    for(const k of bricks) k.fx=Math.max(0,k.fx-dt*4);

    if(!bricks.length){
      level++; score+=150;
      build(); resetBall();
      msg='archivo limpio · siguiente'; msgT=2.4;
    }

    A.hud([
      score+' pts',
      FILES[level%FILES.length].name,
      'vidas '+'●'.repeat(Math.max(0,lives)),
      bricks.length+' tokens',
      laserT>0?'// commit '+laserT.toFixed(0)+'s':(wide>0?'prettier':(slowT>0?'debounce':'sin bonus'))
    ]);
  },

  draw(){
    const ctx=A.ctx;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.5)'; ctx.fillRect(0,top(),W,H-top());

    for(const k of bricks){
      const tough=k.hp>1;
      ctx.fillStyle = k.fx>0 ? 'rgba(255,255,255,.85)' : (tough?'rgba(197,139,255,.20)':'rgba(95,214,192,.13)');
      A.roundRect(k.x,k.y,k.w,k.h,4); ctx.fill();
      ctx.strokeStyle = tough?'rgba(197,139,255,.75)':'rgba(95,214,192,.5)';
      ctx.lineWidth=1; ctx.stroke();
      const size=Math.min(12, k.w/Math.max(2,k.txt.length)*1.5, k.h*0.6);
      A.text(k.txt,k.x+k.w/2,k.y+k.h/2,size, k.fx>0?'#0D1A1E':(tough?'#C58BFF':'#E9F2EF'), tough?700:500);
    }

    for(const p of pups){
      ctx.fillStyle='rgba(13,26,30,.9)';
      A.roundRect(p.x-32,p.y-9,64,18,5); ctx.fill();
      ctx.strokeStyle=p.col; ctx.lineWidth=1.5; ctx.stroke();
      A.text(p.g,p.x,p.y,10,p.col,700);
    }

    ctx.fillStyle='#C58BFF';
    for(const l of lasers) ctx.fillRect(l.x-1,l.y-8,2,12);

    /* paleta */
    ctx.fillStyle = laserT>0 ? '#C58BFF' : (wide>0?'#5FD6C0':'#FFCE5C');
    A.roundRect(pad.x,padY(),pad.w,9,4); ctx.fill();

    /* pelotas */
    ctx.fillStyle='#E9F2EF';
    for(const b of balls){ ctx.beginPath(); ctx.arc(b.x,b.y,5,0,6.283); ctx.fill(); }

    if(!launched) A.text('Espacio para sacar',W/2,padY()-34,12,'rgba(126,154,158,.95)',700);
    if(msgT>0) A.text(msg,W/2,H-8,11.5,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};

window.Arcade.register(game);
})();
