/* Palabra secreta — Wordle en español */
(function(){
"use strict";
let A, W, H;
let run=0;
function later(fn,ms){ const tok=run; setTimeout(()=>{ var o=document.getElementById("over"); if(tok===run&&!(o&&!o.classList.contains("hide")&&o.querySelector(".card"))) fn(); },ms); }
const WORDS=('ABRIR ACERO ACTOR AGUJA AHORA ALDEA ALTAR AMIGO ANCHO ANIMO ANTES APOYO ARBOL ARENA ARROZ ATRAS AUDIO AVION AYUDA '+
 'BAILE BAJAR BANCO BARCO BEBER BESAR BLUSA BOLSA BOTON BRAZO BRISA BUENO BURRO BUSCA CABLE CABRA CAJON CALLE CALMA CALOR '+
 'CAMPO CANAL CANTO CARNE CARRO CARTA CAUSA CEBRA CERCA CERDO CESTA CHICO CIELO CINCO CINTA CLARO CLASE CLAVO COCHE COLOR '+
 'COMER CONDE COPIA CORAL CORTE COSTA CREMA CRUCE CUERO CULPA CURSO DANZA DEBER DECIR DEDOS DISCO DOLOR DUCHA DULCE '+
 'ENERO ENTRE ERROR ESTAR FALDA FALTA FAROL FECHA FELIZ FERIA FIBRA FIRMA FLACO FLOJO FLOTA FONDO FORMA FRASE FRENO FRESA '+
 'FRUTA FUEGO FUERA FUMAR GANSO GARRA GATOS GENTE GLOBO GOLPE GORRA GOTAS GRANO GRASA GRIPE GRUPO GUSTO HABER HACER HIELO '+
 'HIGOS HOJAS HONGO HORNO HOTEL HUEVO HUMOR IDEAS IGUAL ISLAS JARRA JAULA JOVEN JUEGO JUGAR JUNIO JUNTO LABIO LAPIZ LARGO '+
 'LECHE LEGAL LEJOS LENTO LETRA LIBRO LIMON LINDO LISTA LLAMA LLAVE LLENO LOCAL LUCHA LUGAR MADRE MAGIA MANGO MANTA '+
 'MARCO MARZO MAYOR MEDIO MENTE MESAS METAL METRO MIEDO MISMO MONTE MORAL MOTOR MUNDO MUSEO NACER NADAR NARIZ NAVES NEGRO '+
 'NIEVE NIVEL NOCHE NORTE NOVIA NUBES NUEVO OBRAS OLIVO ONDAS ORDEN OVEJA PADRE PAGAR PAPEL PARED PARTE PASTO PATIO PECHO '+
 'PEDAL PELEA PERRO PIANO PIEZA PILAS PINTA PISTA PLANO PLATO PLAYA PLAZA PLUMA POBRE POEMA POLLO PRADO PRIMO PUNTO QUESO '+
 'RADIO RAMOS RATON RAYOS REINA RELOJ RESTO RITMO ROBOT ROCAS RUEDA RUIDO SABER SALSA SALTO SALUD SANTO SELVA SEÑOR SIGLO '+
 'SILLA SOBRE SOLAR SUAVE SUELO SUEÑO TABLA TARDE TARTA TECHO TEMPO TIGRE TIRAR TORRE TRAJE TRIGO TUBOS TURNO UNION VACIO '+
 'VALLE VAPOR VASOS VELAS VERDE VIAJE VIEJO VISTA VIVIR VOTAR YEGUA ZORRO ZUMOS AÑEJO NIÑOS BAÑOS MOÑOS PIÑAS').split(' ').filter(w=>[...w].length===5);
const ROWS=['QWERTYUIOP','ASDFGHJKLÑ','<ZXCVBNM>'];
const LET='ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
let secret, rows, cur, row, marks, keyState, solved, over, wait, msg, msgT, kb, tile, gx, gy, shakeRow, flip, lastSecret;

function layout(){
  const kh=Math.max(26,Math.min(44,Math.floor((H-46)*0.115)));
  const kw=Math.min(52,Math.floor((W-16)/10));
  const y0=H-kh*3-8;
  kb=[];
  ROWS.forEach((r,ri)=>{
    const keys=[...r]; let total=0; const ws=keys.map(k=>k==='<'||k==='>'?kw*1.5:kw); total=ws.reduce((a,b)=>a+b,0);
    let x=(W-total)/2;
    keys.forEach((k,i)=>{ kb.push({k:k==='<'?'ENTER':k==='>'?'BACK':k, x:x+2, y:y0+ri*kh, w:ws[i]-4, h:kh-4}); x+=ws[i]; });
  });
  const avail=y0-52-8;
  tile=Math.floor(Math.min(avail/6, (W-20)/5, 58));
  gx=Math.round((W-tile*5)/2); gy=Math.round(50+(avail-tile*6)/2);
}
function newWord(){
  let w; do{ w=A.pick(WORDS); }while(w===lastSecret); secret=w; lastSecret=w;
  rows=[]; marks=[]; cur=''; row=0; keyState={}; wait=false; flip=0;
}
function score(g){
  const res=new Array(5).fill(0), s=[...secret], gg=[...g], left={};
  for(let i=0;i<5;i++){ if(gg[i]===s[i]) res[i]=2; else left[s[i]]=(left[s[i]]||0)+1; }
  for(let i=0;i<5;i++){ if(res[i]===2) continue; if(left[gg[i]]>0){ res[i]=1; left[gg[i]]--; } }
  return res;
}
function type(k){
  if(over||wait) return;
  if(k==='BACK'){ cur=[...cur].slice(0,-1).join(''); return; }
  if(k==='ENTER'){ submit(); return; }
  if(LET.includes(k)&&[...cur].length<5) cur+=k;
}
function submit(){
  if([...cur].length<5){ msg='faltan letras'; msgT=1; shakeRow=0.4; return; }
  const m=score(cur); rows.push(cur); marks.push(m); flip=1;
  [...cur].forEach((L,i)=>{ keyState[L]=Math.max(keyState[L]===undefined?-1:keyState[L], m[i]); });
  const g=cur; cur=''; row++;
  if(g===secret){
    solved++; wait=true; msg=['¡genial!','¡excelente!','¡muy bien!','¡bien!','¡uf!','¡justo!'][row-1]; msgT=1.6;
    A.burst(W/2,gy+tile*(row-0.5),'#6FE0B0',18);
    later(()=>{ if(!over) newWord(); },1700);
  } else if(row>=6){
    over=true; msg='era '+secret; msgT=9; A.shake(0.6);
    later(()=>A.end({score:solved, rows:[[solved,'palabras seguidas'],[secret,'la palabra era']]}),1600);
  }
}
const COLR=['rgba(37,69,77,.95)','rgba(255,206,92,.85)','rgba(95,214,192,.9)'];
const game={
  id:'wordle', name:'Palabra secreta', accent:'#5FD6C0',
  desc:'Adivina la palabra de 5 letras en 6 intentos; verde va bien, amarillo está en otro lugar.',
  keys:'escribe letras · <kbd>Enter</kbd> enviar · <kbd>Retroceso</kbd> borrar · o toca el teclado en pantalla',
  overTitle:'Se acabaron los intentos', fmt:v=>Math.round(v)+(Math.round(v)===1?' palabra':' palabras'),
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='wordle'||!kb) return; const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
      const k=kb.find(k=>x>=k.x-2&&x<=k.x+k.w+2&&y>=k.y-2&&y<=k.y+k.h+2); if(k) type(k.k); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); solved=0; over=false; msgT=0; shakeRow=0; lastSecret=''; newWord(); msg='adivina la palabra'; msgT=1.8; },
  keydown(e){ const k=e.key;
    if(k==='Enter') type('ENTER'); else if(k==='Backspace'||k==='Delete') { e.preventDefault&&e.preventDefault(); type('BACK'); }
    else if(k.length===1){ const L=k.toUpperCase(); if(LET.includes(L)) type(L); } },
  dbg(){ return {secret, kb:kb.map(k=>({k:k.k,x:k.x+k.w/2,y:k.y+k.h/2})), row}; },
  update(dt){ if(msgT>0) msgT-=dt; if(shakeRow>0) shakeRow-=dt; if(flip>0) flip=Math.max(0,flip-dt*2.5);
    A.hud([solved+' palabras', 'intento '+Math.min(row+1,6)+'/6']); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(let r=0;r<6;r++) for(let c=0;c<5;c++){
      let x=gx+c*tile, y=gy+r*tile, L='', st=-1;
      if(r<rows.length){ L=[...rows[r]][c]; st=marks[r][c]; }
      else if(r===rows.length){ L=[...cur][c]||''; if(shakeRow>0) x+=Math.sin(shakeRow*60)*5; }
      if(over&&r===rows.length&&!L){ }
      let hgt=tile-4;
      if(r===rows.length-1&&flip>0){ hgt*=Math.abs(Math.cos(flip*Math.PI)); }
      if(st>=0){ ctx.fillStyle=COLR[st]; A.roundRect(x+2,y+2+(tile-4-hgt)/2,tile-4,Math.max(1,hgt),6); ctx.fill(); }
      else { ctx.strokeStyle=L?'rgba(126,154,158,.9)':'rgba(37,69,77,1)'; ctx.lineWidth=2; A.roundRect(x+3,y+3,tile-6,tile-6,6); ctx.stroke(); }
      if(L) A.text(L,x+tile/2,y+tile/2+1,Math.max(12,tile*0.5),st>0?'#0D1A1E':'#E9F2EF',700);
    }
    for(const k of kb){ const s=keyState[k.k];
      ctx.fillStyle=s===undefined?'rgba(37,69,77,1)':s===2?'rgba(95,214,192,.9)':s===1?'rgba(255,206,92,.85)':'rgba(13,26,30,.8)';
      if(k.k==='ENTER') ctx.fillStyle='rgba(95,214,192,.3)';
      A.roundRect(k.x,k.y,k.w,k.h,6); ctx.fill();
      const lab=k.k==='ENTER'?'Enviar':k.k==='BACK'?'Borrar':k.k;
      const fs=lab.length>1?Math.max(10,Math.min(13,k.w/5.4)):Math.max(11,Math.min(17,k.h*0.48));
      A.text(lab,k.x+k.w/2,k.y+k.h/2+1,fs,s===2||s===1?'#0D1A1E':s===0?'rgba(126,154,158,.5)':'#E9F2EF',700); }
    if(msgT>0){ const a=A.clamp(msgT,0,1), y=gy+tile*3, w=Math.min(W-20,220);
      ctx.globalAlpha=a; ctx.fillStyle='rgba(13,26,30,.92)'; A.roundRect(W/2-w/2,y-17,w,34,10); ctx.fill();
      ctx.strokeStyle='#5FD6C0'; ctx.lineWidth=1; ctx.stroke(); A.text(msg,W/2,y+1,14,'#E9F2EF',700); ctx.globalAlpha=1; } }
};
window.Arcade.register(game);
})();
