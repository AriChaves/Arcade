/* Ahorcado — adivina la palabra */
(function(){
"use strict";
let A, W, H;
const WORDS=['MONOPOLY','FORMULA','ESCUDERIA','PILOTO','CAMPEONATO','DETECTIVE','MANSION','CANDELABRO','BIBLIOTECA','REVOLVER','ASESINATO','MISTERIO','COCINA','TERRAZA','ARCADE','TECLADO','PANTALLA','GUITARRA','MARIPOSA','CHOCOLATE','ELEFANTE','MONTAÑA','VOLCAN','PLAYA','TORTUGA','HELADO','BICICLETA','CAFETERA','ESTRELLA','DINOSAURIO','PIRATA','TESORO','CASTILLO','DRAGON','ARCOIRIS','PELICULA','CANCION','VENTANA','JIRAFA','PALOMITAS','CUMPLEAÑOS','VACACIONES','SEMAFORO','MERCADO','AVENTURA','GALLETA','ZAPATO','RELAMPAGO','PINGUINO','HAMACA'];
const KEYS='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
const MAX=6;
let word, used, bad, solved, streak, over, msg, msgT, kb, waitT;
function layout(){ const cols=9, kw=Math.min(44,Math.floor((W-20)/cols)), kh=Math.min(40,Math.floor((H-46)*0.13));
  const x0=(W-kw*cols)/2, y0=H-kh*3-8; kb=KEYS.map((k,i)=>({k,x:x0+(i%cols)*kw,y:y0+Math.floor(i/cols)*kh,w:kw-4,h:kh-4})); }
function newWord(){ let w; do{ w=A.pick(WORDS); }while(w===word); word=w; used=new Set(); bad=0; waitT=0; }
function guess(L){ if(over||waitT>0||used.has(L)) return; used.add(L);
  if(word.includes(L)){ if([...word].every(c=>used.has(c))){ solved++; streak++; msg='¡adivinaste! '+word; msgT=1.6; waitT=1.6; A.burst(W/2,H*0.45,'#5FD6C0',16); } }
  else { bad++; A.shake(0.4); if(bad>=MAX){ over=true; msg='era '+word; msgT=9;
    A.end({score:solved, rows:[[solved,'palabras'],[word,'la palabra era']]}); } } }
const game={
  id:'hangman', name:'Ahorcado', accent:'#F09A6B',
  desc:'Adivina la palabra letra por letra antes de completar el muñeco.',
  keys:'escribe letras con el teclado · o tócalas en pantalla',
  overTitle:'Te ahorcaron', fmt:v=>Math.round(v)+' palabras',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='hangman'||!kb) return; const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
      const k=kb.find(k=>x>=k.x&&x<=k.x+k.w&&y>=k.y&&y<=k.y+k.h); if(k) guess(k.k); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); solved=0; streak=0; over=false; msgT=0; word=''; newWord(); },
  keydown(e){ const L=e.key.toUpperCase(); if(L.length===1&&KEYS.includes(L)) guess(L); },
  update(dt){ if(msgT>0) msgT-=dt; if(waitT>0){ waitT-=dt; if(waitT<=0) newWord(); }
    A.hud([solved+' palabras','fallos '+bad+'/'+MAX]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const top=50, gh=Math.max(70,kb[0].y-top-46), gx=Math.max(30,W*0.12), s=gh/100;
    ctx.strokeStyle='rgba(126,154,158,.8)'; ctx.lineWidth=3; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(gx-20*s,top+gh); ctx.lineTo(gx+30*s,top+gh); ctx.moveTo(gx,top+gh); ctx.lineTo(gx,top); ctx.lineTo(gx+45*s,top); ctx.lineTo(gx+45*s,top+12*s); ctx.stroke();
    ctx.strokeStyle='#EE7563'; const hx=gx+45*s, hy=top+22*s;
    if(bad>0){ ctx.beginPath(); ctx.arc(hx,hy,10*s,0,6.283); ctx.stroke(); }
    const seg=[[hx,hy+10*s,hx,hy+45*s],[hx,hy+20*s,hx-15*s,hy+35*s],[hx,hy+20*s,hx+15*s,hy+35*s],[hx,hy+45*s,hx-13*s,hy+65*s],[hx,hy+45*s,hx+13*s,hy+65*s]];
    for(let i=0;i<bad-1&&i<seg.length;i++){ const q=seg[i]; ctx.beginPath(); ctx.moveTo(q[0],q[1]); ctx.lineTo(q[2],q[3]); ctx.stroke(); }
    const n=word.length, room=W-(gx+70*s)-10, lw=Math.min(30,room/n), wx=gx+70*s+(room-lw*n)/2+lw/2, wy=top+gh*0.55;
    [...word].forEach((c,i)=>{ const x=wx+i*lw; ctx.strokeStyle='rgba(126,154,158,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x-lw*0.38,wy+lw*0.55); ctx.lineTo(x+lw*0.38,wy+lw*0.55); ctx.stroke();
      if(used.has(c)||over) A.text(c,x,wy,Math.min(24,lw*0.8),used.has(c)?'#E9F2EF':'#EE7563',700); });
    for(const k of kb){ const u=used.has(k.k), ok=u&&word.includes(k.k);
      ctx.fillStyle=u?(ok?'rgba(95,214,192,.25)':'rgba(13,26,30,.6)'):'rgba(25,48,54,1)'; A.roundRect(k.x,k.y,k.w,k.h,6); ctx.fill();
      A.text(k.k,k.x+k.w/2,k.y+k.h/2+1,Math.min(16,k.h*0.5),u?(ok?'#5FD6C0':'rgba(126,154,158,.4)'):'#E9F2EF',700); }
    if(msgT>0) A.text(msg,W/2,kb[0].y-16,12,'rgba(233,242,239,'+A.clamp(msgT,0,1)+')',700); }
};
window.Arcade.register(game);
})();
