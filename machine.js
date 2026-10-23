/* La máquina: pantalla de inicio y de elegir juego. Todo se maneja con el panel
   (palanca, A, B, 1P/2P/REMOTO, al azar); la pantalla no responde a toques
   hasta que el juego corre a pantalla completa. */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

/* modes: 1 = one player · 2 = two on this same device · R = remote, each on their own phone.
   `play` says which engine game runs for each mode the game supports. */
const G=(id,name,cat,accent,desc,play,desc2)=>({id,name,cat,accent,desc,desc2,play:play||{1:id}});
const GAMES=[
  G('merge','Merge Conflict','accion','#EE7563','Survivor: disparas solo, juntas tokens y armas tu build entre 17 mejoras.'),
  G('race','Race Condition','accion','#C58BFF','Bullet hell entre dos hilos. Los mutex frenan todo unos segundos.'),
  G('nullptr','Null Pointer','accion','#5FD6C0','Nave con inercia rompiendo punteros que se parten en pedazos.'),
  G('deploy','Deploy Viernes','accion','#FFCE5C','Runner de una tecla por el pipeline, cada vez más rápido.'),
  G('refactor','Refactor','accion','#9ED8FF','Breakout contra un archivo legacy, token por token.'),
  G('gc','Garbage Collector','accion','#FFCE5C','Snake en el heap, con memory leaks que se expanden solos.'),
  G('flappy','Ping','accion','#FFCE5C','Un paquete que aletea entre firewalls. Un toque para subir.'),
  G('pong','Code Review','accion','#9ED8FF','Pong contra el revisor. El primero en llegar a 7 gana.'),
  G('invaders','Bug Invaders','accion','#EE7563','Los bugs bajan en formación. Dispara antes de que lleguen a producción.'),
  G('frogger','Cruza la calle','accion','#5FD6C0','Cruza los carriles sin que te atropellen. Cada cruce va más rápido.'),
  G('pacman','Come-bugs','accion','#FFCE5C','Cómete todos los puntos del laberinto sin que te atrapen los bugs.'),
  G('jump','Sube y sube','accion','#6FE0B0','Rebota de plataforma en plataforma lo más alto que puedas.'),
  G('whack','Aplasta el bug','accion','#6FE0B0','Los bugs salen de los hoyos: aplástalos rápido, pero no al café.'),
  G('heli','Helicóptero','accion','#9ED8FF','Vuela por una cueva que se cierra. Mantén apretado para subir.'),
  G('racer','Carreras','accion','#F09A6B','Cambia de carril para esquivar autos y junta monedas.'),
  G('catcher','Atrapa la fruta','accion','#6FE0B0','Mueve la canasta para atrapar fruta. ¡Cuidado con las bombas!'),
  G('target','Tiro al blanco','accion','#EE7563','Las dianas aparecen y se encogen: dispárales antes de que desaparezcan.'),
  G('dodge','Esquiva','accion','#C58BFF','Caen bloques cada vez más seguido. Esquívalos el mayor tiempo posible.'),
  G('pipeline','Pipeline','logica','#5FD6C0','Defensa por carriles: linters, tests y type checks con presupuesto.'),
  G('sudoku','Sudoku','logica','#8FE3D0','Generado al momento, con solución única.'),
  G('p2048','2048','logica','#C58BFF','Desliza y fusiona: dos iguales hacen el siguiente.'),
  G('mines','Buscaminas','logica','#9ED8FF','El de siempre. La primera casilla nunca es mina.'),
  G('tetris','Stack Overflow','logica','#5FD6C0','Piezas que caen: completa líneas antes de que la pila llegue arriba.'),
  G('memory','Cache Hit','logica','#6FE0B0','Voltea dos cartas y encuentra los 8 pares con pocos intentos.'),
  G('simon','Simón','logica','#C58BFF','Memoriza la secuencia de colores y repítela.'),
  G('stack','La torre','logica','#9ED8FF','Suelta cada bloque justo encima del anterior. Lo que sobra se cae.'),
  G('lights','Apaga las luces','logica','#FFCE5C','Cada toque cambia la casilla y sus vecinas: apágalas todas.'),
  G('hanoi','Torres de Hanói','logica','#9ED8FF','Pasa todos los discos a la tercera torre, con movidas contadas.'),
  G('slide15','Rompecabezas 15','logica','#6FE0B0','Ordena las fichas del 1 al 15 deslizándolas hacia el hueco.'),
  G('connect4','Conecta 4','mesa','#FFCE5C','Junta cuatro en línea antes que la computadora.',{1:'connect4',2:'d-connect4',R:'d-connect4'},'Junta cuatro en línea antes que la otra persona.'),
  G('gato','Gato','mesa','#9ED8FF','Tres en línea contra la computadora. Juegas hasta perder 3 veces.',{1:'gato',2:'d-gato',R:'d-gato'},'Tres en línea por turnos. Gana quien junte tres seguidas.'),
  G('reversi','Reversi','mesa','#5FD6C0','Encierra las fichas de la computadora para voltearlas.',{1:'reversi',2:'d-reversi',R:'d-reversi'},'Encierra las fichas de la otra persona para voltearlas.'),
  G('rps','Piedra, papel o tijera','mesa','#C58BFF','Contra la computadora. Juegas hasta perder 3 veces.'),
  G('naval','Batalla naval','mesa','#F09A6B','Hunde los 5 barcos de la computadora antes de que hunda los tuyos.'),
  G('blackjack','Blackjack (21)','mesa','#6FE0B0','Llega a 21 sin pasarte y gánale a la banca.'),
  G('higherlower','Mayor o menor','mesa','#9ED8FF','¿La siguiente carta es mayor o menor? Un error y se acaba la racha.'),
  G('hangman','Ahorcado','palabras','#F09A6B','Adivina la palabra letra por letra.'),
  G('wordle','Palabra secreta','palabras','#5FD6C0','Adivina la palabra de 5 letras en 6 intentos.'),
  G('wordsearch','Sopa de letras','palabras','#FFCE5C','Encuentra las 6 palabras escondidas, con calma.'),
  G('mathrush','Cálculo rápido','palabras','#F09A6B','Elige la respuesta antes de que se acabe el tiempo.')
].filter(g=>Object.values(g.play).every(id=>window.Arcade.find(id)));

