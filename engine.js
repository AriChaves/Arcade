/* Bug Arcade — núcleo: canvas, loop, input, menú, récords */
(function(){
"use strict";

const $ = id => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const stage = $('stage'), hudEl = $('hud'), over = $('over'), overInner = $('overInner'), legend = $('legend');

const COL = {
  ground:'#0D1A1E', panel:'#122429', panel2:'#193036', line:'#25454D',
  ink:'#E9F2EF', muted:'#7E9A9E', gold:'#FFCE5C', rose:'#EE7563',
  aqua:'#5FD6C0', violet:'#C58BFF', orange:'#F09A6B'
};

const rnd  = (a,b)=>a+Math.random()*(b-a);
const ri   = n=>Math.floor(Math.random()*n);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick = a=>a[ri(a.length)];
const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

let W=820, H=480, DPR=1;
let autoT=null;
let games=[], cur=null, state='menu', last=0, shake=0, hudCache='', parts=[];

function resize(){
  W = Math.max(280, stage.clientWidth || 820);
  /* the page may cap the height so the whole game view fits the window (machine.js) */
  const cap = window.Arcade && window.Arcade.maxStageH ? window.Arcade.maxStageH() : Infinity;
  H = Math.max(320, Math.min(500, Math.round(W*0.58), cap));
  DPR = Math.min(window.devicePixelRatio||1, 2);
  cv.width = Math.round(W*DPR);
  cv.height = Math.round(H*DPR);
  cv.style.height = H+'px';
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(cur && cur.resize) cur.resize(W,H);
}
window.addEventListener('resize', resize);

/* ---------- récords ---------- */
function best(id){ try { return parseFloat(localStorage.getItem('ba_'+id)||'0')||0; } catch(e){ return 0; } }
function setBest(id,v){ try { localStorage.setItem('ba_'+id, String(v)); } catch(e){} }

/* ---------- partículas compartidas ---------- */
const CHARS = ['0','1',';','{','}','(',')','<','>','/','*','#','$','&'];
function burst(x,y,col,n){
  for(let i=0;i<n;i++){
    const a=Math.random()*6.283, s=rnd(45,190);
    parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(.28,.7),max:.7,c:col,ch:pick(CHARS)});
  }
}
function updateParts(dt){
  for(let i=parts.length-1;i>=0;i--){
    const p=parts[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.93; p.vy*=0.93; p.life-=dt;
    if(p.life<=0) parts.splice(i,1);
  }
}
function drawParts(){
  ctx.font='11px "JetBrains Mono", monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const p of parts){
    ctx.globalAlpha=clamp(p.life/p.max,0,1);
    ctx.fillStyle=p.c;
    ctx.fillText(p.ch,p.x,p.y);
  }
  ctx.globalAlpha=1;
}

/* ---------- HUD ---------- */
function hud(chips, bar){
  const key = chips.join('|')+'#'+(bar?bar.pct.toFixed(3)+bar.col:'');
  if(key===hudCache) return;
  hudCache = key;
  hudEl.innerHTML =
    '<div class="hud-row">'+chips.map(c=>'<span class="chip">'+c+'</span>').join('')+'</div>'+
    (bar ? '<div class="hud-bar"><i style="width:'+clamp(bar.pct*100,0,100)+'%;background:'+bar.col+'"></i></div>' : '');
}

/* ---------- API para los juegos ---------- */
const A = {
  ctx, COL, keys:Object.create(null),
  get W(){ return W; }, get H(){ return H; },
  rnd, ri, clamp, pick, dist, burst,
  shake(n){ shake = Math.max(shake, n); },
  hud,
  end(stats){ endRun(stats); },
  text(t,x,y,size,col,weight){
    ctx.font=(weight||500)+' '+size+'px "JetBrains Mono", monospace';
    ctx.fillStyle=col; ctx.fillText(t,x,y);
  },
  roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
};

/* ---------- overlays ---------- */
function show(html){ overInner.innerHTML = html; over.classList.remove('hide'); }
function hide(){ over.classList.add('hide'); }

