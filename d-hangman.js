/* Ahorcado por turnos — Duo game. Same word for both: each right letter scores its count
   and keeps your turn; a wrong one passes it. Most points when the word is out wins. */
(function(){
"use strict";
const WORDS=['MONOPOLY','FORMULA','ESCUDERIA','PILOTO','CAMPEONATO','DETECTIVE','MANSION','CANDELABRO','BIBLIOTECA','MISTERIO','COCINA','TERRAZA','ARCADE','TECLADO','PANTALLA','GUITARRA','MARIPOSA','CHOCOLATE','ELEFANTE','MONTAÑA','VOLCAN','TORTUGA','HELADO','BICICLETA','CAFETERA','ESTRELLA','DINOSAURIO','PIRATA','TESORO','CASTILLO','DRAGON','ARCOIRIS','PELICULA','CANCION','VENTANA','JIRAFA','PALOMITAS','CUMPLEAÑOS','VACACIONES','SEMAFORO','MERCADO','AVENTURA','GALLETA','RELAMPAGO','PINGUINO','HAMACA'];
const KEYS='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''), MAX=7;
let kb=[];
function lay(W,H){ const cols=9, kw=Math.min(44,Math.floor((W-20)/cols)), kh=Math.min(40,Math.floor((H-46)*0.12));
  const x0=(W-kw*cols)/2, y0=H-kh*3-8; kb=KEYS.map((k,i)=>({k,x:x0+(i%cols)*kw,y:y0+Math.floor(i/cols)*kh,w:kw-4,h:kh-4})); }
const solved=st=>[...st.w].every(c=>st.g.includes(c));
window.Duo.register({
  id:'d-hangman', name:'Ahorcado', accent:'#F09A6B', min:2, max:2,
  desc:'Para dos: la misma palabra, letra por letra. Cada acierto suma y repites turno.',
  keys:'escribe una letra · o tócala en el teclado de la pantalla',
  resize:lay,
  newState(n,first){ return {w:WORDS[Math.floor(Math.random()*WORDS.length)], g:'', sc:[0,0], miss:0, turn:first%2}; },
  move(st,L,seat){ if(typeof L!=='string'||L.length!==1||!KEYS.includes(L)||st.g.includes(L)) return null;
    st.g+=L; const k=[...st.w].filter(c=>c===L).length;
    if(k) st.sc[seat]+=k; else { st.miss++; st.turn=1-seat; }
    return st; },
  result(st){ if(!solved(st)&&st.miss<MAX) return null; const [a,b]=st.sc;
    return {winners:a>b?[0]:b>a?[1]:[], text:a===b?'Empate · era '+st.w:null}; },
  tap(st,x,y){ const b=kb.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h); return b?b.k:null; },
  key(st,k){ const L=k.toUpperCase(); return L.length===1&&KEYS.includes(L)?L:null; },
  draw(ctx,A,st,v){ const W=v.W, H=v.H, done=!!this.result(st); ctx.textAlign='center'; ctx.textBaseline='middle';
    /* gallows */
    const gx=Math.min(W*0.18,120), gy=v.top+24, gh=Math.min(110,(kb[0].y-gy)*0.62);
    ctx.strokeStyle='#25454D'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath();
    ctx.moveTo(gx-30,gy+gh); ctx.lineTo(gx+30,gy+gh); ctx.moveTo(gx-15,gy+gh); ctx.lineTo(gx-15,gy); ctx.lineTo(gx+20,gy); ctx.lineTo(gx+20,gy+12); ctx.stroke();
    ctx.strokeStyle='#EE7563'; const hx=gx+20, hr=gh*0.11, parts=[
      ()=>{ ctx.beginPath(); ctx.arc(hx,gy+12+hr,hr,0,6.283); ctx.stroke(); },
      ()=>{ ctx.beginPath(); ctx.moveTo(hx,gy+12+hr*2); ctx.lineTo(hx,gy+gh*0.62); ctx.stroke(); },
      ()=>{ ctx.beginPath(); ctx.moveTo(hx,gy+gh*0.4); ctx.lineTo(hx-gh*0.15,gy+gh*0.5); ctx.stroke(); },
      ()=>{ ctx.beginPath(); ctx.moveTo(hx,gy+gh*0.4); ctx.lineTo(hx+gh*0.15,gy+gh*0.5); ctx.stroke(); },
      ()=>{ ctx.beginPath(); ctx.moveTo(hx,gy+gh*0.62); ctx.lineTo(hx-gh*0.13,gy+gh*0.85); ctx.stroke(); },
      ()=>{ ctx.beginPath(); ctx.moveTo(hx,gy+gh*0.62); ctx.lineTo(hx+gh*0.13,gy+gh*0.85); ctx.stroke(); },
      ()=>{ ctx.beginPath(); ctx.moveTo(hx-hr*0.5,gy+12+hr*0.6); ctx.lineTo(hx+hr*0.5,gy+12+hr*0.6); ctx.stroke(); }];
    for(let i=0;i<st.miss&&i<parts.length;i++) parts[i]();
    /* scores and turn */
    const sx=Math.max(W*0.62,gx+150);
    A.text(v.names[0]+'  '+st.sc[0],sx,gy+14,14,v.colors[0],700); A.text(v.names[1]+'  '+st.sc[1],sx,gy+38,14,v.colors[1],700);
    A.text('fallos '+st.miss+'/'+MAX,sx,gy+62,11,'#7E9A9E');
    if(!done) A.text(v.local||v.me===st.turn?'turno de '+v.names[st.turn]:'esperando a '+v.names[st.turn]+'…',sx,gy+86,12,v.colors[st.turn],700);
    /* the word */
    const wy=gy+gh+Math.max(26,(kb[0].y-gy-gh)/2), n=st.w.length, cw=Math.min(34,(W-30)/n);
    for(let i=0;i<n;i++){ const c=st.w[i], x=W/2+(i-(n-1)/2)*cw, show=st.g.includes(c)||done;
      ctx.fillStyle='#25454D'; ctx.fillRect(x-cw*0.36,wy+cw*0.45,cw*0.72,2);
      if(show) A.text(c,x,wy,cw*0.7,st.g.includes(c)?'#E9F2EF':'#EE7563',700); }
    /* keyboard */
    for(const b of kb){ const used=st.g.includes(b.k), hit=used&&st.w.includes(b.k);
      ctx.fillStyle=used?(hit?'rgba(95,214,192,.25)':'rgba(13,26,30,.6)'):'#193036'; A.roundRect(b.x,b.y,b.w,b.h,6); ctx.fill();
      A.text(b.k,b.x+b.w/2,b.y+b.h/2,Math.min(15,b.h*0.45),used?(hit?'#5FD6C0':'#3E5A60'):'#E9F2EF',700); } }
});
})();
