/* On-screen controls for phones while a game runs. Buttons send the same keys as a keyboard. */
(function(){
"use strict";
var touch=matchMedia("(pointer:coarse)").matches||("ontouchstart" in window)||/[?&]touch=1/.test(location.search);
if(touch){
document.body.classList.add("touch");
var nums=function(a,b){var r=[];for(var i=a;i<=b;i++)r.push({t:String(i),k:String(i),c:"num"});return r};
var PADS={
  p2048:{dpad:1,acts:[{t:"Nuevo",k:"r"}],hint:"Desliza con las flechas"},
  deploy:{dpad:0,acts:[{t:"▼ Deslizar",k:"ArrowDown",c:"big"},{t:"▲ Saltar",k:" ",c:"big"}],hint:"Dos toques = doble salto"},
  gc:{dpad:1,acts:[],hint:"Gira con las flechas"},
  merge:{dpad:1,acts:[{t:"Dash",k:" ",c:"big"}].concat(nums(1,3)).concat([{t:"Otra vez",k:"r"}]),hint:"1, 2, 3 eligen mejora"},
  mines:{dpad:1,acts:[{t:"Destapar",k:" ",c:"big"},{t:"⚑ Bandera",k:"f"},{t:"Abrir",k:"c"}],hint:"Mueve el cuadro con las flechas"},
  nullptr:{dpad:1,acts:[{t:"Disparar",k:" ",c:"big"}],hint:"◀ ▶ giran · ▲ empuja"},
  pipeline:{dpad:1,acts:nums(1,4).concat([{t:"Quitar",k:"x"},{t:"Oleada",k:"Enter"}]),hint:"1–4 construyen o mejoran"},
  race:{dpad:1,acts:[],hint:"Esquiva con las flechas"},
  refactor:{dpad:1,acts:[{t:"Sacar / disparar",k:" ",c:"big"}],hint:"◀ ▶ mueven la paleta"},
  tetris:{dpad:1,acts:[{t:"↻ Girar",k:"ArrowUp",c:"big",n:1},{t:"Soltar",k:" "}],hint:"◀ ▶ mueven · ▼ baja"},
  flappy:{dpad:0,acts:[{t:"▲ Subir",k:" ",c:"big"}],hint:"Toca para subir"},
  pong:{dpad:1,acts:[],hint:"▲ ▼ mueven tu paleta · en 2P cada quien arrastra en su mitad"},
  invaders:{dpad:1,acts:[{t:"Disparar",k:" ",c:"big"}],hint:"◀ ▶ mueven"},
  memory:{dpad:1,acts:[{t:"Voltear",k:" ",c:"big"}],hint:"También puedes tocar las cartas"},
  connect4:{dpad:1,acts:[{t:"Soltar ficha",k:" ",c:"big",n:1}],hint:"◀ ▶ eligen · o toca la columna"},
  gato:{dpad:1,acts:[{t:"Marcar",k:" ",c:"big",n:1}],hint:"O toca la casilla"},
  simon:{dpad:0,acts:[],hint:"Toca los colores"},
  whack:{dpad:0,acts:[],hint:"Toca los bugs, no el café"},
  frogger:{dpad:1,acts:[],hint:"Las flechas saltan"},
  hangman:{dpad:0,acts:[],hint:"Toca las letras"},
  pacman:{dpad:1,acts:[],hint:"Las flechas cambian de dirección"},
  jump:{dpad:0,acts:[{t:"◀",k:"ArrowLeft",c:"big"},{t:"▶",k:"ArrowRight",c:"big"}],hint:"Mantén apretado para moverte"},
  stack:{dpad:0,acts:[{t:"Soltar",k:" ",c:"big",n:1}],hint:"O toca el juego"},
  rps:{dpad:0,acts:[],hint:"Toca tu jugada"},
  lights:{dpad:1,acts:[{t:"Pulsar",k:" ",c:"big",n:1}],hint:"Toca las casillas o usa las flechas"},
  hanoi:{dpad:0,acts:[{t:"1",k:"1",c:"num",n:1},{t:"2",k:"2",c:"num",n:1},{t:"3",k:"3",c:"num",n:1}],hint:"Toca una torre para tomar y otra para soltar"},
  slide15:{dpad:1,acts:[],hint:"Toca una ficha junto al hueco o usa las flechas"},
  wordle:{dpad:0,acts:[],hint:"Escribe con el teclado de la pantalla"},
  naval:{dpad:1,acts:[{t:"Disparar",k:" ",c:"big",n:1}],hint:"Toca el tablero enemigo para disparar"},
  heli:{dpad:0,acts:[{t:"▲ Subir (mantén)",k:" ",c:"big",n:1}],hint:"Mantén apretado para subir"},
  racer:{dpad:0,acts:[{t:"◀",k:"ArrowLeft",c:"big",n:1},{t:"▶",k:"ArrowRight",c:"big",n:1}],hint:"Toca un lado o usa ◀ ▶"},
  catcher:{dpad:0,acts:[{t:"◀",k:"ArrowLeft",c:"big"},{t:"▶",k:"ArrowRight",c:"big"}],hint:"Arrastra el dedo o usa ◀ ▶"},
  target:{dpad:1,acts:[{t:"Disparar",k:" ",c:"big",n:1}],hint:"Toca las dianas o usa la mira"},
  dodge:{dpad:0,acts:[{t:"◀",k:"ArrowLeft",c:"big"},{t:"▶",k:"ArrowRight",c:"big"}],hint:"Arrastra el dedo o usa ◀ ▶"},
  blackjack:{dpad:0,acts:[{t:"Pedir",k:"h",c:"big",n:1},{t:"Plantarse",k:"s",n:1},{t:"Doblar",k:"d",n:1}],hint:"O toca los botones del juego"},
  higherlower:{dpad:0,acts:[],hint:"Toca Mayor o Menor"},
  reversi:{dpad:1,acts:[{t:"Poner ficha",k:" ",c:"big",n:1}],hint:"O toca una casilla marcada"},
  wordsearch:{dpad:1,acts:[{t:"Marcar letra",k:" ",c:"big",n:1}],hint:"Toca la primera y la última letra"},
  mathrush:{dpad:0,acts:[],hint:"Toca la respuesta correcta"},
  'd-gato':{dpad:0,acts:[],hint:"Toca la casilla"},
  'd-connect4':{dpad:0,acts:[],hint:"Toca la columna"},
  'd-reversi':{dpad:0,acts:[],hint:"Toca una casilla marcada"},
  'd-rps':{dpad:0,acts:[],hint:"Toca tu jugada sin que la otra persona vea"},
  'd-naval':{dpad:0,acts:[],hint:"Toca el tablero de disparos"},
  'd-hangman':{dpad:0,acts:[],hint:"Toca una letra"},
  sudoku:{dpad:1,acts:nums(1,9).concat([{t:"Borrar",k:"0"},{t:"Notas",k:"n"},{t:"Pista",k:"h"}]),hint:"Mueve con las flechas y toca un número"}
};
var send=function(type,k){window.dispatchEvent(new KeyboardEvent(type,{key:k,bubbles:true,cancelable:true}))};
var bind=function(b){
  var k=b.getAttribute("data-k"),rep=null,dly=null;
  function up(){if(!b.classList.contains("on"))return;b.classList.remove("on");clearTimeout(dly);clearInterval(rep);send("keyup",k)}
  b.addEventListener("pointerdown",function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(_){}b.classList.add("on");send("keydown",k);
    if(k!=="Escape"&&b.dataset.norep!=="1")dly=setTimeout(function(){rep=setInterval(function(){send("keydown",k)},110)},380)});
  b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);b.addEventListener("lostpointercapture",up);
  b.addEventListener("contextmenu",function(e){e.preventDefault()});
};
document.querySelectorAll(".pb[data-k]").forEach(bind);
var acts=document.getElementById("acts"),dpad=document.getElementById("dpad"),hint=document.getElementById("padHint");
window.__padSet=function(id){var p=PADS[id]||{dpad:1,acts:[{t:"Espacio",k:" ",c:"big"}],hint:""};
  dpad.style.display=p.dpad?"":"none";hint.textContent=p.hint||"";acts.innerHTML="";
  p.acts.forEach(function(a){var b=document.createElement("button");b.className="pb"+(a.c?" "+a.c:"");b.textContent=a.t;b.setAttribute("data-k",a.k);if(a.n||(a.k===" "&&(id==="deploy"||id==="flappy"||id==="tetris"||id==="memory")))b.dataset.norep="1";acts.appendChild(b);bind(b)});
  acts.style.justifyContent=p.dpad?"flex-end":"space-between"};
}
/* tell a parent page (Mesa de Juegos) how tall this is, so its frame fits */
var last=0;function report(){var h=Math.ceil(document.body.getBoundingClientRect().height);if(h!==last){last=h;try{parent.postMessage({arcadeH:h},"*")}catch(e){}}}
if(window.ResizeObserver)new ResizeObserver(report).observe(document.body);window.addEventListener("load",report);report();
document.addEventListener("pointerdown",function(){window.focus()});
})();
