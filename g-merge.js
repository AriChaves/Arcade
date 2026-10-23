/* Merge Conflict — survivor con mejoras, dash, jefes y pickups */
(function(){
"use strict";
let A, W, H;
const AW=1900, AH=1400;

const FRAGS = ['const x = await fetch(url)','if (!user) return null','// TODO: arreglar esto','export default function App()','try { parse(json) } catch {}',
  'for (let i = 0; i < n; i++)','return items.map(toRow)','throw new Error("boom")','npm run build --prod','git rebase -i HEAD~3',
  'let cache = new Map()','useEffect(() => {}, [])','SELECT * FROM users','function handle(req, res)','// funciona, no tocar'];
const BG=[];

const T = {
  nul:  {g:'null',       hp:9,   sp:72,  dmg:9,  xp:1, r:17, from:0,   col:'#EE7563', size:15, mode:'chase'},
  und:  {g:'undefined',  hp:17,  sp:88,  dmg:12, xp:2, r:26, from:20,  col:'#F09A6B', size:14, mode:'chase'},
  todo: {g:'// TODO',    hp:14,  sp:96,  dmg:6,  xp:7, r:24, from:45,  col:'#7E9A9E', size:13, mode:'flee'},
  nan:  {g:'NaN',        hp:12,  sp:116, dmg:10, xp:2, r:15, from:60,  col:'#F2C14E', size:15, mode:'zig'},
  semi: {g:';',          hp:6,   sp:148, dmg:7,  xp:1, r:10, from:80,  col:'#8FE3D0', size:19, mode:'chase', swarm:true},
  inf:  {g:'Infinity',   hp:26,  sp:132, dmg:13, xp:3, r:26, from:95,  col:'#5FD6C0', size:13, mode:'orbit'},
  conf: {g:'<<<<<<<',    hp:78,  sp:50,  dmg:20, xp:9, r:30, from:110, col:'#C58BFF', size:15, mode:'chase'},
  any:  {g:'any',        hp:34,  sp:80,  dmg:14, xp:4, r:18, from:130, col:'#FFCE5C', size:16, mode:'chase', split:true},
  unk:  {g:'unknown',    hp:11,  sp:126, dmg:8,  xp:1, r:20, from:999, col:'#FFE3A0', size:12, mode:'chase'},
  prom: {g:'Promise',    hp:44,  sp:58,  dmg:15, xp:5, r:28, from:155, col:'#9ED8FF', size:13, mode:'blink'}
};
const SPAWNABLE = [T.nul,T.und,T.todo,T.nan,T.semi,T.inf,T.conf,T.any,T.prom];

const BOSSES = [
  {g:'MERGE CONFLICT', hp:430, sp:46, dmg:26, xp:45, r:48, col:'#C58BFF', size:17, boss:true, mode:'chase'},
  {g:'DEADLOCK',       hp:520, sp:30, dmg:30, xp:55, r:46, col:'#EE7563', size:17, boss:true, mode:'chase', summons:true},
  {g:'SEGFAULT',       hp:380, sp:62, dmg:24, xp:50, r:44, col:'#FFCE5C', size:17, boss:true, mode:'charge'}
];

const PICKUPS = {
  fix:  {g:'hotfix',   col:'#6FE0B0', txt:'hotfix aplicado'},
  bomb: {g:'npm ci',   col:'#C58BFF', txt:'npm ci — reinstalación total'},
  over: {g:'overclock',col:'#FFCE5C', txt:'overclock: doble cadencia'}
};

let P, E, B, S, X, K, PT, t, spawnCd, bossAt, bossIdx, flash, choosing, choices, rerolls, msg, msgT, dead;
let UP=[];

function mk(id,name,desc,max,fn){ return {id,name,desc,max,fn,lv:0}; }
function buildUpgrades(){
  UP=[
    mk('lint','Linter','Orbes que giran y muerden lo que toquen.',5,()=>{P.orbs++; P.orbDmg+=2;}),
    mk('auto','Autocomplete','Disparás bastante más seguido.',6,()=>{P.fireRate*=1.2;}),
    mk('strict','Tipado estricto','Cada disparo duele más.',6,()=>{P.dmg+=3;}),
    mk('coffee','Café','Te movés más rápido.',5,()=>{P.speed+=22;}),
    mk('ram','Más RAM','+30 de vida máxima, y te cura igual.',5,()=>{P.maxhp+=30;P.hp=Math.min(P.maxhp,P.hp+30);}),
    mk('gc','Garbage collector','Un pulso que limpia alrededor.',5,()=>{P.gc=true;P.gcRate*=0.86;P.gcDmg+=7;}),
    mk('regex','Regex','Disparás en abanico.',4,()=>{P.shots++;}),
    mk('hot','Hot reload','Te regenerás sola, de a poco.',4,()=>{P.regen+=1.6;}),
    mk('magnet','Imán de tokens','Los tokens vuelan desde más lejos.',4,()=>{P.magnet+=55;}),
    mk('pierce','Compilador optimizado','Los disparos atraviesan un bug más.',3,()=>{P.pierce++;}),
    mk('shield','Try / catch','Menos daño al chocar, más invulnerabilidad.',3,()=>{P.armor+=0.15;P.ifr+=0.2;}),
    mk('srcmap','Sourcemaps','Probabilidad de crítico: duele el doble y medio.',4,()=>{P.crit+=0.12;}),
    mk('minify','Minificador','Disparos más rápidos y más gordos.',3,()=>{P.bspeed+=80;P.bsize+=1.2;}),
    mk('cron','Cron job','Cada tanto cae un rayo sobre el bug más cercano.',4,()=>{P.cron=true;P.cronDmg+=26;P.cronRate=Math.max(1.1,P.cronRate-0.55);}),
    mk('prettier','Prettier','Los orbes giran más lejos y más rápido.',3,()=>{P.orbR+=20;P.orbSp+=0.6;}),
    mk('dash','Ctrl+Z','El dash se recarga mucho más rápido.',3,()=>{P.dashRate=Math.max(0.9,P.dashRate-0.55);}),
    mk('rollback','Rollback','Si morís, volvés una vez con media vida.',1,()=>{P.revive=1;})
  ];
}

function reset(){
  buildUpgrades();
  P={x:AW/2,y:AH/2,aimx:1,aimy:0,hp:100,maxhp:100,speed:178,dmg:7,fireRate:2.1,fireCd:0,
     shots:1,pierce:0,bspeed:430,bsize:0,crit:0,orbs:0,orbDmg:0,orbAng:0,orbR:74,orbSp:2.4,
     gc:false,gcRate:3.4,gcCd:3.4,gcDmg:10,cron:false,cronRate:3.4,cronCd:3.4,cronDmg:0,
     regen:0,magnet:70,armor:0,ifr:0.75,iframe:0,revive:0,
     dashRate:2.6,dashCd:0,dashT:0,dashX:1,dashY:0,over:0,
     level:1,xp:0,need:5,kills:0};
  E=[];B=[];S=[];X=[];K=[];PT=[];
  t=0; spawnCd=0.25; bossAt=95; bossIdx=0; flash=0;
  choosing=false; choices=[]; rerolls=2; msg=''; msgT=0; dead=false;
  BG.length=0;
  for(let i=0;i<110;i++) BG.push({x:A.rnd(-100,AW+100), y:A.rnd(-60,AH+60), t:A.pick(FRAGS)});
}

/* ---------- partículas propias (coordenadas de mundo) ---------- */
const CH=['0','1',';','{','}','(',')','<','>','/','*','#'];
function burst(x,y,col,n){
  for(let i=0;i<n;i++){
    const a=Math.random()*6.283,s=A.rnd(45,190);
    PT.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:A.rnd(.3,.7),max:.7,c:col,ch:A.pick(CH)});
  }
}