function stopAuto(){ if(autoT){ clearInterval(autoT); autoT=null; } }
function menu(){
  stopAuto();
  state='menu'; cur=null; parts.length=0;
  hudEl.innerHTML=''; hudCache='';
  /* the machine (machine.js) is the game picker: hand control back to it */
  if(window.Arcade.onMenu){ hide(); window.Arcade.onMenu(); return; }
  legend.innerHTML = '<span>Elegí con <kbd>1</kbd>–<kbd>'+(games.length<10?games.length:9)+'</kbd>'+(games.length>9?' y <kbd>0</kbd>':'')+' o con un clic</span><span>Todos se juegan solo con el teclado y se pausan solos si cambiás de pestaña</span>';
  show(
    '<p class="eyebrow">'+games.length+' juegos</p>'+
    '<h2>¿Qué rompemos hoy?</h2>'+
    '<div class="cards">'+games.map((g,i)=>
      '<button class="card" data-i="'+i+'" style="border-top-color:'+g.accent+'">'+
        '<span class="n">'+(i<9?i+1:i===9?0:'&nbsp;')+'</span>'+
        '<span class="t" style="color:'+g.accent+'">'+g.name+'</span>'+
        '<span class="d">'+g.desc+'</span>'+
        '<span class="lv">'+(g.players?g.players+' jugadores':'récord '+(best(g.id)?g.fmt(best(g.id)):'—'))+'</span>'+
      '</button>').join('')+
    '</div>'
  );
  const menuAt=performance.now(); /* ignore the tap that opened the menu */
  overInner.querySelectorAll('.card').forEach(b=>{
    b.addEventListener('click', ()=>{ if(performance.now()-menuAt>450) launch(games[+b.dataset.i]); });
  });
}

function launch(g){
  stopAuto();
  cur = g;
  parts.length = 0;
  hudCache = '';
  if(g.init && !g._ready){ g.init(A); g._ready = true; }
  if(g.resize) g.resize(W,H);
  g.start();
  legend.innerHTML = '<span>'+g.keys+'</span><span><kbd>Esc</kbd> pausa · <kbd>Esc</kbd> otra vez para volver al menú</span>';
  hide();
  state='play';
}

function pause(){
  if(state!=='play') return;
  state='pause';
  show(
    '<p class="eyebrow">'+cur.name+' · en pausa</p>'+
    '<h2>Volvé al código</h2>'+
    '<p>Todo congelado. <kbd>Espacio</kbd> seguir · <kbd>Esc</kbd> volver al menú.</p>'+
    '<button class="go" id="res">Espacio · seguir</button>'
  );
  const b=$('res'); if(b) b.addEventListener('click', ()=>{ hide(); state='play'; });
}

function endRun(stats){
  state='over';
  const b = best(cur.id);
  const record = stats.score > b;
  if(record) setBest(cur.id, stats.score);
  show(
    '<p class="eyebrow">'+cur.name+(record?' · récord nuevo':'')+'</p>'+
    '<h2>'+cur.overTitle+'</h2>'+
    '<div class="stats">'+stats.rows.map(r=>'<span><b>'+r[0]+'</b>'+r[1]+'</span>').join('')+
      '<span><b>'+cur.fmt(Math.max(b,stats.score))+'</b>récord</span></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="go" id="again">Jugar otra vez</button><button class="go" id="tomenu" style="background:transparent;color:var(--ink);border:1px solid var(--line)">Elegir otro juego</button></div>'+
    '<p><kbd>Espacio</kbd> jugar otra vez · <kbd>Esc</kbd> elegir otro juego</p>'
  );
  const shownAt=performance.now(), ready=()=>performance.now()-shownAt>450; /* ignore the tap that ended the game */
  const el=$('again'); if(el) el.addEventListener('click', ()=>{ if(ready()) launch(cur); });
  const mn=$('tomenu'); if(mn) mn.addEventListener('click', ()=>{ if(ready()) menu(); });
  /* Mesa de Juegos: start a new game on its own after a few seconds */
  stopAuto();
  let n=4; const g=cur;
  const cd=document.createElement('p'); cd.id='autoMsg'; cd.style.color='var(--gold)'; cd.textContent='Nueva partida en '+n+'…';
  overInner.appendChild(cd);
  autoT=setInterval(()=>{ n--; if(state!=='over'||cur!==g){ stopAuto(); return; }
    if(n<=0){ stopAuto(); launch(g); } else cd.textContent='Nueva partida en '+n+'…'; },1000);
}