const MODES={
  1:{label:'1 JUGADOR', ready:'JUGADOR 1 · LISTO', short:'1P'},
  2:{label:'2 JUGADORES', ready:'JUGADORES 1 Y 2 · LISTOS', short:'2P', note:'en este mismo aparato'},
  R:{label:'REMOTO', ready:'REMOTO · ARMANDO SALA', short:'REMOTO', note:'cada quien en su celular'}
};
const CATS={accion:'ACCIÓN', logica:'LÓGICA', mesa:'MESA', palabras:'PALABRAS'};
const catList=m=>m==='1'
  ? [{id:'todos',label:'TODOS'},{id:'accion',label:'ACCIÓN'},{id:'logica',label:'LÓGICA'},{id:'mesa',label:'MESA'},{id:'palabras',label:'PALABRAS'}]
  : [{id:'todos',label:m==='2'?'PARA DOS · MISMO APARATO':'PARA DOS · CADA QUIEN EN SU CEL'}];

const S={screen:'attract', mode:'1', cat:0, idx:0, spinning:false, flash:'', busy:false};
(function(){ const m=store.get('ba_m'); if(MODES[m]) S.mode=m; })();
let flashT=null, spinT=null, zoomT=null;

function list(){ const c=catList(S.mode)[S.cat]||{id:'todos'};
  return GAMES.filter(g=>g.play[S.mode]&&(c.id==='todos'||g.cat===c.id)); }
function current(){ const l=list(); return l[Math.min(S.idx,l.length-1)]; }
const pad2=k=>String(k).padStart(2,'0');
const halo=a=>a+'55';
function record(g){ if(S.mode!=='1') return null; const e=window.Arcade.find(g.play[1]), b=window.Arcade.best(g.play[1]); return b&&e?e.fmt(b):'—'; }
function modeChips(g){ return ['1','2','R'].map(m=>'<span class="px'+(g.play[m]?' ok':'')+(m===S.mode?' cur':'')+'" title="'+(g.play[m]?'Se puede: ':'No se puede: ')+MODES[m].label.toLowerCase()+'">'+MODES[m].short+'</span>').join(''); }