function spawn(){
  const av = SPAWNABLE.filter(x=>t>=x.from);
  const ty = av[Math.random()<0.5 ? av.length-1 : A.ri(av.length)];
  const n = ty.swarm ? 3+A.ri(4) : 1 + (t>35?A.ri(2):0) + (t>90?1:0);
  const a0=Math.random()*6.283, rad=Math.max(W,H)*0.5+55;
  for(let i=0;i<n;i++){
    const a=a0+A.rnd(-0.35,0.35);
    add(ty, P.x+Math.cos(a)*rad, P.y+Math.sin(a)*rad);
  }
}
function add(ty,x,y){
  if(E.length>160) return;
  const sc=1+t/135;
  E.push({t:ty,x:A.clamp(x,-200,AW+200),y:A.clamp(y,-200,AH+200),hp:ty.hp*sc,max:ty.hp*sc,r:ty.r,wob:Math.random()*6.28,ifr:0,fx:0,cd:A.rnd(1,3)});
}
function spawnBoss(){
  const b=Object.assign({},BOSSES[bossIdx%BOSSES.length]); bossIdx++;
  b.hp=b.hp*(1+t/150);
  const a=Math.random()*6.283, rad=Math.max(W,H)*0.5+80;
  E.push({t:b,x:P.x+Math.cos(a)*rad,y:P.y+Math.sin(a)*rad,hp:b.hp,max:b.hp,r:b.r,wob:0,ifr:0,fx:0,cd:2});
  flash=0.8; msg=b.g+' apareció'; msgT=2.6;
}

