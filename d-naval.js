/* Batalla naval entre amigos — Duo game. Fleets are placed at random; take turns firing. */
(function(){
"use strict";
const N=7, SHIPS=[3,3,2,2], CELLS=SHIPS.reduce((a,b)=>a+b,0);
let cell=20, mine={x:0,y:0}, enemy={x:0,y:0}, side=false;
function lay(W,H){ side=W>=H*1.25;
  cell=Math.floor(side?Math.min((W-70)/(2*N),(H-120)/N):Math.min((W-30)/N,(H-150)/(2*N)));
  const g=cell*N;
  if(side){ const gap=Math.max(30,(W-2*g)/3); enemy={x:gap,y:86}; mine={x:gap*2+g,y:86}; }
  else { enemy={x:(W-g)/2,y:78}; mine={x:(W-g)/2,y:78+g+36}; } }
function fleet(){ const b=new Array(N*N).fill(-1);
  SHIPS.forEach((len,id)=>{ for(let t=0;t<200;t++){ const hor=Math.random()<.5, r=Math.floor(Math.random()*(hor?N:N-len+1)), c=Math.floor(Math.random()*(hor?N-len+1:N));
    const cells=[]; for(let k=0;k<len;k++) cells.push((r+(hor?0:k))*N+c+(hor?k:0));
    if(cells.every(i=>b[i]<0)){ cells.forEach(i=>b[i]=id); return; } } });
  return b; }
const hits=(st,seat)=>st['s'+seat].filter(x=>x===2).length;
window.Duo.register({
  id:'d-naval', name:'Batalla naval', accent:'#F09A6B', min:2, max:2, hidden:true,
  desc:'Para dos: cada quien tiene su flota escondida. Gana quien hunda la del otro.',
  keys:'<kbd>flechas</kbd> apuntar · <kbd>Espacio</kbd> disparar · o toca el tablero de disparos',
  resize:lay,
  newState(n,first){ return {b0:fleet(), b1:fleet(), s0:new Array(N*N).fill(0), s1:new Array(N*N).fill(0), turn:first%2, last:-1}; },
  move(st,i,seat){ const s=st['s'+seat]; if(typeof i!=='number'||i<0||i>=N*N||s[i]) return null;
    s[i]=st['b'+(1-seat)][i]>=0?2:1; st.last=i; st.turn=1-seat; return st; },
  result(st){ for(const s of [0,1]) if(hits(st,s)>=CELLS) return {winners:[s]}; return null; },
  tap(st,x,y){ const c=Math.floor((x-enemy.x)/cell), r=Math.floor((y-enemy.y)/cell); return c>=0&&c<N&&r>=0&&r<N?r*N+c:null; },
  key(st,k,v){ const u=v.ui; if(u.cur==null) u.cur=24; let r=u.cur/N|0, c=u.cur%N;
    if(k==='arrowleft'||k==='a') c=(c+N-1)%N; else if(k==='arrowright'||k==='d') c=(c+1)%N;
    else if(k==='arrowup'||k==='w') r=(r+N-1)%N; else if(k==='arrowdown'||k==='s') r=(r+1)%N;
    else if(k===' '||k==='enter') return u.cur;
    u.cur=r*N+c; return null; },
  draw(ctx,A,st,v){ const me=v.me==null?st.turn:v.me, op=1-me, done=!!this.result(st), g=cell*N;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    const grid=(o,title,col,fn)=>{ A.text(title,o.x+g/2,o.y-14,12,col,700);
      ctx.fillStyle='#122429'; A.roundRect(o.x-3,o.y-3,g+6,g+6,6); ctx.fill();
      for(let i=0;i<N*N;i++){ const x=o.x+(i%N)*cell, y=o.y+(i/N|0)*cell; ctx.fillStyle='#0D1A1E'; A.roundRect(x+1.5,y+1.5,cell-3,cell-3,3); ctx.fill(); fn(i,x,y); } };
    const dot=(x,y,c,r)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x+cell/2,y+cell/2,cell*r,0,6.283); ctx.fill(); };
    /* where I fire: the other player's sea */
    grid(enemy,'Disparos de '+v.names[me]+' · '+hits(st,me)+'/'+CELLS,v.colors[me],(i,x,y)=>{ const s=st['s'+me][i];
      if(done&&st['b'+op][i]>=0&&s!==2){ ctx.fillStyle='rgba(240,154,107,.35)'; A.roundRect(x+3,y+3,cell-6,cell-6,3); ctx.fill(); }
      if(s===2){ ctx.fillStyle='#F09A6B'; A.roundRect(x+3,y+3,cell-6,cell-6,3); ctx.fill(); A.text('✕',x+cell/2,y+cell/2+1,cell*0.5,'#0D1A1E',700); }
      else if(s===1) dot(x,y,'#3E6E78',0.13);
      if(i===st.last&&st.turn===op) { ctx.strokeStyle='#E9F2EF'; ctx.lineWidth=1.5; ctx.strokeRect(x+2,y+2,cell-4,cell-4); } });
    if(v.ui.cur!=null&&!done){ ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2.5; ctx.strokeRect(enemy.x+(v.ui.cur%N)*cell+1.5,enemy.y+(v.ui.cur/N|0)*cell+1.5,cell-3,cell-3); }
    /* my fleet with the other player's shots */
    grid(mine,'Flota de '+v.names[me],'#7E9A9E',(i,x,y)=>{ const ship=st['b'+me][i], s=st['s'+op][i];
      if(ship>=0){ ctx.fillStyle=s===2?'#EE7563':'#3E6E78'; A.roundRect(x+3,y+3,cell-6,cell-6,3); ctx.fill(); }
      else if(s===1) dot(x,y,'#25454D',0.13);
      if(i===st.last&&st.turn===me){ ctx.strokeStyle='#E9F2EF'; ctx.lineWidth=1.5; ctx.strokeRect(x+2,y+2,cell-4,cell-4); } });
    if(!done){ const ty=side?enemy.y+g+22:mine.y+g+20, mineTurn=v.local||v.me===st.turn;
      A.text(mineTurn?'turno de '+v.names[st.turn]+': dispara '+(side?'a la izquierda':'arriba'):'esperando a '+v.names[st.turn]+'…',v.W/2,Math.min(ty,v.H-10),12,v.colors[st.turn],700); } }
});
})();
