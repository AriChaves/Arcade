/* Race Condition — esquivar patrones de dos hilos */
(function(){
"use strict";
let A, W, H;
let P, bul, em, toks, t, hp, score, mutex, slow, freeze, boost, evT, msg, msgT, dead, shakeCd;

const PATS = ['espiral','ráfaga','apuntado','onda'];
const NAMES = ['thread-0','thread-1','worker-2','worker-3'];
const COLS = ['#EE7563','#5FD6C0','#C58BFF','#FFCE5C'];

function field(){ return {x0:10, y0:46, x1:W-10, y1:H-12}; }

function reset(){
  const f=field();
  P={x:(f.x0+f.x1)/2, y:(f.y0+f.y1)/2, iframe:0};
  bul=[]; toks=[];
  em=[{a:0.4},{a:3.6}].map((e,i)=>({a:e.a, pat:i, cd:0, phase:0, swap:7, name:NAMES[i], col:COLS[i]}));
  t=0; hp=3; score=0; mutex=0; slow=0; freeze=0; boost=0; evT=34;
  msg='dos hilos escribiendo a la vez'; msgT=2.6; dead=false; shakeCd=0;
}

function epos(e){
  const f=field(), cx=(f.x0+f.x1)/2, cy=(f.y0+f.y1)/2;
  return {x:cx+Math.cos(e.a)*(f.x1-f.x0)*0.44, y:cy+Math.sin(e.a)*(f.y1-f.y0)*0.44};
}

function shoot(x,y,ang,speed,col){
  bul.push({x,y,vx:Math.cos(ang)*speed,vy:Math.sin(ang)*speed,col});
}

function fire(e,dt){
  const p=epos(e);
  const base = Math.min(205, 136 + t*0.32);
  e.cd -= dt;
  if(e.pat===0){
    if(e.cd<=0){ e.cd=0.115; e.phase+=0.52;
      shoot(p.x,p.y,e.phase,base,e.col); shoot(p.x,p.y,e.phase+Math.PI,base,e.col); }
  } else if(e.pat===1){
    if(e.cd<=0){ e.cd=Math.max(0.9,1.7-t/160); const n=11+Math.floor(t/60), off=Math.random()*6.28;
      for(let i=0;i<n;i++) shoot(p.x,p.y,off+i*6.283/n,base*0.85,e.col); }
  } else if(e.pat===2){
    if(e.cd<=0){ e.cd=Math.max(0.45,0.85-t/300);
      const a=Math.atan2(P.y-p.y,P.x-p.x);
      for(let i=-1;i<=1;i++) shoot(p.x,p.y,a+i*0.22,base*1.15,e.col); }
  } else {
    if(e.cd<=0){ e.cd=0.1;
      const a=Math.atan2(P.y-p.y,P.x-p.x)+Math.sin(t*3.1)*0.8;
      shoot(p.x,p.y,a,base,e.col); }
  }
}

const game = {
  id:'race',
  name:'Race Condition',
  accent:'#C58BFF',
  desc:'Bullet hell entre dos hilos. Los mutex frenan todo unos segundos.',
  keys:'<kbd>WASD</kbd> o <kbd>flechas</kbd> para esquivar · agarrá los <b>mutex</b> para ralentizar las balas',
  overTitle:'Estado corrupto',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; reset(); },

  update(dt){
    if(dead) return;
    t+=dt;
    if(msgT>0) msgT-=dt;
    slow=Math.max(0,slow-dt);
    boost=Math.max(0,boost-dt);
    P.iframe=Math.max(0,P.iframe-dt);
    score += dt*12;

    /* evento deadlock */
    evT-=dt;
    if(evT<=0){ evT=A.rnd(30,42); freeze=1.2; boost=0; msg='deadlock — todo congelado'; msgT=2; }
    if(freeze>0){
      freeze-=dt;
      if(freeze<=0){ boost=3; msg='liberado: las balas aceleran'; msgT=1.8; }
    }

    /* hilos nuevos */
    const want = 2 + (t>45?1:0) + (t>95?1:0);
    while(em.length<want){
      const i=em.length;
      em.push({a:Math.random()*6.283, pat:A.ri(4), cd:0, phase:0, swap:7, name:NAMES[i], col:COLS[i]});
      msg=NAMES[i]+' entró a la carrera'; msgT=2.4;
    }

    /* emisores */
    for(const e of em){
      e.a += dt*0.18;
      e.swap -= dt;
      if(e.swap<=0){ e.swap=A.rnd(6,9); e.pat=(e.pat+1+A.ri(3))%4; }
      if(freeze<=0) fire(e,dt);
    }

    /* mover */
    let mx=0,my=0;
    if(A.keys['a']||A.keys['arrowleft']) mx--;
    if(A.keys['d']||A.keys['arrowright']) mx++;
    if(A.keys['w']||A.keys['arrowup']) my--;
    if(A.keys['s']||A.keys['arrowdown']) my++;
    const m=Math.hypot(mx,my)||1;
    const f=field();
    P.x=A.clamp(P.x+(mx/m)*215*dt, f.x0+8, f.x1-8);
    P.y=A.clamp(P.y+(my/m)*215*dt, f.y0+10, f.y1-10);

    /* balas */
    const mult = freeze>0 ? 0 : (slow>0 ? 0.34 : (boost>0 ? 1.45 : 1));
    for(let i=bul.length-1;i>=0;i--){
      const b=bul[i];
      b.x+=b.vx*dt*mult; b.y+=b.vy*dt*mult;
      if(b.x<f.x0-50||b.x>f.x1+50||b.y<f.y0-50||b.y>f.y1+50){ bul.splice(i,1); continue; }
      if(P.iframe<=0 && Math.hypot(b.x-P.x,b.y-P.y)<10){
        bul.splice(i,1);
        hp--; P.iframe=1.4; A.shake(1.2);
        A.burst(P.x,P.y,'#EE7563',14);
        if(hp<=0){
          dead=true;
          A.end({score:Math.round(score), rows:[[Math.round(score),'puntos'],[Math.floor(t)+'s','aguantaste'],[mutex,'mutex'],[em.length,'hilos']]});
          return;
        }
      }
    }

    /* mutex */
    if(toks.length<2 && Math.random()<dt*0.42){
      toks.push({x:A.rnd(f.x0+40,f.x1-40), y:A.rnd(f.y0+40,f.y1-40), life:9});
    }
    for(let i=toks.length-1;i>=0;i--){
      const k=toks[i]; k.life-=dt;
      if(k.life<=0){ toks.splice(i,1); continue; }
      if(Math.hypot(k.x-P.x,k.y-P.y)<24){
        toks.splice(i,1); mutex++; score+=70; slow=2.4;
        A.burst(P.x,P.y,'#5FD6C0',12);
        if(mutex%4===0 && hp<3){ hp++; msg='mutex + vida recuperada'; msgT=2; }
        else { msg='lock adquirido'; msgT=1.6; }
      }
    }

    A.hud([
      Math.round(score)+' pts',
      'vidas '+'●'.repeat(Math.max(0,hp)),
      em.length+' hilos',
      mutex+' mutex',
      slow>0?'LOCK '+slow.toFixed(1)+'s':(freeze>0?'DEADLOCK':(boost>0?'acelerado':'sin lock'))
    ]);
  },

  draw(){
    const ctx=A.ctx, f=field();
    ctx.textAlign='center'; ctx.textBaseline='middle';

    ctx.fillStyle='rgba(18,36,41,.6)';
    ctx.fillRect(f.x0,f.y0,f.x1-f.x0,f.y1-f.y0);
    ctx.strokeStyle= freeze>0 ? 'rgba(197,139,255,.8)' : 'rgba(37,69,77,.9)';
    ctx.lineWidth=1; ctx.strokeRect(f.x0+.5,f.y0+.5,f.x1-f.x0-1,f.y1-f.y0-1);

    /* mutex */
    for(const k of toks){
      const bl=k.life<3&&Math.floor(k.life*6)%2?0.35:1;
      ctx.globalAlpha=bl;
      ctx.fillStyle='rgba(13,26,30,.9)';
      A.roundRect(k.x-26,k.y-10,52,20,5); ctx.fill();
      ctx.strokeStyle='#5FD6C0'; ctx.lineWidth=1.5; ctx.stroke();
      A.text('mutex',k.x,k.y,11,'#5FD6C0',700);
      ctx.globalAlpha=1;
    }

    /* emisores */
    for(const e of em){
      const p=epos(e);
      ctx.fillStyle='rgba(13,26,30,.85)';
      A.roundRect(p.x-38,p.y-13,76,26,6); ctx.fill();
      ctx.strokeStyle=e.col; ctx.lineWidth=1.5; ctx.stroke();
      A.text(e.name,p.x,p.y-3,10.5,e.col,700);
      A.text(PATS[e.pat],p.x,p.y+7,9,'rgba(126,154,158,.95)');
    }

    /* balas */
    for(const b of bul){
      ctx.fillStyle=b.col;
      ctx.globalAlpha = freeze>0 ? 0.55 : 1;
      ctx.beginPath(); ctx.arc(b.x,b.y,4.2,0,6.283); ctx.fill();
    }
    ctx.globalAlpha=1;

    /* jugadora */
    const bl=P.iframe>0?(Math.floor(t*20)%2?0.3:1):1;
    ctx.globalAlpha=bl;
    ctx.fillStyle=slow>0?'#5FD6C0':'#FFCE5C';
    ctx.fillRect(P.x-2,P.y-11,4,22);
    ctx.globalAlpha=bl*0.25;
    ctx.beginPath(); ctx.arc(P.x,P.y,10,0,6.283); ctx.fill();
    ctx.globalAlpha=1;

    if(slow>0){
      ctx.fillStyle='rgba(95,214,192,.07)';
      ctx.fillRect(f.x0,f.y0,f.x1-f.x0,f.y1-f.y0);
    }
    if(msgT>0) A.text(msg,W/2,f.y1-14,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
  }
};

window.Arcade.register(game);
})();
