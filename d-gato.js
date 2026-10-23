/* Gato entre amigos — Duo game */
(function(){
"use strict";
const L=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
let cell, ox, oy;
function lay(W,H){ cell=Math.floor(Math.min((W-40)/3,(H-70)/3)); ox=Math.round((W-cell*3)/2); oy=50+Math.round((H-56-cell*3)/2); }
function line(b){ for(const l of L) if(b[l[0]]>=0&&b[l[0]]===b[l[1]]&&b[l[0]]===b[l[2]]) return l; return null; }
window.Duo.register({
  id:'d-gato', name:'Gato entre amigos', accent:'#9ED8FF', min:2, max:2,
  desc:'Tres en línea para dos. Gana quien junte tres seguidas.',
  keys:'<kbd>flechas</kbd> mover · <kbd>Espacio</kbd> marcar · o toca la casilla',
  resize:lay,
  newState(n,first){ return {b:[-1,-1,-1,-1,-1,-1,-1,-1,-1], turn:first%2}; },
  move(st,i,seat){ if(typeof i!=='number'||i<0||i>8||st.b[i]>=0) return null; st.b[i]=seat; st.turn=1-seat; return st; },
  result(st){ const l=line(st.b); if(l) return {winners:[st.b[l[0]]]}; if(st.b.every(x=>x>=0)) return {winners:[]}; return null; },
  tap(st,x,y){ const c=Math.floor((x-ox)/cell), r=Math.floor((y-oy)/cell); return c>=0&&c<3&&r>=0&&r<3?r*3+c:null; },
  key(st,k,v){ const u=v.ui; if(u.cur==null) u.cur=4; let r=u.cur/3|0, c=u.cur%3;
    if(k==='arrowleft'||k==='a') c=(c+2)%3; else if(k==='arrowright'||k==='d') c=(c+1)%3;
    else if(k==='arrowup'||k==='w') r=(r+2)%3; else if(k==='arrowdown'||k==='s') r=(r+1)%3;
    else if(k===' '||k==='enter') return u.cur;
    u.cur=r*3+c; return null; },
  draw(ctx,A,st,v){ ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.lineCap='round';
    ctx.strokeStyle='#25454D'; ctx.lineWidth=3;
    for(let i=1;i<3;i++){ ctx.beginPath(); ctx.moveTo(ox+i*cell,oy+8); ctx.lineTo(ox+i*cell,oy+cell*3-8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ox+8,oy+i*cell); ctx.lineTo(ox+cell*3-8,oy+i*cell); ctx.stroke(); }
    for(let i=0;i<9;i++){ const x=ox+(i%3+.5)*cell, y=oy+((i/3|0)+.5)*cell, s=cell*0.26, p=st.b[i];
      if(v.ui.cur===i){ ctx.fillStyle='rgba(255,206,92,.1)'; A.roundRect(x-cell/2+6,y-cell/2+6,cell-12,cell-12,8); ctx.fill(); }
      ctx.lineWidth=Math.max(4,cell*0.07); ctx.strokeStyle=v.colors[p];
      if(p===0){ ctx.beginPath(); ctx.moveTo(x-s,y-s); ctx.lineTo(x+s,y+s); ctx.moveTo(x+s,y-s); ctx.lineTo(x-s,y+s); ctx.stroke(); }
      if(p===1){ ctx.beginPath(); ctx.arc(x,y,s,0,6.283); ctx.stroke(); } }
    const l=line(st.b); if(l){ const P=i=>[ox+(i%3+.5)*cell, oy+((i/3|0)+.5)*cell]; const a=P(l[0]), c=P(l[2]); ctx.strokeStyle='#FFCE5C'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(c[0],c[1]); ctx.stroke(); }
    ctx.textAlign='left'; A.text(v.names[0]+' = X',10,H0(v)-12,11,v.colors[0],700); ctx.textAlign='right'; A.text(v.names[1]+' = O',v.W-10,H0(v)-12,11,v.colors[1],700); }
});
function H0(v){ return v.H; }
})();
