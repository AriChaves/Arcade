/* Duo: turn-based games for friends, on one phone or each on their own (room code).
   A Duo game is a pure state machine; this file turns it into an Arcade game
   with a lobby, turns, scores per player and an automatic rematch. */
(function(){
"use strict";
const SEAT_COL=['#5FD6C0','#EE7563','#FFCE5C','#C58BFF'];
const CODE_ABC='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
const uid=(()=>{let u=store.get('duo_uid');if(!u){u='';for(let i=0;i<14;i++)u+=CODE_ABC[Math.floor(Math.random()*CODE_ABC.length)].toLowerCase();store.set('duo_uid',u)}return u})();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));

/* ---------- bridge to the parent page's shared database ---------- */
const Net=(()=>{
  const inFrame=window.parent&&window.parent!==window;
  let ok=null, waiters=[], seq=0; const subs={}, pend={};
  function post(m){try{window.parent.postMessage(Object.assign({duo:1},m),'*')}catch(e){}}
  window.addEventListener('message',e=>{
    if(e.source!==window.parent) return; const m=e.data; if(!m||m.duo!==1) return;
    if(m.t==='hello'){ ok=!!m.ok; waiters.splice(0).forEach(f=>f(ok)); }
    else if(m.t==='snap'&&subs[m.id]) subs[m.id](m.data);
    else if(m.t==='done'&&pend[m.id]){ const p=pend[m.id]; delete pend[m.id]; m.ok?p.res(m.data):p.rej(m.code||'error'); }
  });
  /* standalone page: talk to this page's own shared database directly */
  let db=null;
  const code=e=>(e&&e.code)||'error';
  const local={
    get:p=>db.doc(p).get().then(s=>s.exists?s.data():null,e=>Promise.reject(code(e))),
    set:(p,d)=>db.doc(p).set(d).catch(e=>Promise.reject(code(e))),
    update:(p,d)=>db.doc(p).update(d).catch(e=>Promise.reject(code(e))),
    del:p=>db.doc(p).delete().catch(e=>Promise.reject(code(e))),
    sub(kind,path,fn){ try{ return kind==='col'
      ? db.collection(path).onSnapshot(s=>fn(s.docs.map(d=>({id:d.id,data:d.data()}))),()=>{})
      : db.doc(path).onSnapshot(s=>fn(s.exists?s.data():null),()=>{}); }catch(e){ return ()=>{}; } }
  };
  let readyP=null;
  function ready(){ if(ok!==null) return Promise.resolve(ok);
    return readyP||(readyP=(async()=>{
      try{ db=window.claude&&window.claude.use?await window.claude.use('db'):null; }catch(e){ db=null; }
      if(db){ let w=null; try{ const user=await window.claude.use('user'); w=user?await user.can('data.write'):null; }catch(e){}
        ok=w!==false; return ok; }
      return bridge(); })()); }
  /* inside Mesa de Juegos: the parent page holds the database */
  function bridge(){ if(ok!==null) return Promise.resolve(ok); if(!inFrame){ok=false;return Promise.resolve(false)}
    return new Promise(res=>{ waiters.push(res); post({t:'hello'}); setTimeout(()=>{ if(ok===null){ ok=false; waiters.splice(0).forEach(f=>f(false)); } },2500); }); }
  function call(t,path,data){ return new Promise((res,rej)=>{ const id=++seq; pend[id]={res,rej}; post({t,id,path,data}); setTimeout(()=>{ if(pend[id]){ delete pend[id]; rej('timeout'); } },9000); }); }
  return {
    ready,
    get:p=>db?local.get(p):call('get',p), set:(p,d)=>db?local.set(p,d):call('set',p,d), update:(p,d)=>db?local.update(p,d):call('update',p,d), del:p=>db?local.del(p):call('del',p),
    sub(kind,path,fn){ if(db) return local.sub(kind,path,fn); const id='s'+(++seq); subs[id]=fn; post({t:'sub',id,kind,path}); return ()=>{ delete subs[id]; post({t:'unsub',id}); }; }
  };
})();
window.DuoNet=Net;

