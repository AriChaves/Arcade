/* Sopa de letras — encuentra las palabras escondidas */
(function(){
"use strict";
let A, W, H;
const N=9, PER=6;
const THEMES=[
  ['Animales',['PERRO','GATO','LEON','TIGRE','CABALLO','VACA','OVEJA','CONEJO','RATON','PATO','MONO','LORO']],
  ['Frutas',['MANZANA','PERA','UVA','MANGO','BANANO','FRESA','MELON','SANDIA','KIWI','LIMON','NARANJA','COCO']],
  ['Colores',['ROJO','AZUL','VERDE','AMARILLO','NEGRO','BLANCO','ROSADO','MORADO','GRIS','CAFE','CELESTE']],
  ['Comida',['ARROZ','FRIJOL','TORTILLA','QUESO','PAN','SOPA','HUEVO','CARNE','POLLO','PASTA','TAMAL']],
  ['La casa',['MESA','SILLA','CAMA','PUERTA','VENTANA','SOFA','LAMPARA','COCINA','BANO','TECHO','PISO']],
  ['Escuela',['LAPIZ','LIBRO','CUADERNO','MAESTRO','PIZARRA','REGLA','BORRADOR','MOCHILA','CLASE','TIZA']],
  ['Deportes',['FUTBOL','TENIS','BEISBOL','BOXEO','GOLF','RUGBY','CICLISMO','KARATE','SURF','REMO']],
  ['El clima',['SOL','LLUVIA','NUBE','VIENTO','TRUENO','RAYO','NIEVE','CALOR','FRIO','NIEBLA']],
  ['Cuerpo',['MANO','PIE','CABEZA','BRAZO','PIERNA','OJO','BOCA','NARIZ','OREJA','DEDO','RODILLA']],
  ['Naturaleza',['ARBOL','FLOR','RIO','MAR','MONTANA','PLAYA','BOSQUE','VOLCAN','LAGO','PIEDRA','HOJA']]
];
const DIRS=[[0,1],[1,0],[1,1],[-1,1]];
const ABC='ABCDEFGHIJLMNOPRSTUV';
let grid, words, found, theme, total, grids, over, endT, sel, drag, cr, cc, cell, ox, oy, lx, msg, msgT, hover, order, flash;
function layout(){ cell=Math.floor(Math.min((H-58)/N,(W-110)/N,50)); const gw=cell*N, lw=Math.min(190,Math.max(86,W-gw-36));
  ox=Math.round((W-gw-lw-14)/2); oy=52+Math.round((H-56-gw)/2); lx=ox+gw+14; }
function build(){
  if(!order||!order.length){ order=THEMES.map((_,i)=>i); for(let i=order.length-1;i>0;i--){ const j=A.ri(i+1); [order[i],order[j]]=[order[j],order[i]]; } }
  const th=THEMES[order.pop()]; theme=th[0];
  for(let tries=0;tries<200;tries++){
    const pool=th[1].slice(); for(let i=pool.length-1;i>0;i--){ const j=A.ri(i+1); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    const g=Array.from({length:N},()=>new Array(N).fill('')); const ws=[];
    for(const w of pool){ if(ws.length>=PER) break; let ok=false;
      for(let k=0;k<80&&!ok;k++){ const [dr,dc]=A.pick(DIRS), r0=A.ri(N), c0=A.ri(N), r1=r0+dr*(w.length-1), c1=c0+dc*(w.length-1);
        if(r1<0||r1>=N||c1<0||c1>=N) continue; let fit=true;
        for(let i=0;i<w.length;i++){ const ch=g[r0+dr*i][c0+dc*i]; if(ch&&ch!==w[i]){ fit=false; break; } }
        if(!fit) continue; for(let i=0;i<w.length;i++) g[r0+dr*i][c0+dc*i]=w[i];
        ws.push({w,r0,c0,r1,c1,found:false}); ok=true; } }
    if(ws.length===PER){ for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(!g[r][c]) g[r][c]=ABC[A.ri(ABC.length)];
      grid=g; words=ws; break; } }
  found=0; sel=null; drag=false; grids++;
}
function tryPick(a,z){
  if(!a||!z) return; if(a.r===z.r&&a.c===z.c){ return; }
  const dr=Math.sign(z.r-a.r), dc=Math.sign(z.c-a.c), len=Math.max(Math.abs(z.r-a.r),Math.abs(z.c-a.c))+1;
  if(Math.abs(z.r-a.r)&&Math.abs(z.c-a.c)&&Math.abs(z.r-a.r)!==Math.abs(z.c-a.c)){ msg='en línea recta'; msgT=1; return; }
  let s=''; for(let i=0;i<len;i++) s+=grid[a.r+dr*i][a.c+dc*i];
  const rev=s.split('').reverse().join('');
  const w=words.find(w=>!w.found&&(w.w===s||w.w===rev));
  if(w){ w.found=true; w.r0=a.r; w.c0=a.c; w.r1=z.r; w.c1=z.c; found++; total++; msg='¡'+w.w+'!'; msgT=1.2; A.burst(ox+(z.c+.5)*cell,oy+(z.r+.5)*cell,'#FFCE5C',12);
    if(found===PER){ msg='¡sopa completa!'; msgT=2; flash=1; over=true; sel=null; endT=1.2; } }
  else { msg='no es una palabra'; msgT=1; A.shake(0.15); }
}
function cellAt(x,y){ const c=Math.floor((x-ox)/cell), r=Math.floor((y-oy)/cell); return (r>=0&&r<N&&c>=0&&c<N)?{r,c}:null; }
function pos(e,cv){ const R=cv.getBoundingClientRect(); return [e.clientX-R.left,e.clientY-R.top]; }
const game={
  id:'wordsearch', name:'Sopa de letras', accent:'#FFCE5C',
  desc:'Encuentra las 6 palabras escondidas, sin reloj y con calma.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> marca la primera y la última letra · o toca (o arrastra) de la primera a la última letra',
  overTitle:'¡Sopa completa!', fmt:v=>Math.round(v)+' palabras',
  init(api){ A=api; const cv=document.getElementById('c'); this._cv=cv;
    /* dragging over the grid must not scroll the page; give the canvas back to other games */
    window.addEventListener('pointerdown',()=>{ if(window.__padGame!=='wordsearch'&&cv.dataset.wsTouch){ cv.style.touchAction=''; delete cv.dataset.wsTouch; } },true);
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='wordsearch'||!grid||over) return; const [x,y]=pos(e,cv), p=cellAt(x,y); if(!p) return;
      cr=p.r; cc=p.c;
      if(!sel){ sel=p; drag=true; } else { const a=sel; sel=null; drag=false; tryPick(a,p); } });
    cv.addEventListener('pointermove',e=>{ if(window.__padGame!=='wordsearch'||!grid||!sel) return; const [x,y]=pos(e,cv); hover=cellAt(x,y); });
    cv.addEventListener('pointerup',e=>{ if(window.__padGame!=='wordsearch'||!grid||over||!drag) return; drag=false; const [x,y]=pos(e,cv), p=cellAt(x,y);
      if(p&&sel&&(p.r!==sel.r||p.c!==sel.c)){ const a=sel; sel=null; cr=p.r; cc=p.c; tryPick(a,p); } }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ if(this._cv){ this._cv.style.touchAction='none'; this._cv.dataset.wsTouch='1'; } W=A.W; H=A.H; layout(); order=null; grids=0; total=0; over=false; endT=0; flash=0; hover=null; build(); cr=4; cc=4; msg='marca la primera y la última letra'; msgT=2.5; },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return;
    if(k==='arrowleft'||k==='a') cc=(cc+N-1)%N; else if(k==='arrowright'||k==='d') cc=(cc+1)%N;
    else if(k==='arrowup'||k==='w') cr=(cr+N-1)%N; else if(k==='arrowdown'||k==='s') cr=(cr+1)%N;
    else if(k===' '||k==='spacebar'||k==='enter'){ const p={r:cr,c:cc}; if(!sel) sel=p; else { const a=sel; sel=null; tryPick(a,p); } return; }
    else if(k==='escape'||k==='x'||k==='backspace'){ sel=null; return; }
    if(sel) hover={r:cr,c:cc}; },
  update(dt){ if(msgT>0) msgT-=dt; if(flash>0) flash-=dt*2;
    if(over&&endT>0){ endT-=dt; if(endT<=0){ endT=-1; A.end({score:total, rows:[[total+'/'+PER,'palabras'],[theme,'tema']]}); } }
    A.hud([found+'/'+PER+' palabras', theme]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const gw=cell*N;
    ctx.fillStyle='rgba(18,36,41,.95)'; A.roundRect(ox-4,oy-4,gw+8,gw+8,8); ctx.fill();
    if(flash>0){ ctx.strokeStyle='rgba(255,206,92,'+flash+')'; ctx.lineWidth=3; ctx.stroke(); }
    /* found words: capsules */
    const cap=(r0,c0,r1,c1,col)=>{ ctx.strokeStyle=col; ctx.lineCap='round'; ctx.lineWidth=cell*0.72;
      ctx.beginPath(); ctx.moveTo(ox+(c0+.5)*cell,oy+(r0+.5)*cell); ctx.lineTo(ox+(c1+.5)*cell,oy+(r1+.5)*cell); ctx.stroke(); ctx.lineCap='butt'; };
    for(const w of words) if(w.found) cap(w.r0,w.c0,w.r1,w.c1,'rgba(111,224,176,.32)');
    if(sel){ const h=hover||{r:cr,c:cc}; cap(sel.r,sel.c,h.r,h.c,'rgba(255,206,92,.3)'); cap(sel.r,sel.c,sel.r,sel.c,'rgba(255,206,92,.55)'); }
    if(!over){ ctx.strokeStyle='rgba(158,216,255,.8)'; ctx.lineWidth=1.5; ctx.strokeRect(ox+cc*cell+2,oy+cr*cell+2,cell-4,cell-4); }
    const fs=Math.max(12,cell*0.5);
    for(let r=0;r<N;r++) for(let c=0;c<N;c++) A.text(grid[r][c],ox+(c+.5)*cell,oy+(r+.5)*cell+1,fs,'#E9F2EF',600);
    /* word list */
    ctx.textAlign='left';
    const lsz=Math.max(10,Math.min(15,(W-lx-6)/9.5)), lh=Math.min(30,gw/(PER+1.6));
    A.text(theme,lx,oy+8,Math.max(10,lsz-1),'#FFCE5C',700);
    words.forEach((w,i)=>{ const y=oy+lh*(i+1.4)+4; A.text(w.w,lx,y,lsz,w.found?'#4B6A6E':'#E9F2EF',w.found?400:600);
      if(w.found){ ctx.strokeStyle='#6FE0B0'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(lx-2,y); ctx.lineTo(lx+ctx.measureText(w.w).width+2,y); ctx.stroke(); } });
    ctx.textAlign='center';
    if(msgT>0){ const a=A.clamp(msgT,0,1), mw=W-lx-6; ctx.textAlign='left'; ctx.font='700 11px "JetBrains Mono", monospace';
      const lines=[]; let ln=''; for(const wd of msg.split(' ')){ const t=ln?ln+' '+wd:wd; if(ctx.measureText(t).width>mw&&ln){ lines.push(ln); ln=wd; } else ln=t; } if(ln) lines.push(ln);
      lines.forEach((l,i)=>A.text(l,lx,oy+gw-6-(lines.length-1-i)*14,11,'rgba(255,206,92,'+a+')',700)); ctx.textAlign='center'; }
  }
};
window.Arcade.register(game);
})();