function damage(e,d,crit){
  e.hp-=d; e.fx=1;
  if(crit) burst(e.x,e.y,'#FFCE5C',3);
}

function killed(e){
  P.kills++;
  burst(e.x,e.y,e.t.col,e.t.boss?28:6);
  const n=e.t.boss?10:1;
  for(let i=0;i<n;i++) X.push({x:e.x+A.rnd(-18,18),y:e.y+A.rnd(-18,18),v:Math.max(1,Math.round(e.t.xp/n))});
  if(e.t.split) for(let i=0;i<2;i++) add(T.unk, e.x+A.rnd(-20,20), e.y+A.rnd(-20,20));
  if(e.t.boss){ A.shake(1.4); dropPickup(e.x,e.y,'bomb'); }
  else if(Math.random()<0.035) dropPickup(e.x,e.y, A.pick(['fix','fix','over']));
}
function dropPickup(x,y,id){ K.push({x,y,id,life:16}); }

function levelUp(){
  P.level++; P.xp-=P.need;
  P.need=Math.round(P.need*1.45+3);
  P.hp=Math.min(P.maxhp,P.hp+6);
  roll();
  if(!choices.length){ P.dmg+=2; return; }
  choosing=true;
}
function roll(){
  const pool=UP.filter(u=>u.lv<u.max), c=[];
  const copy=pool.slice();
  while(c.length<3 && copy.length) c.push(copy.splice(A.ri(copy.length),1)[0]);
  choices=c;
}
function take(i){
  const u=choices[i]; if(!u) return;
  u.lv++; u.fn();
  choices=[]; choosing=false;
  msg=u.name+' nivel '+u.lv; msgT=1.8;
}

function die(){
  if(P.revive>0){
    P.revive=0; P.hp=P.maxhp*0.5; P.iframe=2.5;
    for(const e of E) if(!e.t.boss) e.hp=0;
    msg='rollback — volviste'; msgT=2.6; A.shake(1.4); flash=1;
    return;
  }
  dead=true;
  A.end({score:Math.round(t), rows:[[fmtT(t),'sobreviviste'],[P.kills,'bugs'],[P.level,'nivel'],[P.kills?Math.round(P.kills/Math.max(t,1)*60):0,'bugs/min']]});
}
function fmtT(s){ const m=Math.floor(s/60); return m+':'+String(Math.floor(s%60)).padStart(2,'0'); }

function wrap(ctx,text,maxw){
  const words=text.split(' '), lines=[]; let cur='';
  for(const w of words){
    const test = cur? cur+' '+w : w;
    if(ctx.measureText(test).width>maxw && cur){ lines.push(cur); cur=w; }
    else cur=test;
  }
  if(cur) lines.push(cur);
  return lines;
}