/* ---------- lobby panel (DOM, over the canvas) ---------- */
const css=document.createElement('style');
css.textContent=`
.duo{position:absolute;inset:0;display:grid;place-items:center;padding:56px 14px 14px;overflow:auto;line-height:1.45;background:rgba(10,20,23,.82)}
.duo[hidden]{display:none}
.duo .box{width:100%;max-width:440px;display:flex;flex-direction:column;gap:10px;text-align:center}
.duo h3{font-family:var(--display);font-weight:900;font-size:22px;margin:0;letter-spacing:-.02em}
.duo p{margin:0;color:var(--muted);font-size:12.5px}
.duo .row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.duo button{font:700 13.5px var(--mono);border-radius:10px;padding:11px 14px;cursor:pointer;border:1px solid var(--line);background:var(--panel2);color:var(--ink);min-height:44px}
.duo button.main{background:var(--gold);color:var(--ground);border-color:var(--gold)}
.duo button[aria-pressed=true]{border-color:var(--gold);color:var(--gold)}
.duo button:disabled{opacity:.45;cursor:default}
.duo input{font:16px var(--mono);background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:10px 12px;min-width:0;flex:1}
.duo input.code{text-transform:uppercase;letter-spacing:.3em;text-align:center;max-width:150px}
.duo .sep{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:11px;letter-spacing:.15em;text-transform:uppercase}
.duo .sep::before,.duo .sep::after{content:"";flex:1;height:1px;background:var(--line)}
.duo .bigcode{font:900 40px var(--display);letter-spacing:.18em;color:var(--gold)}
.duo ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.duo li{display:flex;align-items:center;gap:8px;background:var(--panel2);border:1px solid var(--line);border-radius:9px;padding:8px 10px;text-align:left;font-size:13px}
.duo li i{width:12px;height:12px;border-radius:50%;flex:none}
.duo .err{color:var(--rose)}
.duo .names{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
`;
document.head.appendChild(css);

