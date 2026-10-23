/* Conecta 4 entre amigos — Duo game */
(function(){
"use strict";
const CC=7, RR=6;
let cell, ox, oy;
function lay(W,H){ cell=Math.floor(Math.min((W-24)/CC,(H-110)/RR)); ox=Math.round((W-cell*CC)/2); oy=Math.round(56+cell*0.8+(H-70-cell*0.8-cell*RR)/2); }
function rowFor(b,c){ for(let r=RR-1;r>=0;r--) if(b[r*CC+c]<0) return r; return -1; }
function line4(b){ const D=[[0,1],[1,0],[1,1],[1,-1]];
  for(let r=0;r<RR;r++) for(let c=0;c<CC;c++){ const p=b[r*CC+c]; if(p<0) continue;
    for(const [dr,dc] of D){ const cs=[[r,c]];
      for(let k=1;k<4;k++){ const rr=r+dr*k, cc=c+dc*k; if(rr<0||rr>=RR||cc<0||cc>=CC||b[rr*CC+cc]!==p) break; cs.push([rr,cc]); }
      if(cs.length===4) return cs; } }
  return null; }
window.Duo.register({
  id:'d-connect4', name:'Conecta 4', accent:'#FFCE5C', min:2, max:2,
  desc:'Para dos: junta cuatro en línea antes que la otra persona.',
  keys:'<kbd>←</kbd><kbd>→</kbd> elegir columna · <kbd>Espacio</kbd> soltar · o toca la columna',
  resize:lay,
  newState(n,first){ return {b:new Array(CC*RR).fill(-1), turn:first%2, last:-1}; },
  move(st,c,seat){ if(typeof c!=='number'||c<0||c>=CC) return null; const r=rowFor(st.b,c); if(r<0) return null;
    st.b[r*CC+c]=seat; st.last=r*CC+c; st.turn=1-seat; return st; },
  result(st){ const l=line4(st.b); if(l) return {winners:[st.b[l[0][0]*CC+l[0][1]]], line:l}; if(st.b.every(x=>x>=0)) return {winners:[]}; return null; },
  tap(st,x,y){ const c=Math.floor((x-ox)/cell); return c>=0&&c<CC?c:null; },
  key(st,k,v){ const u=v.ui; if(u.col==null) u.col=3;
    if(k==='arrowleft'||k==='a') u.col=(u.col+CC-1)%CC; else if(k==='arrowright'||k==='d') u.col=(u.col+1)%CC;
    else if(k===' '||k==='enter'||k==='arrowdown'||k==='s') return u.col;
    return null; },
  draw(ctx,A,st,v){ const u=v.ui, res=this.result(st);
    if(!res&&u.col!=null){ ctx.fillStyle=v.colors[st.turn]; ctx.globalAlpha=.85; ctx.beginPath(); ctx.arc(ox+(u.col+.5)*cell,oy-cell*0.5,cell*0.34,0,6.283); ctx.fill(); ctx.globalAlpha=1; }
    ctx.fillStyle='#193036'; A.roundRect(ox-6,oy-6,cell*CC+12,cell*RR+12,10); ctx.fill();
    for(let r=0;r<RR;r++) for(let c=0;c<CC;c++){ const p=st.b[r*CC+c];
      ctx.fillStyle=p<0?'#0D1A1E':v.colors[p]; ctx.beginPath(); ctx.arc(ox+(c+.5)*cell,oy+(r+.5)*cell,cell*0.38,0,6.283); ctx.fill(); }
    if(st.last>=0&&!res){ const r=st.last/CC|0, c=st.last%CC; ctx.fillStyle='rgba(13,26,30,.55)'; ctx.beginPath(); ctx.arc(ox+(c+.5)*cell,oy+(r+.5)*cell,cell*0.08,0,6.283); ctx.fill(); }
    if(res&&res.line){ ctx.strokeStyle='#E9F2EF'; ctx.lineWidth=3; for(const [r,c] of res.line){ ctx.beginPath(); ctx.arc(ox+(c+.5)*cell,oy+(r+.5)*cell,cell*0.41,0,6.283); ctx.stroke(); } } }
});
})();