/* ---------- pantalla ---------- */
function render(){
  const scr=$('screen');
  document.querySelectorAll('.mb').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===S.mode));
  $('rand').classList.toggle('on',S.spinning);
  let h='';
  if(S.screen==='attract'){
    const lineup=GAMES.filter((g,k)=>k%5===0).slice(0,8);
    h='<div class="scr attract"><p class="pre px">MESA DE JUEGOS PRESENTA</p><p class="big px glow">BUG<br>ARCADE</p>'+
      '<p class="call px blink">PRESIONA A</p><p class="hint">Usa la palanca y los botones del panel de abajo. 1P solo, 2P en el mismo aparato, REMOTO cada quien en su celular.</p>'+
      '<div class="lineup">'+lineup.map(g=>'<span style="color:'+g.accent+'">'+esc(g.name)+'</span>').join('')+'</div></div>';
  } else {
    const l=list(), n=l.length, i=Math.min(S.idx,n-1), g=l[i];
    const vars=x=>'--a:'+x.accent+';--h:'+halo(x.accent);
    if(S.screen==='select'){
      const side=k=>{ const x=l[(k+n)%n]; return '<div class="side" aria-hidden="true" style="'+vars(x)+'"><small>'+pad2((k+n)%n+1)+' / '+pad2(n)+'</small><b>'+esc(x.name)+'</b></div>'; };
      const rec=record(g);
      const maxD=Math.min(n,18), d0=n>maxD?Math.max(0,Math.min(i-8,n-maxD)):0; let dots='';
      for(let k=d0;k<d0+maxD;k++) dots+='<i style="width:'+(k===i?22:6)+'px;'+(k===i?'background:'+g.accent:'')+'"></i>';
      h='<div class="scr select">'+
        '<div class="shead"><span class="px" style="color:var(--gold)">BUG ARCADE</span><span class="px" style="color:var(--aqua)">'+MODES[S.mode].label+'</span></div>'+
        '<div class="cats" aria-label="Categorías">'+catList(S.mode).map((c,k)=>'<span class="'+(k===S.cat?'on':'')+'">'+c.label+'</span>').join('')+'</div>'+
        '<div class="carousel">'+(n>2?side(i-1):'')+
          '<div class="main" style="'+vars(g)+'">'+
            '<div class="row"><span class="num px">Nº '+pad2(i+1)+'</span><span class="tag">'+CATS[g.cat]+'</span></div>'+
            '<h2>'+esc(g.name)+'</h2>'+
            '<p>'+esc(S.mode==='1'?g.desc:g.desc2)+'</p>'+
            '<div class="modes" aria-label="Modos de juego">'+modeChips(g)+'</div>'+
            '<div class="row foot"><span>'+(rec!=null?'RÉCORD <b>'+esc(rec)+'</b>':esc(MODES[S.mode].note))+'</span><span class="px blink">A · JUGAR</span></div>'+
          '</div>'+(n>2?side(i+1):'')+
        '</div>'+
        '<div class="dots">'+dots+'</div>'+
        '<div class="slegend"><span>◀ ▶ ELEGIR</span><span>▲ ▼ CATEGORÍA</span><span>? AL AZAR</span><span style="color:var(--gold)">A JUGAR · B VOLVER</span></div>'+
        '</div>';
    } else {
      h='<div class="scr ready" style="'+vars(g)+'"><p class="who px">'+MODES[S.mode].ready+'</p><h2>'+esc(g.name)+'</h2>'+
        '<p>'+esc(S.mode==='1'?g.desc:g.desc2)+'</p><div class="bar"><i></i></div><p class="px blink" style="font-size:11px;color:var(--gold)">CARGANDO…</p></div>';
    }
  }
  if(S.flash) h+='<div class="flash px" role="status">'+esc(S.flash)+'</div>';
  scr.innerHTML=h;
}
function say(msg){ S.flash=msg; render(); clearTimeout(flashT); flashT=setTimeout(()=>{ S.flash=''; render(); },1400); }

/* ---------- controles ---------- */
function knob(dir){ const v={l:[-9,0],r:[9,0],u:[0,-9],d:[0,9]}[dir]||[0,0]; const k=$('knob'); k.style.transform='translate('+v[0]+'px,'+v[1]+'px)'; clearTimeout(knob.t); knob.t=setTimeout(()=>k.style.transform='',170); }
function press(id){ const b=$(id); b.classList.add('on'); clearTimeout(b._t); b._t=setTimeout(()=>b.classList.remove('on'),140); }
function nudge(dir){
  knob(dir);
  if(S.busy) return;
  if(S.screen==='attract'){ say('PRESIONA A'); return; }
  if(S.screen!=='select'||S.spinning) return;
  const n=list().length, cn=catList(S.mode).length;
  if(dir==='l') S.idx=(S.idx-1+n)%n;
  if(dir==='r') S.idx=(S.idx+1)%n;
  if(dir==='u'){ S.cat=(S.cat-1+cn)%cn; S.idx=0; }
  if(dir==='d'){ S.cat=(S.cat+1)%cn; S.idx=0; }
  if(cn===1&&(dir==='u'||dir==='d')) say('SOLO HAY UNA CATEGORÍA');
  render();
}
function pressA(){
  press('btnA');
  if(S.busy||S.spinning) return;
  if(S.screen==='attract'){ S.screen='select'; render(); return; }
  if(S.screen==='select') start();
}
function pressB(){
  press('btnB');
  if(S.screen==='ready'){ cancelStart(); return; }
  if(S.busy) return;
  if(S.screen==='select'){ S.screen='attract'; render(); }
}
function setMode(m){
  if(S.busy||S.screen==='ready'||S.mode===m) return;
  const keep=current(); S.mode=m; S.cat=0; store.set('ba_m',m);
  const l=list(), at=keep?l.indexOf(keep):-1; S.idx=at>=0?at:0;
  if(S.screen==='attract') S.screen='select';
  render(); say(MODES[m].label+(MODES[m].note?' · '+l.length+' JUEGOS':''));
}
function random(){
  if(S.busy) return;
  if(S.screen==='attract'){ say('PRESIONA A'); return; }
  if(S.screen!=='select'||S.spinning) return;
  const n=list().length; if(n<2) return;
  const target=Math.floor(Math.random()*n); let steps=14+Math.floor(Math.random()*6), delay=45;
  S.spinning=true;
  const step=()=>{ steps--;
    if(steps<=0){ S.idx=target; S.spinning=false; say('¡TE TOCÓ!'); return; }
    S.idx=(S.idx+1)%n; render(); delay=Math.min(220,delay*1.13); spinT=setTimeout(step,delay); };
  step();
}