/* ---------- the Duo -> Arcade adapter ---------- */
window.Duo={ seatColor:SEAT_COL, register(spec){
  const M=Object.assign({min:2,max:2,online:true,hidden:false},spec);
  let A, W, H, cv, panel;
  /* session */
  let phase='lobby', mode=null, n=M.min, names=[], st=null, wins=[], round=0, mySeat=null;
  let room=null, unsubs=[], isHost=false, ver=0, resT=null, rematchT=null, ui={}, cover=null, coverFor=-1, lastTurn=-1, msg='', msgT=0, lobbyErr='';
  let roomPlayers=[], roomDoc=null, watch=null;
  const top=46;
  function view(){ return {W,H,top,ui,local:mode==='local',me:mode==='local'?(M.hidden?st&&st.turn:null):mySeat,names,colors:SEAT_COL,n}; }
  function myTurn(){ if(!st||M.result(st)) return false; return mode==='local'?true:st.turn===mySeat; }
  function cleanup(){ unsubs.splice(0).forEach(f=>{try{f()}catch(e){}}); clearTimeout(resT); clearTimeout(rematchT); resT=rematchT=null; if(panel) panel.hidden=true; if(watch){clearInterval(watch);watch=null} }
  function guard(){ /* leave the room when the player goes back to the menu */
    if(watch) clearInterval(watch);
    watch=setInterval(()=>{ const o=document.getElementById('over'); const inMenu=o&&!o.classList.contains('hide')&&o.querySelector('.card');
      if(window.__padGame!==M.id||inMenu) cleanup(); },400); }

  function panelEl(){ if(panel) return panel; panel=document.createElement('div'); panel.className='duo'; panel.hidden=true;
    const stage=document.getElementById('stage'), over=document.getElementById('over'); stage.insertBefore(panel,over);
    panel.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ const b=panel.querySelector('[data-enter]'); if(b&&e.target.tagName==='INPUT'){ e.preventDefault(); b.click(); } } });
    panel.addEventListener('keyup',e=>e.stopPropagation());
    return panel; }
  function showPanel(html){ const p=panelEl(); p.innerHTML='<div class="box">'+html+'</div>'; p.hidden=false; return p; }
  function bind(sel,fn){ const el=panel.querySelector(sel); if(el) el.addEventListener('click',fn); }

  /* ---------- lobby screens ---------- */
  async function lobby(){
    phase='lobby'; mode=null; st=null; room=null; isHost=false; mySeat=null; cover=null; lastTurn=-1;
    const counts=[]; for(let i=M.min;i<=M.max;i++) counts.push(i);
    const want=window.__duoMode||'';
    if(want==='2p'){ startLocal(); return; }
    const net=M.online?await Net.ready():false;
    if(phase!=='lobby'||window.__padGame!==M.id) return;
    const remote=want==='remoto';
    const myName=store.get('duo_name')||'';
    showPanel(
      '<h3 style="color:'+M.accent+'">'+esc(M.name)+'</h3><p>'+esc(M.desc)+'</p>'+
      (counts.length>1?'<div class="row" id="dn">'+counts.map(c=>'<button data-n="'+c+'" aria-pressed="'+(c===n)+'">'+c+' jugadores</button>').join('')+'</div>':'<p>'+M.min+' jugadores</p>')+
      (remote?'':'<div class="row"><button class="main" id="dLocal">En este celular</button></div>')+
      (M.online?(remote?'<div class="sep">remoto · cada uno en su celular</div>':'<div class="sep">o cada uno en su celular</div>')+
        (net?'<div class="row"><input id="dName" maxlength="12" placeholder="Tu nombre" value="'+esc(myName)+'" autocomplete="off"></div>'+
          '<div class="row"><button id="dCreate">Crear sala</button><input id="dCode" class="code" maxlength="4" placeholder="CÓDIGO" autocomplete="off"><button id="dJoin" data-enter>Unirse</button></div>'
          :'<p>Para jugar cada uno en su celular, abran esta página en Claude (claude.ai) con su cuenta.</p>'):'<p>Este se juega en un mismo celular o compu.</p>')+
      '<p class="err" id="dErr">'+esc(lobbyErr)+'</p>');
    lobbyErr='';
    panel.querySelectorAll('[data-n]').forEach(b=>b.addEventListener('click',()=>{ n=+b.dataset.n; panel.querySelectorAll('[data-n]').forEach(x=>x.setAttribute('aria-pressed',x===b)); }));
    bind('#dLocal',()=>startLocal());
    const nameOf=()=>{ const v=(panel.querySelector('#dName').value||'').trim().slice(0,12); if(v) store.set('duo_name',v); return v; };
    const err=t=>{ const e=panel.querySelector('#dErr'); if(e) e.textContent=t; };
    bind('#dCreate',async()=>{ const nm=nameOf(); if(!nm) return err('Escribe tu nombre primero.'); err('Creando sala…'); try{ await createRoom(nm); }catch(e){ err(netErr(e)); } });
    bind('#dJoin',async()=>{ const nm=nameOf(); if(!nm) return err('Escribe tu nombre primero.'); const c=(panel.querySelector('#dCode').value||'').toUpperCase().replace(/[^A-Z0-9]/g,''); if(c.length!==4) return err('El código tiene 4 letras.'); err('Entrando…'); try{ await joinRoom(c,nm); }catch(e){ err(netErr(e)); } });
  }
  function netErr(e){ return e==='not_granted'||e==='revoked'?'No tienes permiso para guardar en esta página. Pídele a la dueña que te dé acceso de colaborador.':e==='nofound'?'No existe una sala con ese código.':e==='wronggame'?'Esa sala es de otro juego.':e==='full'?'La sala ya está llena o ya empezó.':'No se pudo conectar. Inténtalo otra vez.'; }

  function startLocal(){
    mode='local'; names=[]; for(let i=0;i<n;i++) names.push('Jugador '+(i+1));
    showPanel('<h3>¿Quiénes juegan?</h3><div class="names">'+names.map((x,i)=>'<input data-i="'+i+'" maxlength="10" placeholder="'+x+'" style="border-color:'+SEAT_COL[i]+'" autocomplete="off">').join('')+'</div><div class="row"><button class="main" id="dGo" data-enter>Empezar</button><button id="dBack">Atrás</button></div>');
    bind('#dGo',()=>{ panel.querySelectorAll('[data-i]').forEach(inp=>{ const v=inp.value.trim(); if(v) names[+inp.dataset.i]=v; }); wins=new Array(n).fill(0); round=0; newRound(); });
    bind('#dBack',()=>{ if(window.__duoMode) window.Arcade.menu(); else lobby(); });
  }
  function newRound(){ panel&&(panel.hidden=true); st=M.newState(n,round%n); ui={}; phase='play'; lastTurn=-1; coverFor=-1; cover=null; round++; afterChange(); }

  /* ---------- online ---------- */
  function code(){ let c=''; for(let i=0;i<4;i++) c+=CODE_ABC[Math.floor(Math.random()*CODE_ABC.length)]; return c; }
  async function createRoom(nm){
    let c, tries=0;
    for(;;){ c=code(); const d=await Net.get('rooms/'+c); if(!d||!d.at||Date.now()-d.at>6*3600e3) break; if(++tries>5) throw 'error'; }
    await Net.set('rooms/'+c,{g:M.id,host:uid,max:n,phase:'lobby',at:Date.now(),v:0});
    await Net.set('rooms/'+c+'/p/'+uid,{name:nm,at:Date.now()});
    isHost=true; enter(c);
  }
  async function joinRoom(c,nm){
    const d=cleanRoom(await Net.get('rooms/'+c));
    if(!d||!d.g) throw 'nofound'; if(d.g!==M.id) throw 'wronggame';
    if(d.phase!=='lobby'&&!(d.players||[]).some(p=>p.id===uid)) throw 'full';
    if(d.phase==='lobby') await Net.set('rooms/'+c+'/p/'+uid,{name:nm,at:Date.now()});
    isHost=d.host===uid; enter(c);
  }
  /* room docs are written by other players: keep only well-formed values before anything renders them */
  const int=(x,lo,hi,dflt)=>{ x=Math.floor(Number(x)); return Number.isFinite(x)?Math.max(lo,Math.min(hi,x)):dflt; };
  const str=(x,max)=>typeof x==='string'?x.slice(0,max):'';
  function okState(s){ if(!s||typeof s!=='object'||typeof s.turn!=='number'||s.turn<0||s.turn>=M.max) return false;
    try{ M.result(s); return true; }catch(e){ return false; } }
  function cleanRoom(d){ if(!d||typeof d!=='object') return null;
    const players=Array.isArray(d.players)?d.players.slice(0,M.max).map(p=>({id:str(p&&p.id,40),name:str(p&&p.name,12)||'?'})):[];
    return {g:str(d.g,40), host:str(d.host,40), phase:d.phase==='play'?'play':'lobby', max:int(d.max,M.min,M.max,M.max), players,
      st:okState(d.st)?d.st:null, wins:players.map((_,i)=>int(Array.isArray(d.wins)?d.wins[i]:0,0,9999,0)),
      round:int(d.round,1,1e6,1), v:int(d.v,0,1e12,0), at:Number(d.at)||0}; }
  function cleanPlayers(docs){ return (Array.isArray(docs)?docs:[]).filter(p=>p&&typeof p.id==='string').map(p=>({id:p.id.slice(0,40),data:{name:str(p.data&&p.data.name,12)||'?',at:Number(p.data&&p.data.at)||0}})); }
  function enter(c){
    room=c; mode='online'; roomDoc=null; roomPlayers=[];
    unsubs.push(Net.sub('doc','rooms/'+c,d=>{ roomDoc=cleanRoom(d); onRoom(); }));
    unsubs.push(Net.sub('col','rooms/'+c+'/p',docs=>{ roomPlayers=cleanPlayers(docs).sort((a,b)=>a.data.at-b.data.at); onRoom(); }));
  }
  function waitingRoom(){
    const d=roomDoc; if(!d) return;
    const max=d.max||M.max, list=roomPlayers.slice(0,max);
    showPanel('<p>Código de la sala</p><div class="bigcode">'+room+'</div><p>Los demás abren '+esc(M.name)+', tocan "Unirse" y escriben este código.</p>'+
      '<ul>'+list.map((p,i)=>'<li><i style="background:'+SEAT_COL[i]+'"></i>'+esc(p.data.name)+(p.id===uid?' (tú)':'')+(p.id===d.host?' · anfitrión':'')+'</li>').join('')+'</ul>'+
      '<p>'+list.length+' de '+max+' jugadores</p>'+
      (isHost?'<div class="row"><button class="main" id="dStart" '+(list.length<M.min?'disabled':'')+'>Empezar</button><button id="dLeave">Salir</button></div>':'<p>Esperando a que el anfitrión empiece…</p><div class="row"><button id="dLeave">Salir</button></div>'));
    bind('#dStart',async()=>{ const pl=roomPlayers.slice(0,max).map(p=>({id:p.id,name:p.data.name})); if(pl.length<M.min) return;
      const s=M.newState(pl.length,0); try{ await Net.update('rooms/'+room,{phase:'play',players:pl,st:s,v:(d.v||0)+1,wins:new Array(pl.length).fill(0),round:1,at:Date.now()}); }catch(e){} });
    bind('#dLeave',()=>{ cleanup(); lobby(); });
  }
  function onRoom(){
    const d=roomDoc; if(!d){ return; }
    if(d.phase==='lobby'){ phase='wait'; waitingRoom(); return; }
    if(!d.st||!d.players.length) return; /* malformed game state: keep the last good one */
    const pl=d.players; names=pl.map(p=>p.name); n=pl.length; const s=pl.findIndex(p=>p.id===uid); mySeat=s>=0?s:null;
    if(panel) panel.hidden=true;
    if((d.v||0)>=ver||phase!=='play'){ ver=d.v||0; const newRoundStarted=st&&M.result(st)&&d.st&&!M.result(d.st); st=d.st; wins=d.wins||new Array(n).fill(0); round=d.round||1; if(newRoundStarted) ui={}; }
    phase='play'; afterChange();
  }
  async function push(){ ver++; try{ await Net.update('rooms/'+room,{st,v:ver,at:Date.now()}); }catch(e){ msg='no se pudo enviar la jugada'; msgT=2; } }

  /* ---------- moves, results, rematch ---------- */
  function play(mv){
    if(phase!=='play'||!st||!myTurn()||cover) return;
    const seat=st.turn, s2=M.move(clone(st),mv,seat); if(!s2) return;
    st=s2; if(mode==='online') push(); afterChange();
  }
  function afterChange(){
    const r=M.result(st);
    if(r){ if(!resT){ const w=r.winners||[]; resT=setTimeout(()=>rematch(w),4000); A.shake(0.3); } return; }
    clearTimeout(resT); resT=null; clearTimeout(rematchT); rematchT=null;
    if(mode==='local'&&M.hidden&&st.turn!==lastTurn){ cover=names[st.turn]; }
    lastTurn=st.turn;
  }
  async function rematch(w){
    resT=null; if(phase!=='play') return;
    if(mode==='local'){ w.forEach(i=>wins[i]++); newRound(); return; }
    const go=async()=>{ if(!roomDoc||!st||!M.result(st)) return; const nw=(roomDoc.wins||new Array(n).fill(0)).slice(); w.forEach(i=>nw[i]=(nw[i]||0)+1);
      const r=(roomDoc.round||1); try{ await Net.update('rooms/'+room,{st:M.newState(n,r%n),v:ver+1,wins:nw,round:r+1,at:Date.now()}); }catch(e){} };
    if(isHost) go(); else rematchT=setTimeout(()=>{ if(st&&M.result(st)) go(); },6000);
  }

  /* ---------- arcade game object ---------- */
  const game={
    id:M.id, name:M.name, accent:M.accent, desc:M.desc, players:M.min+(M.max>M.min?'–'+M.max:''), duo:true,
    keys:M.keys||'toca el tablero para jugar', overTitle:'Fin', fmt:v=>String(Math.round(v)),
    init(api){ A=api; cv=document.getElementById('c'); if(M.init) M.init(A);
      cv.addEventListener('pointerdown',e=>{ if(window.__padGame!==M.id||phase!=='play'||!st) return; const r=cv.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
        if(cover){ cover=null; return; }
        if(!myTurn()) { if(mode==='online'&&!M.result(st)){ msg='espera tu turno'; msgT=1; } return; }
        const mv=M.tap(st,x,y,view()); if(mv!=null) play(mv); }); },
    resize(w,h){ W=w; H=h; if(M.resize) M.resize(w,h); },
    start(){ W=A.W; H=A.H; if(M.resize) M.resize(W,H); cleanup(); guard(); A.hud([M.name]); lobby(); },
    keydown(e){ if(phase!=='play'||!st) return; if(cover){ if(e.key===' '||e.key==='Enter') cover=null; return; }
      if(!myTurn()) return; const mv=M.key?M.key(st,e.key.toLowerCase(),view()):null; if(mv!=null) play(mv); },
    update(dt){ if(msgT>0) msgT-=dt;
      if(phase!=='play'||!st){ A.hud([M.name, mode==='online'&&room?'sala '+room:'elige cómo jugar']); return; }
      const r=M.result(st), chips=names.map((x,i)=>'<span style="color:'+SEAT_COL[i]+'">●</span> '+esc(x)+' '+(wins[i]||0));
      if(mode==='online') chips.push('sala '+room);
      if(!r) chips.unshift(mode==='online'?(st.turn===mySeat?'tu turno':'turno de '+esc(names[st.turn])):'turno de '+esc(names[st.turn]));
      A.hud(chips);
      if(M.update) M.update(st,dt,view()); },
    draw(){ const ctx=A.ctx;
      if(phase!=='play'||!st){ return; }
      if(cover){ ctx.fillStyle='#0D1A1E'; ctx.fillRect(0,0,W,H); ctx.textAlign='center'; ctx.textBaseline='middle';
        A.text('Pásale el celular a',W/2,H/2-30,14,'#7E9A9E'); A.text(cover,W/2,H/2+4,26,SEAT_COL[st.turn],900); A.text('toca cuando esté lista la otra persona',W/2,H/2+40,12,'#7E9A9E'); return; }
      ctx.save(); try{ M.draw(ctx,A,st,view()); }catch(e){} ctx.restore();
      const r=M.result(st);
      ctx.textAlign='center'; ctx.textBaseline='middle';
      if(r){ const w=r.winners||[]; const t=r.text||(w.length===1?'¡Gana '+names[w[0]]+'!':w.length?'Empate entre '+w.map(i=>names[i]).join(' y '):'Empate');
        ctx.fillStyle='rgba(10,20,23,.82)'; A.roundRect(W/2-Math.min(W/2-10,190),H/2-40,Math.min(W-20,380),80,12); ctx.fill();
        A.text(t,W/2,H/2-10,Math.min(20,W/18),w.length===1?SEAT_COL[w[0]]:'#E9F2EF',900);
        A.text(mode==='online'&&!isHost?'esperando la revancha…':'nueva partida en un momento',W/2,H/2+20,11,'#7E9A9E'); }
      if(msgT>0) A.text(msg,W/2,H-10,12,'rgba(233,242,239,'+Math.min(1,msgT)+')',700); }
  };
  window.Arcade.register(game);
  return game;
}};
})();
