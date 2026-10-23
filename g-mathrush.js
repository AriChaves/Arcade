/* Cálculo rápido — responde antes de que se acabe la barra */
(function(){
"use strict";
let A, W, H;
let q, opts, ans, score, over, tLeft, tMax, endT, btns, picked, okT, msg, level;
function layout(){ const gap=10, bh=Math.max(48,Math.min(80,(H-46-110)/2-gap)), bw=Math.min(260,(W-30-gap)/2), x0=(W-bw*2-gap)/2, y0=H-bh*2-gap-12;
  btns=[0,1,2,3].map(i=>({i,x:x0+(i%2)*(bw+gap),y:y0+(i>>1)*(bh+gap),w:bw,h:bh})); }
function r(a,b){ return a+A.ri(b-a+1); }
function make(){
  const L=score; let a,b,op,v;
  const ops=L<4?['+','−']:L<9?['+','−','×']:['+','−','×','÷'];
  op=A.pick(ops); const big=Math.min(10+L*4,99);
  if(op==='+'){ a=r(1,big); b=r(1,big); v=a+b; }
  else if(op==='−'){ a=r(2,big); b=r(1,a); v=a-b; }
  else if(op==='×'){ const m=Math.min(5+Math.floor(L/3),12); a=r(2,m); b=r(2,m); v=a*b; }
  else { const m=Math.min(4+Math.floor(L/3),12); b=r(2,m); v=r(2,m); a=b*v; }
  q=a+' '+op+' '+b+' = ?'; ans=v;
  const set=new Set([v]); let k=0;
  while(set.size<4&&k++<60){ const d=A.pick([1,2,3,5,10,-1,-2,-3,-5,-10]); const w=v+d; if(w>=0) set.add(w); }
  for(let w=v+1;set.size<4;w++) set.add(w);
  opts=[...set]; for(let i=opts.length-1;i>0;i--){ const j=A.ri(i+1); [opts[i],opts[j]]=[opts[j],opts[i]]; }
  tMax=Math.max(3,8-score*0.22); tLeft=tMax; picked=-1; level=Math.floor(score/5)+1;
}
function choose(i){ if(over||okT>0||i<0||i>3) return; picked=i;
  if(opts[i]===ans){ score++; okT=0.28; msg='¡correcto!'; A.burst(btns[i].x+btns[i].w/2,btns[i].y+btns[i].h/2,'#6FE0B0',10); }
  else lose('era '+ans); }
function lose(m){ over=true; msg=m; endT=1.4; A.shake(0.5); }
const game={
  id:'mathrush', name:'Cálculo rápido', accent:'#F09A6B',
  desc:'Sumas, restas y más: elige la respuesta antes de que se acabe el tiempo.',
  keys:'<kbd>1</kbd>–<kbd>4</kbd> elegir respuesta · o toca la respuesta',
  overTitle:'Fin del cálculo', fmt:v=>Math.round(v)+' correctas',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='mathrush'||!btns||!opts) return; const R=cv.getBoundingClientRect(), x=e.clientX-R.left, y=e.clientY-R.top;
      const b=btns.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h); if(b) choose(b.i); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); score=0; over=false; endT=0; okT=0; msg=''; make(); },
  keydown(e){ const i='1234'.indexOf(e.key); if(i>=0) choose(i); },
  update(dt){
    if(okT>0){ okT-=dt; if(okT<=0){ okT=0; make(); } }
    else if(!over){ tLeft-=dt; if(tLeft<=0){ tLeft=0; picked=-1; lose('¡tiempo! era '+ans); } }
    if(over&&endT>0){ endT-=dt; if(endT<=0){ endT=-1; A.end({score, rows:[[score,'correctas'],['nivel '+level,'alcanzado'],[q.replace('?',ans),'última']]}); } }
    A.hud([score+' correctas','nivel '+level],{pct:tLeft/tMax,col:tLeft<tMax*0.3?'#EE7563':'#F09A6B'}); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const top=58, qy=top+(btns[0].y-top)/2-8;
    A.text(q,W/2,qy,Math.min(46,W/9,(btns[0].y-top)*0.5),'#E9F2EF',700);
    if(msg&&(over||okT>0)) A.text(msg,W/2,qy+Math.min(34,(btns[0].y-qy)*0.65),13,over?'#EE7563':'#6FE0B0',700);
    /* timer bar under the question */
    const bw=Math.min(W-40,420), by=btns[0].y-12; ctx.fillStyle='#193036'; A.roundRect(W/2-bw/2,by-3,bw,6,3); ctx.fill();
    ctx.fillStyle=tLeft<tMax*0.3?'#EE7563':'#F09A6B'; A.roundRect(W/2-bw/2,by-3,Math.max(0,bw*tLeft/tMax),6,3); ctx.fill();
    for(const b of btns){ const right=over&&opts[b.i]===ans, wrong=over&&b.i===picked, ok=okT>0&&b.i===picked;
      ctx.fillStyle=right||ok?'rgba(111,224,176,.3)':wrong?'rgba(238,117,99,.35)':'#193036'; A.roundRect(b.x,b.y,b.w,b.h,12); ctx.fill();
      ctx.strokeStyle=right||ok?'#6FE0B0':wrong?'#EE7563':'#25454D'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.textAlign='left'; A.text(String(b.i+1),b.x+10,b.y+14,11,'#7E9A9E',700); ctx.textAlign='center';
      A.text(String(opts[b.i]),b.x+b.w/2,b.y+b.h/2+1,Math.min(30,b.h*0.45),'#E9F2EF',700); }
  }
};
window.Arcade.register(game);
})();