/* ---------- attract mode del menú ---------- */
const RAIN = [];
function rainInit(){
  RAIN.length=0;
  for(let i=0;i<70;i++) RAIN.push({x:rnd(0,1), y:rnd(0,1), s:rnd(14,52), ch:pick(CHARS), a:rnd(.05,.2)});
}
function rainDraw(dt){
  ctx.fillStyle=COL.ground; ctx.fillRect(0,0,W,H);
  ctx.font='13px "JetBrains Mono", monospace';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const r of RAIN){
    r.y += (r.s/H)*dt*0.55;
    if(r.y>1.05){ r.y=-0.05; r.x=Math.random(); r.ch=pick(CHARS); }
    ctx.globalAlpha=r.a;
    ctx.fillStyle=COL.aqua;
    ctx.fillText(r.ch, r.x*W, r.y*H);
  }
  ctx.globalAlpha=1;
}

/* ---------- input ---------- */
window.addEventListener('keydown', e=>{
  const k=e.key;
  if(k===' '||k==='Spacebar'||k.indexOf('Arrow')===0) e.preventDefault();
  A.keys[k.toLowerCase()]=true;

  if(k==='Escape'){
    if(state==='play') pause();
    else if(state==='pause'||state==='over') menu();
    return;
  }
  if(k===' '||k==='Spacebar'){
    if(state==='pause'){ hide(); state='play'; return; }
    if(state==='over'){ launch(cur); return; }
  }
  if(state==='menu'){
    if(window.Arcade.onMenu) return;
    const n = k==='0' ? 10 : parseInt(k,10);
    if(n>=1 && n<=games.length) launch(games[n-1]);
    return;
  }
  if(state==='play' && cur && cur.keydown) cur.keydown(e);
});
window.addEventListener('keyup', e=>{
  A.keys[e.key.toLowerCase()]=false;
  if(state==='play' && cur && cur.keyup) cur.keyup(e);
});
window.addEventListener('blur', ()=>{ for(const k in A.keys) A.keys[k]=false; });
document.addEventListener('visibilitychange', ()=>{ if(document.hidden && state==='play') pause(); });

/* ---------- loop ---------- */
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min((now-last)/1000 || 0, 0.045);
  last = now;

  shake = Math.max(0, shake - dt*3.2);
  ctx.setTransform(DPR,0,0,DPR,0,0);

  if(state==='menu' || !cur){ rainDraw(dt); return; }

  const sx = shake? rnd(-1,1)*shake*5 : 0, sy = shake? rnd(-1,1)*shake*5 : 0;
  if(state==='play'){ cur.update(dt); updateParts(dt); }

  ctx.save();
  ctx.translate(sx,sy);
  ctx.fillStyle=COL.ground; ctx.fillRect(-10,-10,W+20,H+20);
  cur.draw(dt);
  drawParts();
  ctx.restore();
}

/* ---------- público ---------- */
window.Arcade = {
  register(g){ if(!g.fmt) g.fmt = v=>String(Math.round(v)); games.push(g); },
  boot(){
    resize();
    rainInit();
    menu();
    requestAnimationFrame(t=>{ last=t; requestAnimationFrame(frame); });
  },
  best,
  launch(id){ const g=games.find(x=>x.id===id); if(g) launch(g); },
  menu(){ menu(); },
  find(id){ return games.find(x=>x.id===id); },
  resize
};
})();
