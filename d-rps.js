/* Piedra, papel o tijera entre amigos — Duo game. Each one picks in secret; first to 3 wins. */
(function(){
"use strict";
const OPT=[{n:'Piedra',e:'✊'},{n:'Papel',e:'✋'},{n:'Tijera',e:'✌️'}], WIN=3;
let btns=[];
function lay(W,H){ const bw=Math.min(120,(W-40)/3), bh=Math.min(100,(H-46)*0.32), x0=(W-bw*3-16)/2, y=H-bh-14;
  btns=OPT.map((o,i)=>({i,x:x0+i*(bw+8),y,w:bw,h:bh})); }
window.Duo.register({
  id:'d-rps', name:'Piedra, papel o tijera', accent:'#C58BFF', min:2, max:2, hidden:true,
  desc:'Para dos: cada quien elige en secreto. Gana quien llegue a 3.',
  keys:'<kbd>1</kbd> piedra · <kbd>2</kbd> papel · <kbd>3</kbd> tijera · o toca tu jugada',
  resize:lay,
  newState(n,first){ return {p:[-1,-1], sc:[0,0], turn:first%2, n:0, last:null}; },
  move(st,c,seat){ if(typeof c!=='number'||c<0||c>2||st.p[seat]>=0) return null; st.p[seat]=c;
    const o=1-seat;
    if(st.p[o]<0){ st.turn=o; return st; }
    const a=st.p[0], b=st.p[1], d=(a-b+3)%3, w=d===0?-1:d===1?0:1;
    if(w>=0) st.sc[w]++;
    st.last={a,b,w}; st.p=[-1,-1]; st.n++; st.turn=st.n%2; return st; },
  result(st){ if(st.sc[0]>=WIN) return {winners:[0]}; if(st.sc[1]>=WIN) return {winners:[1]}; return null; },
  tap(st,x,y){ const b=btns.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h); return b?b.i:null; },
  key(st,k){ return k==='1'?0:k==='2'?1:k==='3'?2:null; },
  draw(ctx,A,st,v){ const W=v.W, H=v.H, mine=v.local||v.me===st.turn; ctx.textAlign='center'; ctx.textBaseline='middle';
    A.text(v.names[0]+'  '+st.sc[0]+'  –  '+st.sc[1]+'  '+v.names[1],W/2,v.top+26,Math.min(18,W/24),'#E9F2EF',700);
    A.text('primero a '+WIN,W/2,v.top+48,11,'#7E9A9E');
    const midY=v.top+(btns[0].y-v.top)/2+18;
    if(st.last){ const L=st.last, sz=Math.min(54,H*0.13);
      A.text(OPT[L.a].e,W/2-Math.min(110,W*0.22),midY-12,sz,'#E9F2EF'); A.text(OPT[L.b].e,W/2+Math.min(110,W*0.22),midY-12,sz,'#E9F2EF');
      A.text(v.names[0],W/2-Math.min(110,W*0.22),midY+sz*0.6,11,v.colors[0],700); A.text(v.names[1],W/2+Math.min(110,W*0.22),midY+sz*0.6,11,v.colors[1],700);
      A.text(L.w<0?'empate':'gana '+v.names[L.w],W/2,midY-12,13,L.w<0?'#7E9A9E':v.colors[L.w],700); }
    else A.text('elige en secreto',W/2,midY,14,'#7E9A9E',700);
    const waiting=st.p[1-st.turn]>=0;
    A.text(mine?(v.names[st.turn]+': elige tu jugada'+(waiting?' (la otra persona ya eligió)':'')):'esperando a '+v.names[st.turn]+'…',W/2,btns[0].y-14,12,v.colors[st.turn],700);
    for(const b of btns){ ctx.globalAlpha=mine?1:0.35; ctx.fillStyle='#193036'; A.roundRect(b.x,b.y,b.w,b.h,12); ctx.fill();
      ctx.strokeStyle='#C58BFF'; ctx.lineWidth=1.5; ctx.stroke();
      A.text(OPT[b.i].e,b.x+b.w/2,b.y+b.h*0.42,b.h*0.38,'#E9F2EF'); A.text((b.i+1)+' · '+OPT[b.i].n,b.x+b.w/2,b.y+b.h*0.82,11,'#9DB5B8',700); ctx.globalAlpha=1; } }
});
})();
