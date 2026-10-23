/* Piedra, papel o tijera — contra la computadora */
(function(){
"use strict";
let A, W, H;
const OPT=[{n:'Piedra',e:'✊'},{n:'Papel',e:'✋'},{n:'Tijera',e:'✌️'}];
let run=0, me, cpu, res, wins, losses, ties, over, showT, btns, msg;
function layout(){ const bw=Math.min(110,(W-40)/3), bh=Math.min(90,(H-46)*0.32); const x0=(W-bw*3-16)/2, y=H-bh-12;
  btns=OPT.map((o,i)=>({i,x:x0+i*(bw+8),y,w:bw,h:bh})); }
function pick(i){ if(over||showT>0) return; me=i; cpu=A.ri(3); const d=(me-cpu+3)%3;
  res=d===0?'tie':d===1?'win':'lose'; if(res==='win') wins++; else if(res==='lose') losses++; else ties++;
  msg=res==='win'?'¡ganaste!':res==='lose'?'perdiste':'empate'; showT=1.1;
  if(res==='lose'&&losses>=3){ over=true; const tok=run; setTimeout(()=>{ const o=document.getElementById('over'); if(tok===run&&over&&!(o&&!o.classList.contains('hide')&&o.querySelector('.card'))) A.end({score:wins, rows:[[wins,'ganadas'],[ties,'empates'],[losses,'perdidas']]}); },900); } }
const game={
  id:'rps', name:'Piedra, papel o tijera', accent:'#C58BFF',
  desc:'Contra la computadora. Juegas hasta perder 3 veces; cuenta tus ganadas.',
  keys:'<kbd>1</kbd> piedra · <kbd>2</kbd> papel · <kbd>3</kbd> tijera · o toca tu jugada',
  overTitle:'La computadora ganó 3 veces', fmt:v=>Math.round(v)+' ganadas',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='rps'||!btns) return; const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
      const b=btns.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h); if(b) pick(b.i); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ run++; W=A.W; H=A.H; layout(); wins=0; losses=0; ties=0; over=false; showT=0; me=-1; cpu=-1; res=''; msg='elige tu jugada'; },
  keydown(e){ const i='123'.indexOf(e.key); if(i>=0) pick(i); },
  update(dt){ if(showT>0) showT-=dt; A.hud(['ganadas '+wins,'empates '+ties,'vidas '+'●'.repeat(Math.max(0,3-losses))]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const midY=46+(btns[0].y-46)/2, big=Math.min(56,(btns[0].y-46)*0.42);
    A.text('tú',W*0.3,midY-big*0.9,12,'#7E9A9E',700); A.text('compu',W*0.7,midY-big*0.9,12,'#7E9A9E',700);
    ctx.font=big+'px sans-serif'; ctx.fillStyle='#E9F2EF';
    ctx.fillText(me>=0?OPT[me].e:'?',W*0.3,midY+4); ctx.fillText(cpu>=0?OPT[cpu].e:'?',W*0.7,midY+4);
    A.text(msg,W/2,midY+big*0.85,14,res==='win'?'#5FD6C0':res==='lose'?'#EE7563':'#E9F2EF',700);
    for(const b of btns){ ctx.fillStyle='rgba(25,48,54,1)'; A.roundRect(b.x,b.y,b.w,b.h,10); ctx.fill(); ctx.strokeStyle=me===b.i?'#FFCE5C':'rgba(37,69,77,1)'; ctx.lineWidth=me===b.i?2:1; ctx.stroke();
      ctx.font=Math.min(30,b.h*0.4)+'px sans-serif'; ctx.fillText(OPT[b.i].e,b.x+b.w/2,b.y+b.h*0.4);
      A.text((b.i+1)+' · '+OPT[b.i].n,b.x+b.w/2,b.y+b.h*0.78,Math.min(12,b.w*0.11),'#7E9A9E',600); } }
};
window.Arcade.register(game);
})();