/* ---------- acercarse a la pantalla y jugar ---------- */
/* shrink the whole machine so it fits the visible height; never below 55% so buttons stay tappable */
let fitScale=1;
function fit(){ const m=$('machine'), f=$('fit'), cab=$('cab'); if(m.hidden) return;
  const cs=getComputedStyle(m), pad=parseFloat(cs.paddingTop)+parseFloat(cs.paddingBottom);
  const h=cab.offsetHeight, avail=window.innerHeight-pad;
  fitScale=Math.max(0.55,Math.min(1,avail/h));
  f.style.transform=fitScale<1?'scale('+fitScale+')':'';
  f.style.marginBottom=fitScale<1?(-(1-fitScale)*h)+'px':''; }
window.addEventListener('resize',fit);
if(window.ResizeObserver) new ResizeObserver(fit).observe($('cab'));
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit);
function aimZoom(){ const cab=$('cab'), r=cab.getBoundingClientRect(), s=$('screen').getBoundingClientRect();
  cab.style.transformOrigin=((s.left-r.left+s.width/2)/fitScale)+'px '+((s.top-r.top+s.height/2)/fitScale)+'px'; }
function start(){
  const g=current(); if(!g) return;
  S.screen='ready'; render(); aimZoom(); $('cab').classList.add('zoom');
  clearTimeout(zoomT); zoomT=setTimeout(()=>launch(g),950);
}
function cancelStart(){ clearTimeout(zoomT); S.screen='select'; $('cab').classList.remove('zoom'); render(); }
function launch(g){
  const id=g.play[S.mode];
  window.__duoMode=S.mode==='2'?'2p':S.mode==='R'?'remoto':'';
  $('pDot').style.background=g.accent; $('pDot').style.boxShadow='0 0 10px '+g.accent;
  $('pName').textContent=g.name; $('pName').style.color=g.accent;
  $('pMode').textContent=MODES[S.mode].label+(MODES[S.mode].note?' · '+MODES[S.mode].note:'');
  $('machine').hidden=true; $('play').hidden=false; S.screen='play';
  window.Arcade.resize(); window.Arcade.launch(id);
  window.scrollTo(0,0);
}
/* engine.js calls this whenever a game goes back to the menu */
let backAt=-1e9;
function backToMachine(){
  window.__padGame=null; backAt=performance.now(); /* the Esc that got us here must not also press B */
  if(S.screen!=='play'){ render(); return; }
  S.screen='select'; $('play').hidden=true; $('machine').hidden=false; fit();
  const cab=$('cab'); cab.classList.add('instant','zoom'); render(); aimZoom();
  void cab.offsetWidth; cab.classList.remove('instant'); requestAnimationFrame(()=>cab.classList.remove('zoom'));
}
window.Arcade.onMenu=backToMachine;

$('total').textContent='MESA DE JUEGOS · '+GAMES.length+' JUEGOS';
document.querySelectorAll('.dir').forEach(b=>b.addEventListener('click',()=>nudge(b.dataset.dir)));
document.querySelectorAll('.mb').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$('rand').addEventListener('click',random);
$('btnA').addEventListener('click',pressA);
$('btnB').addEventListener('click',pressB);
$('exit').addEventListener('click',()=>window.Arcade.menu());

/* keyboard works like the panel while the machine is showing */
window.addEventListener('keydown',e=>{
  if(S.screen==='play'||performance.now()-backAt<300||e.target.closest&&e.target.closest('input,textarea')) return;
  const k=e.key.toLowerCase();
  if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button')) return; /* the button's own click handles it */
  const D={arrowleft:'l',arrowright:'r',arrowup:'u',arrowdown:'d'}[k];
  if(D){ e.preventDefault(); nudge(D); }
  else if(k==='enter'||k===' '||k==='a'){ e.preventDefault(); pressA(); }
  else if(k==='escape'||k==='backspace'||k==='b'){ e.preventDefault(); pressB(); }
  else if(k==='?'||k==='r'){ random(); }
  else if(k==='1'||k==='2'){ setMode(k); }
});
render(); fit();
})();