const game = {
  id:'merge',
  name:'Merge Conflict',
  accent:'#EE7563',
  desc:'Survivor: disparás solo, juntás tokens y armás tu build entre 17 mejoras.',
  keys:'<kbd>WASD</kbd>/<kbd>flechas</kbd> moverte · <kbd>Espacio</kbd> dash · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> mejora · <kbd>R</kbd> rerollear',
  overTitle:'Segmentation fault',
  fmt: v=>fmtT(v),
  init(api){ A=api; },
  resize(w,h){ W=w; H=h; },
  start(){ W=A.W; H=A.H; reset(); },

  keydown(e){
    const k=e.key.toLowerCase();
    if(choosing){
      if(k==='1') take(0);
      if(k==='2') take(1);
      if(k==='3') take(2);
      if(k==='r' && rerolls>0){ rerolls--; roll(); }
      return;
    }
    if((k===' '||k==='spacebar') && P.dashCd<=0){
      P.dashCd=P.dashRate; P.dashT=0.17;
      P.dashX=P.aimx; P.dashY=P.aimy;
      P.iframe=Math.max(P.iframe,0.3);
      burst(P.x,P.y,'#FFCE5C',8);
    }
  },

  update(dt){
    if(dead) return;
    if(choosing){ for(const p of PT){ p.life-=dt; } return; }
    t+=dt;
    if(msgT>0) msgT-=dt;
    flash=Math.max(0,flash-dt*1.6);

    /* mover */
    let mx=0,my=0;
    if(A.keys['a']||A.keys['arrowleft']) mx--;
    if(A.keys['d']||A.keys['arrowright']) mx++;
    if(A.keys['w']||A.keys['arrowup']) my--;
    if(A.keys['s']||A.keys['arrowdown']) my++;
    const m=Math.hypot(mx,my)||1;
    if(mx||my){ P.aimx=mx/m; P.aimy=my/m; }
    P.dashCd=Math.max(0,P.dashCd-dt);
    let sp=P.speed;
    if(P.dashT>0){ P.dashT-=dt; sp=P.speed*3.6; mx=P.dashX*m; my=P.dashY*m; }
    P.x=A.clamp(P.x+(mx/m)*sp*dt,16,AW-16);
    P.y=A.clamp(P.y+(my/m)*sp*dt,16,AH-16);

    P.iframe=Math.max(0,P.iframe-dt);
    P.over=Math.max(0,P.over-dt);
    if(P.regen) P.hp=Math.min(P.maxhp,P.hp+P.regen*dt);

    /* spawns */
    spawnCd-=dt;
    if(spawnCd<=0){ spawnCd=Math.max(0.22,0.72-t/200); spawn(); }
    if(t>=bossAt){ bossAt+=100; spawnBoss(); }

    /* disparo */
    P.fireCd-=dt;
    if(P.fireCd<=0){
      P.fireCd=1/(P.fireRate*(P.over>0?2:1));
      let tg=null,bd=1e9;
      for(const e of E){ const d=A.dist(e,P); if(d<bd){bd=d;tg=e;} }
      let ax=P.aimx,ay=P.aimy;
      if(tg&&bd<640){ ax=(tg.x-P.x)/(bd||1); ay=(tg.y-P.y)/(bd||1); }
      const base=Math.atan2(ay,ax);
      for(let i=0;i<P.shots;i++){
        const a=base+(i-(P.shots-1)/2)*0.19;
        const crit=Math.random()<P.crit;
        B.push({x:P.x,y:P.y,vx:Math.cos(a)*P.bspeed,vy:Math.sin(a)*P.bspeed,
                dmg:P.dmg*(crit?2.5:1),crit,life:1.25,pierce:P.pierce,hit:[]});
      }
    }

    if(P.orbs) P.orbAng+=dt*P.orbSp;

    /* gc */
    if(P.gc){
      P.gcCd-=dt;
      if(P.gcCd<=0){ P.gcCd=P.gcRate; S.push({x:P.x,y:P.y,r:10,max:170+P.gcDmg*2,dmg:P.gcDmg,hit:[]}); }
    }
    for(let i=S.length-1;i>=0;i--){
      const p=S[i]; p.r+=dt*330;
      for(const e of E){
        if(p.hit.indexOf(e)!==-1) continue;
        if(Math.abs(A.dist(e,p)-p.r)<e.r+14){ p.hit.push(e); damage(e,p.dmg); }
      }
      if(p.r>p.max) S.splice(i,1);
    }

    /* cron */
    if(P.cron){
      P.cronCd-=dt;
      if(P.cronCd<=0 && E.length){
        P.cronCd=P.cronRate;
        let tg=null,bh=-1;
        for(const e of E){ if(A.dist(e,P)<520 && e.hp>bh){ bh=e.hp; tg=e; } }
        if(tg){ damage(tg,P.cronDmg,true); burst(tg.x,tg.y,'#9ED8FF',10); }
      }
    }

    /* balas */
    for(let i=B.length-1;i>=0;i--){
      const b=B[i];
      b.x+=b.vx*dt; b.y+=b.vy*dt; b.life-=dt;
      let gone=b.life<=0;
      if(!gone) for(const e of E){
        if(b.hit.indexOf(e)!==-1) continue;
        if(A.dist(b,e)<e.r*0.82){
          damage(e,b.dmg,b.crit); b.hit.push(e);
          if(b.pierce>0) b.pierce--; else gone=true;
          break;
        }
      }
      if(gone) B.splice(i,1);
    }

    /* enemigos */
    for(let i=E.length-1;i>=0;i--){
      const e=E[i];
      e.fx=Math.max(0,e.fx-dt*4); e.ifr=Math.max(0,e.ifr-dt);
      const d=A.dist(e,P)||1;
      let dx=(P.x-e.x)/d, dy=(P.y-e.y)/d;
      const mode=e.t.mode;
      if(mode==='zig'){ e.wob+=dt*6; dx+=Math.cos(e.wob)*0.55; dy+=Math.sin(e.wob)*0.55; }
      else if(mode==='orbit'){ const tx=-dy,ty=dx; dx=dx*0.35+tx*0.9; dy=dy*0.35+ty*0.9; }
      else if(mode==='flee'){ if(d<260){ dx=-dx; dy=-dy; } }
      else if(mode==='blink'){
        e.cd-=dt;
        if(e.cd<=0){ e.cd=3.4; const a=Math.random()*6.283;
          e.x=P.x+Math.cos(a)*A.rnd(120,200); e.y=P.y+Math.sin(a)*A.rnd(120,200);
          burst(e.x,e.y,e.t.col,6); }
      } else if(mode==='charge'){
        e.cd-=dt;
        if(e.cd<=0){ e.cd=2.4; e.boost=1.1; }
        if(e.boost>0) e.boost-=dt;
      }
      if(e.t.summons){
        e.cd-=dt;
        if(e.cd<=0){ e.cd=5.5; for(let s=0;s<4;s++){ const a=Math.random()*6.283; add(T.semi,e.x+Math.cos(a)*60,e.y+Math.sin(a)*60); } }
      }
      const spd=e.t.sp*(1+t/500)*(e.boost>0?2.6:1);
      e.x+=dx*spd*dt; e.y+=dy*spd*dt;

      if(P.orbs && e.ifr<=0){
        for(let o=0;o<P.orbs;o++){
          const a=P.orbAng+o*(6.283/P.orbs);
          if(Math.hypot(P.x+Math.cos(a)*P.orbR-e.x, P.y+Math.sin(a)*P.orbR-e.y)<e.r+9){
            damage(e,5+P.orbDmg); e.ifr=0.32; break;
          }
        }
      }

      if(d<e.r*0.72+11 && P.iframe<=0){
        P.hp-=e.t.dmg*(1-P.armor);
        P.iframe=P.ifr; A.shake(1);
        burst(P.x,P.y,'#EE7563',7);
        if(P.hp<=0){ die(); if(dead) return; }
      }
      if(e.hp<=0){ killed(e); E.splice(i,1); }
    }

    /* tokens */
    for(let i=X.length-1;i>=0;i--){
      const x=X[i], d=A.dist(x,P);
      if(d<P.magnet){ const pull=260+(P.magnet-d); x.x+=(P.x-x.x)/d*pull*dt; x.y+=(P.y-x.y)/d*pull*dt; }
      if(d<22){ P.xp+=x.v; X.splice(i,1); if(P.xp>=P.need){ levelUp(); return; } }
    }

    /* pickups */
    for(let i=K.length-1;i>=0;i--){
      const k=K[i]; k.life-=dt;
      if(k.life<=0){ K.splice(i,1); continue; }
      if(A.dist(k,P)<34){
        const info=PICKUPS[k.id];
        if(k.id==='fix') P.hp=Math.min(P.maxhp,P.hp+28);
        if(k.id==='over') P.over=8;
        if(k.id==='bomb'){ for(const e of E){ damage(e,70); } A.shake(1.2); flash=0.7; }
        msg=info.txt; msgT=2; burst(k.x,k.y,info.col,14);
        K.splice(i,1);
      }
    }

    for(let i=PT.length-1;i>=0;i--){
      const p=PT[i];
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.93; p.vy*=0.93; p.life-=dt;
      if(p.life<=0) PT.splice(i,1);
    }

    A.hud([
      fmtT(t), 'lv '+P.level, P.kills+' bugs',
      Math.max(0,Math.round(P.hp))+'/'+P.maxhp+' hp',
      P.dashCd<=0?'dash listo':'dash '+P.dashCd.toFixed(1)+'s'
    ], {pct:P.xp/P.need, col:'#5FD6C0'});
  },

  draw(){
    const ctx=A.ctx;
    const camx=A.clamp(P.x-W/2,-40,AW-W+40), camy=A.clamp(P.y-H/2,-40,AH-H+40);
    ctx.save();
    ctx.translate(-camx,-camy);
    ctx.textAlign='center'; ctx.textBaseline='middle';

    /* grilla */
    ctx.strokeStyle='rgba(37,69,77,.55)'; ctx.lineWidth=1;
    const g=64, x0=Math.floor(camx/g)*g, y0=Math.floor(camy/g)*g;
    ctx.beginPath();
    for(let x=x0;x<camx+W+g;x+=g){ ctx.moveTo(x,camy-10); ctx.lineTo(x,camy+H+10); }
    for(let y=y0;y<camy+H+g;y+=g){ ctx.moveTo(camx-10,y); ctx.lineTo(camx+W+10,y); }
    ctx.stroke();

    ctx.font='12px "JetBrains Mono", monospace';
    ctx.fillStyle='rgba(126,154,158,.10)'; ctx.textAlign='left';
    for(const f of BG){
      if(f.x<camx-260||f.x>camx+W+40||f.y<camy-20||f.y>camy+H+20) continue;
      ctx.fillText(f.t,f.x,f.y);
    }
    ctx.textAlign='center';

    ctx.strokeStyle='rgba(238,117,99,.5)'; ctx.setLineDash([10,8]); ctx.lineWidth=2;
    ctx.strokeRect(0,0,AW,AH); ctx.setLineDash([]);

    ctx.fillStyle='#5FD6C0'; ctx.font='13px "JetBrains Mono", monospace';
    for(const x of X) ctx.fillText('◆',x.x,x.y);

    for(const k of K){
      const info=PICKUPS[k.id];
      const bl=k.life<4&&Math.floor(k.life*6)%2?0.35:1;
      ctx.globalAlpha=bl;
      ctx.fillStyle='rgba(13,26,30,.9)';
      A.roundRect(k.x-34,k.y-11,68,22,6); ctx.fill();
      ctx.strokeStyle=info.col; ctx.lineWidth=1.5; ctx.stroke();
      A.text(info.g,k.x,k.y,11,info.col,700);
      ctx.globalAlpha=1;
    }

    for(const p of S){
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.283);
      ctx.strokeStyle='rgba(95,214,192,'+A.clamp(1-p.r/p.max,0,1)*0.7+')';
      ctx.lineWidth=3; ctx.stroke();
    }

    for(const e of E){
      ctx.font=(e.t.boss?'700 ':'500 ')+e.t.size+'px "JetBrains Mono", monospace';
      ctx.fillStyle=e.fx>0?'#FFFFFF':e.t.col;
      ctx.globalAlpha=A.clamp(0.45+(e.hp/e.max)*0.55,0.35,1);
      ctx.fillText(e.t.g,e.x,e.y);
      ctx.globalAlpha=1;
      if(e.t.boss){
        ctx.fillStyle='rgba(13,26,30,.8)'; ctx.fillRect(e.x-62,e.y-32,124,5);
        ctx.fillStyle=e.t.col; ctx.fillRect(e.x-62,e.y-32,124*A.clamp(e.hp/e.max,0,1),5);
      }
    }

    for(const b of B){
      ctx.fillStyle=b.crit?'#FFFFFF':'#FFCE5C';
      ctx.beginPath(); ctx.arc(b.x,b.y,3.2+P.bsize,0,6.283); ctx.fill();
    }

    if(P.orbs){
      ctx.font='600 15px "JetBrains Mono", monospace'; ctx.fillStyle='#5FD6C0';
      for(let o=0;o<P.orbs;o++){
        const a=P.orbAng+o*(6.283/P.orbs);
        ctx.fillText('*',P.x+Math.cos(a)*P.orbR,P.y+Math.sin(a)*P.orbR);
      }
    }

    const bl=P.iframe>0?(Math.floor(t*22)%2?0.25:1):1;
    ctx.globalAlpha=bl;
    ctx.fillStyle=P.over>0?'#FFE3A0':'#FFCE5C';
    ctx.fillRect(P.x-2,P.y-13,4,26);
    ctx.globalAlpha=bl*0.22;
    ctx.beginPath(); ctx.arc(P.x,P.y,P.dashT>0?30:20,0,6.283); ctx.fill();
    ctx.globalAlpha=1;

    ctx.font='11px "JetBrains Mono", monospace';
    for(const p of PT){
      ctx.globalAlpha=A.clamp(p.life/p.max,0,1);
      ctx.fillStyle=p.c; ctx.fillText(p.ch,p.x,p.y);
    }
    ctx.globalAlpha=1;
    ctx.restore();

    if(flash>0){
      ctx.fillStyle='rgba(197,139,255,'+(flash*0.26)+')';
      ctx.fillRect(0,0,W,H);
    }
    if(msgT>0){
      ctx.textAlign='center';
      A.text(msg,W/2,H-18,12.5,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700);
    }

    /* menú de mejoras dibujado en el canvas */
    if(choosing){
      ctx.fillStyle='rgba(10,20,23,.92)'; ctx.fillRect(0,0,W,H);
      ctx.textAlign='center';
      A.text('nivel '+P.level+' · elegí una mejora',W/2,30,12,'#7E9A9E');
      const n=choices.length, pad=10;
      const cw=Math.min(210,(W-pad*(n+1))/n), chh=Math.min(180,H-90);
      const y0=52, x0=(W-(cw*n+pad*(n-1)))/2;
      for(let i=0;i<n;i++){
        const u=choices[i], x=x0+i*(cw+pad);
        ctx.fillStyle='rgba(25,48,54,.95)';
        A.roundRect(x,y0,cw,chh,8); ctx.fill();
        ctx.strokeStyle='#5FD6C0'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='#FFCE5C';
        A.roundRect(x+cw/2-13,y0+12,26,22,5); ctx.fill();
        A.text(String(i+1),x+cw/2,y0+23.5,13,'#0D1A1E',700);
        A.text(u.name,x+cw/2,y0+52,14,'#E9F2EF',700);
        ctx.font='500 11px "JetBrains Mono", monospace';
        const lines=wrap(ctx,u.desc,cw-22);
        for(let l=0;l<lines.length;l++) A.text(lines[l],x+cw/2,y0+74+l*15,11,'rgba(126,154,158,1)');
        A.text(u.lv?('nivel '+u.lv+' → '+(u.lv+1)):'nueva',x+cw/2,y0+chh-16,10.5,'#FFCE5C');
      }
      A.text(rerolls>0?('R · rerollear ('+rerolls+')'):'sin rerolls',W/2,y0+chh+22,11.5,rerolls>0?'#5FD6C0':'#7E9A9E');
    }
  }
};

window.Arcade.register(game);
})();
