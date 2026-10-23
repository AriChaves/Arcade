/* Null Pointer — nave con inercia entre punteros que se parten */
(function(){
"use strict";
let A, W, H;
let S, rocks, bul, pups, wave, lives, score, t, dead, msg, msgT, waveT, respawn;

const ADDR = ['0x7FFE','0xDEAD','0xBEEF','0x0000','0xC0DE','0xFACE','0x8BAD','0xF00D'];
const PUPS = [
  {id:'triple', g:'spread', col:'#5FD6C0', txt:'disparo triple'},
  {id:'rapid',  g:'async',  col:'#FFCE5C', txt:'cadencia doble'},
  {id:'shield', g:'guard',  col:'#C58BFF', txt:'escudo por 10s'}
];

function top(){ return 46; }

function reset(){
  S={x:W/2,y:(H+top())/2,vx:0,vy:0,a:-Math.PI/2,cd:0,shield:0,triple:0,rapid:0,inv:2.5};
  rocks=[]; bul=[]; pups=[];
  wave=0; lives=3; score=0; t=0; dead=false; msg=''; msgT=0; waveT=1.2; respawn=0;
}

function spawnWave(){
  wave++;
  const n=3+Math.min(wave,7);
  for(let i=0;i<n;i++){
    let x,y,tries=0;
    do { x=A.rnd(0,W); y=A.rnd(top(),H); tries++; }
    while(tries<40 && Math.hypot(x-S.x,y-S.y)<170);
    rocks.push(mkRock(x,y,3));
  }
  msg='wave '+wave+' · '+n+' punteros'; msgT=2.2;
}

function mkRock(x,y,size){
  const sp=(28+wave*3)*(size===3?1:size===2?1.5:2.1);
  const a=Math.random()*6.283;
  return {x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,size,
          r:size===3?36:size===2?23:13,
          txt:A.pick(ADDR)+(size===3?'':size===2?'':''),
          spin:A.rnd(-1.6,1.6), ang:0, fx:0};
}

function wrapPos(o){
  if(o.x<-30) o.x=W+30; if(o.x>W+30) o.x=-30;
  if(o.y<top()-30) o.y=H+30; if(o.y>H+30) o.y=top()-30;
}

function hitRock(i){
  const r=rocks[i];
  score += r.size===3?20:r.size===2?50:100;
  A.burst(r.x,r.y,'#EE7563',r.size*5);
  if(r.size>1){
    for(let k=0;k<2;k++){
      const n=mkRock(r.x+A.rnd(-10,10),r.y+A.rnd(-10,10),r.size-1);
      rocks.push(n);
    }
  } else if(Math.random()<0.22){
    const p=A.pick(PUPS);
    pups.push({x:r.x,y:r.y,vx:A.rnd(-20,20),vy:A.rnd(-20,20),id:p.id,g:p.g,col:p.col,txt:p.txt,life:12});
  }
  rocks.splice(i,1);
  if(!rocks.length){ waveT=1.6; }
}

function boom(){
  lives--;
  A.shake(1.4); A.burst(S.x,S.y,'#FFCE5C',24);
  if(lives<=0){
    dead=true;
    A.end({score, rows:[[score,'puntos'],[wave,'waves'],[Math.floor(t)+'s','en memoria']]});
    return;
  }
  S.x=W/2; S.y=(H+top())/2; S.vx=0; S.vy=0; S.inv=2.5; S.triple=0; S.rapid=0; S.shield=0;
  msg='null pointer dereference'; msgT=2;
}

const game = {
  id:'nullptr',
  name:'Null Pointer',
  accent:'#5FD6C0',
  desc:'Nave con inercia rompiendo punteros que se parten en pedazos.',
  keys:'<kbd>A</kbd>/<kbd>D</kbd> girar · <kbd>W</kbd> empujar · <kbd>Espacio</kbd> disparar',
  overTitle:'Acceso a memoria inválido',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    if((k===' '||k==='spacebar') && !dead && S.cd<=0){
      S.cd = S.rapid>0 ? 0.13 : 0.26;
      const shots = S.triple>0 ? [-0.22,0,0.22] : [0];
      for(const off of shots){
        bul.push({x:S.x+Math.cos(S.a)*14, y:S.y+Math.sin(S.a)*14,
                  vx:Math.cos(S.a+off)*430+S.vx*0.4, vy:Math.sin(S.a+off)*430+S.vy*0.4, life:0.95});
      }
    }
  },

  update(dt){
    if(dead) return;
    t+=dt;
    if(msgT>0) msgT-=dt;
    S.cd-=dt; S.inv=Math.max(0,S.inv-dt);
    S.shield=Math.max(0,S.shield-dt); S.triple=Math.max(0,S.triple-dt); S.rapid=Math.max(0,S.rapid-dt);

    if(!rocks.length){
      waveT-=dt;
      if(waveT<=0) spawnWave();
    }

    /* nave */
    if(A.keys['a']||A.keys['arrowleft']) S.a-=3.3*dt;
    if(A.keys['d']||A.keys['arrowright']) S.a+=3.3*dt;
    const thrust = A.keys['w']||A.keys['arrowup'];
    if(thrust){ S.vx+=Math.cos(S.a)*300*dt; S.vy+=Math.sin(S.a)*300*dt; }
    if(A.keys['s']||A.keys['arrowdown']){ S.vx*=0.97; S.vy*=0.97; }
    S.vx*=0.995; S.vy*=0.995;
    const sp=Math.hypot(S.vx,S.vy);
    if(sp>330){ S.vx=S.vx/sp*330; S.vy=S.vy/sp*330; }
    S.x+=S.vx*dt; S.y+=S.vy*dt;
    wrapPos(S);
    if(thrust && Math.random()<0.5) A.burst(S.x-Math.cos(S.a)*12, S.y-Math.sin(S.a)*12, '#FFCE5C',1);

    /* balas */
    for(let i=bul.length-1;i>=0;i--){
      const b=bul[i];
      b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
      wrapPos(b);
      if(b.life<=0){ bul.splice(i,1); continue; }
      for(let j=rocks.length-1;j>=0;j--){
        if(Math.hypot(b.x-rocks[j].x,b.y-rocks[j].y)<rocks[j].r){
          bul.splice(i,1); hitRock(j); break;
        }
      }
    }

    /* punteros */
    for(const r of rocks){
      r.x+=r.vx*dt; r.y+=r.vy*dt; r.ang+=r.spin*dt; wrapPos(r);
      if(S.inv<=0 && Math.hypot(r.x-S.x,r.y-S.y)<r.r+9){
        if(S.shield>0){ S.shield=0; S.inv=1.6; A.shake(1); A.burst(S.x,S.y,'#C58BFF',16); msg='el escudo aguantó'; msgT=1.6; }
        else { boom(); if(dead) return; }
        break;
      }
    }

    /* power-ups */
    for(let i=pups.length-1;i>=0;i--){
      const p=pups[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt; wrapPos(p);
      if(p.life<=0){ pups.splice(i,1); continue; }
      if(Math.hypot(p.x-S.x,p.y-S.y)<26){
        if(p.id==='triple') S.triple=14;
        if(p.id==='rapid') S.rapid=14;
        if(p.id==='shield') S.shield=10;
        score+=40; msg=p.txt; msgT=1.8;
        A.burst(p.x,p.y,p.col,12);
        pups.splice(i,1);
      }
    }

    A.hud([
      score+' pts','wave '+wave,'naves '+'▲'.repeat(Math.max(0,lives)),
      rocks.length+' punteros',
      (S.shield>0?'escudo ':'')+(S.triple>0?'spread ':'')+(S.rapid>0?'async':'') || 'sin bonus'
    ]);
  },

  draw(){
    const ctx=A.ctx, ty=top();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='rgba(18,36,41,.55)'; ctx.fillRect(0,ty,W,H-ty);

    /* punteros */
    for(const r of rocks){
      ctx.save(); ctx.translate(r.x,r.y); ctx.rotate(r.ang);
      ctx.strokeStyle='rgba(238,117,99,.55)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      for(let i=0;i<7;i++){
        const a=i*6.283/7, rr=r.r*(i%2?0.82:1);
        i?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);
      }
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      A.text(r.txt, r.x, r.y, r.size===3?13:r.size===2?11:9.5, '#EE7563', 500);
    }

    /* power-ups */
    for(const p of pups){
      const bl=p.life<4&&Math.floor(p.life*6)%2?0.35:1;
      ctx.globalAlpha=bl;
      ctx.fillStyle='rgba(13,26,30,.9)';
      A.roundRect(p.x-27,p.y-10,54,20,5); ctx.fill();
      ctx.strokeStyle=p.col; ctx.lineWidth=1.5; ctx.stroke();
      A.text(p.g,p.x,p.y,10.5,p.col,700);
      ctx.globalAlpha=1;
    }

    /* balas */
    ctx.fillStyle='#FFCE5C';
    for(const b of bul){ ctx.beginPath(); ctx.arc(b.x,b.y,2.6,0,6.283); ctx.fill(); }

    /* nave */
    const bl=S.inv>0?(Math.floor(t*20)%2?0.3:1):1;
    ctx.save(); ctx.globalAlpha=bl; ctx.translate(S.x,S.y); ctx.rotate(S.a);
    ctx.beginPath(); ctx.moveTo(14,0); ctx.lineTo(-9,8); ctx.lineTo(-5,0); ctx.lineTo(-9,-8); ctx.closePath();
    ctx.fillStyle='#5FD6C0'; ctx.fill();
    if(A.keys['w']||A.keys['arrowup']){
      ctx.beginPath(); ctx.moveTo(-6,4); ctx.lineTo(-16,0); ctx.lineTo(-6,-4); ctx.closePath();
      ctx.fillStyle='#FFCE5C'; ctx.fill();
    }
    ctx.restore();
    if(S.shield>0){
      ctx.globalAlpha=0.5;
      ctx.beginPath(); ctx.arc(S.x,S.y,19,0,6.283);
      ctx.strokeStyle='#C58BFF'; ctx.lineWidth=2; ctx.stroke();
    }
    ctx.globalAlpha=1;

    if(msgT>0) A.text(msg,W/2,H-16,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
    if(!rocks.length && !dead) A.text('siguiente wave…',W/2,(H+ty)/2,14,'rgba(126,154,158,.9)',700);
  }
};

window.Arcade.register(game);
})();
