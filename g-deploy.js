/* Deploy Viernes — runner de una tecla */
(function(){
"use strict";
let A, W, H;
let P, obs, cofs, v, dist, coffee, t, dead, msg, msgT, nextAt, bg1, bg2, shield;

const LINES=['git push --force','// viernes 17:58','skip ci','LGTM 🚀'.replace('🚀',''),'hotfix/urgente','revert "revert"','deploy to prod','rm -rf node_modules'];

function gy(){ return H-58; }

function reset(){
  P={y:gy(), vy:0, jumps:0, slide:0, w:16, h:30};
  obs=[]; cofs=[];
  v=250; dist=0; coffee=0; t=0; dead=false; msg='no se despliega un viernes'; msgT=2.6;
  nextAt=320; shield=0;
  bg1=[]; bg2=[];
  for(let i=0;i<9;i++) bg1.push({x:A.rnd(0,W), y:A.rnd(60,gy()-70), t:A.pick(LINES)});
  for(let i=0;i<7;i++) bg2.push({x:A.rnd(0,W), y:A.rnd(60,gy()-40), t:A.pick(LINES)});
}

function pitAt(x){
  for(const o of obs) if(o.k==='pit' && x>o.x+4 && x<o.x+o.w-4) return true;
  return false;
}

function spawn(){
  const r=Math.random();
  const hard=Math.min(dist/2200,1);
  if(r<0.34) obs.push({k:'fail', x:W+30, w:26, h:34, txt:'FAIL'});
  else if(r<0.58) obs.push({k:'wall', x:W+30, w:22, h:56+hard*10, txt:'500'});
  else if(r<0.80) obs.push({k:'bird', x:W+30, w:46, h:22, txt:'rollback'});
  else obs.push({k:'pit', x:W+30, w:62+hard*46, h:0, txt:''});
  if(Math.random()<0.34) cofs.push({x:W+30+A.rnd(40,150), y:gy()-A.rnd(48,96)});
}

function crash(why){
  if(shield>0){ shield=0; P.inv=1; msg='el hotfix te salvó'; msgT=1.8; A.shake(1); return false; }
  dead=true;
  A.shake(1.5); A.burst(92,P.y-14,'#EE7563',22);
  A.end({score:Math.round(dist/10)+coffee*20, rows:[
    [Math.round(dist/10)+' m','recorriste'],
    [coffee,'cafés'],
    [Math.round(v)+' px/s','velocidad final'],
    [why,'']
  ]});
  return true;
}

const game = {
  id:'deploy',
  name:'Deploy Viernes',
  accent:'#FFCE5C',
  desc:'Runner de una tecla por el pipeline, cada vez más rápido.',
  keys:'<kbd>Espacio</kbd> saltar (dos veces = doble salto) · <kbd>S</kbd> o <kbd>↓</kbd> deslizarte',
  overTitle:'Se cayó producción un viernes',
  fmt: v=>Math.round(v)+' pts',
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    if(dead) return;
    if(k===' '||k==='spacebar'||k==='w'||k==='arrowup'){
      if(P.jumps<2){ P.vy = P.jumps===0 ? -610 : -530; P.jumps++; P.slide=0; A.burst(92,P.y,'#5FD6C0',4); }
    }
    if(k==='s'||k==='arrowdown'){ if(P.y>=gy()-1) P.slide=0.45; }
  },

  update(dt){
    if(dead) return;
    t+=dt;
    if(msgT>0) msgT-=dt;
    shield=Math.max(0,shield-dt);
    if(P.inv) P.inv=Math.max(0,P.inv-dt);

    v = Math.min(560, 250 + dist/70);
    dist += v*dt;

    /* física */
    P.vy += 2000*dt;
    if(P.vy<0 && !(A.keys[' ']||A.keys['w']||A.keys['arrowup'])) P.vy += 1500*dt;
    P.y += P.vy*dt;
    const overPit = pitAt(92);
    if(!overPit && P.y>=gy()){ P.y=gy(); P.vy=0; P.jumps=0; }
    if(P.slide>0){ P.slide-=dt; if(!(A.keys['s']||A.keys['arrowdown'])) P.slide=Math.min(P.slide,0.12); }
    P.h = P.slide>0 && P.y>=gy()-1 ? 15 : 30;
    P.w = P.slide>0 && P.y>=gy()-1 ? 24 : 16;
    if(P.y > H+40){ crash('caíste en el hueco'); return; }

    /* mundo */
    for(const b of bg1){ b.x-=v*0.18*dt; if(b.x<-180){ b.x=W+A.rnd(20,160); b.y=A.rnd(60,gy()-70); b.t=A.pick(LINES); } }
    for(const b of bg2){ b.x-=v*0.42*dt; if(b.x<-180){ b.x=W+A.rnd(20,160); b.y=A.rnd(60,gy()-40); b.t=A.pick(LINES); } }

    nextAt -= v*dt;
    if(nextAt<=0){ spawn(); nextAt = Math.max(150, 330 - dist/26) + A.rnd(0,120); }

    const px=92-P.w/2, py=P.y-P.h, pw=P.w, ph=P.h;
    for(let i=obs.length-1;i>=0;i--){
      const o=obs[i];
      o.x -= v*dt;
      if(o.x+o.w<-40){ obs.splice(i,1); continue; }
      if(o.k==='pit') continue;
      const oy = o.k==='bird' ? gy()-46 : gy()-o.h;
      if(px<o.x+o.w && px+pw>o.x && py<oy+o.h && py+ph>oy){
        if(crash(o.k==='bird'?'te atropelló un rollback':'chocaste un '+o.txt)) return;
        obs.splice(i,1);
      }
    }

    for(let i=cofs.length-1;i>=0;i--){
      const c=cofs[i];
      c.x -= v*dt;
      if(c.x<-40){ cofs.splice(i,1); continue; }
      if(Math.abs(c.x-92)<22 && Math.abs(c.y-(P.y-P.h/2))<26){
        cofs.splice(i,1); coffee++; shield=Math.max(shield,1);
        msg='café · aguantás un golpe'; msgT=1.8;
        A.burst(c.x,c.y,'#FFCE5C',10);
      }
    }

    A.hud([
      Math.round(dist/10)+' m',
      coffee+' cafés',
      Math.round(v)+' px/s',
      shield>0?'hotfix activo':'sin red'
    ]);
  },

  draw(){
    const ctx=A.ctx, g=gy();
    ctx.textBaseline='middle';

    ctx.textAlign='left';
    ctx.font='12px "JetBrains Mono", monospace';
    ctx.fillStyle='rgba(126,154,158,.10)';
    for(const b of bg1) ctx.fillText(b.t,b.x,b.y);
    ctx.fillStyle='rgba(126,154,158,.16)';
    for(const b of bg2) ctx.fillText(b.t,b.x,b.y);

    /* suelo */
    ctx.strokeStyle='rgba(95,214,192,.75)'; ctx.lineWidth=2;
    ctx.beginPath();
    let x=0;
    const pits=obs.filter(o=>o.k==='pit').sort((a,b)=>a.x-b.x);
    for(const p of pits){
      if(p.x>x){ ctx.moveTo(x,g+2); ctx.lineTo(Math.min(p.x,W),g+2); }
      x=Math.max(x,p.x+p.w);
    }
    if(x<W){ ctx.moveTo(x,g+2); ctx.lineTo(W,g+2); }
    ctx.stroke();
    ctx.fillStyle='rgba(18,36,41,.5)';
    ctx.fillRect(0,g+4,W,H-g-4);

    /* obstáculos */
    ctx.textAlign='center';
    for(const o of obs){
      if(o.k==='pit'){
        ctx.setLineDash([5,5]); ctx.strokeStyle='rgba(238,117,99,.5)'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(o.x,g+2); ctx.lineTo(o.x+o.w,g+2); ctx.stroke();
        ctx.setLineDash([]);
        A.text('rollback',o.x+o.w/2,g+20,10,'rgba(238,117,99,.8)');
        continue;
      }
      const oy = o.k==='bird' ? g-46 : g-o.h;
      const col = o.k==='bird' ? '#C58BFF' : o.k==='wall' ? '#EE7563' : '#F09A6B';
      ctx.fillStyle='rgba(13,26,30,.85)';
      A.roundRect(o.x,oy,o.w,o.h,4); ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.stroke();
      ctx.save();
      if(o.k!=='bird'){
        ctx.translate(o.x+o.w/2,oy+o.h/2); ctx.rotate(-Math.PI/2);
        A.text(o.txt,0,0,10,col,700);
      } else {
        A.text(o.txt,o.x+o.w/2,oy+o.h/2,9.5,col,700);
      }
      ctx.restore();
    }

    /* cafés */
    for(const c of cofs){
      ctx.fillStyle='rgba(13,26,30,.9)';
      A.roundRect(c.x-22,c.y-11,44,22,5); ctx.fill();
      ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=1.5; ctx.stroke();
      A.text('café',c.x,c.y+1,11,'#FFCE5C',700);
    }

    /* jugadora */
    const bl = P.inv>0 ? (Math.floor(t*20)%2?0.35:1) : 1;
    ctx.globalAlpha=bl;
    ctx.fillStyle= shield>0 ? '#6FE0B0' : '#FFCE5C';
    ctx.fillRect(92-P.w/2, P.y-P.h, P.w, P.h);
    ctx.globalAlpha=1;
    if(shield>0){
      ctx.beginPath(); ctx.arc(92,P.y-P.h/2,P.h*0.95,0,6.283);
      ctx.strokeStyle='rgba(111,224,176,.5)'; ctx.lineWidth=2; ctx.stroke();
    }

    if(msgT>0){ ctx.textAlign='center'; A.text(msg,W/2,H-14,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
  }
};

window.Arcade.register(game);
})();
