/* Reversi entre amigos — Duo game */
(function(){
"use strict";
const N=8, DIRS=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
let cell, ox, oy;
function lay(W,H){ cell=Math.floor(Math.min((W-24)/N,(H-70)/N)); ox=Math.round((W-cell*N)/2); oy=52+Math.round((H-60-cell*N)/2); }
function flipsFor(b,i,p){ if(b[i]>=0) return []; const r=i/N|0, c=i%N, out=[];
  for(const [dr,dc] of DIRS){ const line=[]; let rr=r+dr, cc=c+dc;
    while(rr>=0&&rr<N&&cc>=0&&cc<N&&b[rr*N+cc]===1-p){ line.push(rr*N+cc); rr+=dr; cc+=dc; }
    if(line.length&&rr>=0&&rr<N&&cc>=0&&cc<N&&b[rr*N+cc]===p) out.push(...line); }
  return out; }
function legal(b,p){ const m=[]; for(let i=0;i<N*N;i++) if(flipsFor(b,i,p).length) m.push(i); return m; }
function count(b,p){ return b.filter(x=>x===p).length; }
window.Duo.register({
  id:'d-reversi', name:'Reversi', accent:'#5FD6C0', min:2, max:2,
  desc:'Para dos: encierra las fichas de la otra persona para voltearlas.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> poner ficha · o toca la casilla marcada',
  resize:lay,
  newState(n,first){ const b=new Array(N*N).fill(-1); b[27]=1; b[36]=1; b[28]=0; b[35]=0; return {b, turn:first%2, last:-1, pass:false}; },
  move(st,i,seat){ if(typeof i!=='number') return null; const f=flipsFor(st.b,i,seat); if(!f.length) return null;
    st.b[i]=seat; f.forEach(k=>st.b[k]=seat); st.last=i; st.pass=false;
    if(legal(st.b,1-seat).length) st.turn=1-seat; else if(legal(st.b,seat).length) st.pass=true; /* the other has no move: same seat again */
    return st; },
  result(st){ if(legal(st.b,0).length||legal(st.b,1).length) return null;
    const a=count(st.b,0), b=count(st.b,1); return {winners:a>b?[0]:b>a?[1]:[]}; },
  tap(st,x,y){ const c=Math.floor((x-ox)/cell), r=Math.floor((y-oy)/cell); return c>=0&&c<N&&r>=0&&r<N?r*N+c:null; },
  key(st,k,v){ const u=v.ui; if(u.cur==null) u.cur=19; let r=u.cur/N|0, c=u.cur%N;
    if(k==='arrowleft'||k==='a') c=(c+N-1)%N; else if(k==='arrowright'||k==='d') c=(c+1)%N;
    else if(k==='arrowup'||k==='w') r=(r+N-1)%N; else if(k==='arrowdown'||k==='s') r=(r+1)%N;
    else if(k===' '||k==='enter') return u.cur;
    u.cur=r*N+c; return null; },
  draw(ctx,A,st,v){ const done=!!this.result(st);
    ctx.fillStyle='#1E4A3A'; A.roundRect(ox-5,oy-5,cell*N+10,cell*N+10,8); ctx.fill();
    ctx.strokeStyle='rgba(13,26,30,.55)'; ctx.lineWidth=1;
    for(let i=0;i<=N;i++){ ctx.beginPath(); ctx.moveTo(ox+i*cell,oy); ctx.lineTo(ox+i*cell,oy+N*cell); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox,oy+i*cell); ctx.lineTo(ox+N*cell,oy+i*cell); ctx.stroke(); }
    const mine=v.local||v.me===st.turn;
    if(!done&&mine) for(const i of legal(st.b,st.turn)){ ctx.fillStyle='rgba(255,206,92,.45)'; ctx.beginPath(); ctx.arc(ox+(i%N+.5)*cell,oy+((i/N|0)+.5)*cell,cell*0.13,0,6.283); ctx.fill(); }
    for(let i=0;i<N*N;i++){ const p=st.b[i]; if(p<0) continue;
      ctx.fillStyle=v.colors[p]; ctx.beginPath(); ctx.arc(ox+(i%N+.5)*cell,oy+((i/N|0)+.5)*cell,cell*0.38,0,6.283); ctx.fill(); }
    if(st.last>=0){ ctx.fillStyle='rgba(13,26,30,.6)'; ctx.beginPath(); ctx.arc(ox+(st.last%N+.5)*cell,oy+((st.last/N|0)+.5)*cell,cell*0.08,0,6.283); ctx.fill(); }
    if(!done&&v.ui.cur!=null){ ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=2.5; ctx.strokeRect(ox+(v.ui.cur%N)*cell+1.5,oy+(v.ui.cur/N|0)*cell+1.5,cell-3,cell-3); }
    ctx.textBaseline='middle';
    ctx.textAlign='left'; A.text(v.names[0]+' '+count(st.b,0),10,v.H-12,11,v.colors[0],700);
    ctx.textAlign='right'; A.text(count(st.b,1)+' '+v.names[1],v.W-10,v.H-12,11,v.colors[1],700);
    if(st.pass&&!done){ ctx.textAlign='center'; A.text(v.names[1-st.turn]+' no tiene jugada: pasa',v.W/2,v.H-12,11,'#7E9A9E',700); } }
});
})();
