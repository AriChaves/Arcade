/* Blackjack (21) — contra la banca */
(function(){
"use strict";
let A, W, H;
const SU=['♠','♥','♦','♣'], RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const MAXH=15;
let deck, ph, dh, chips, bet, hands, won, phase, msg, msgCol, waitT, over, endT, btns, ch, cw, hover, best;
/* phase: 'play' (player decides), 'dealer', 'result' */
function newDeck(){ deck=[]; for(let s=0;s<4;s++) for(let r=0;r<13;r++) deck.push({s,r});
  for(let i=deck.length-1;i>0;i--){ const j=A.ri(i+1); [deck[i],deck[j]]=[deck[j],deck[i]]; } }
function draw1(){ if(deck.length<12) newDeck(); return deck.pop(); }
function total(h){ let t=0, aces=0; for(const c of h){ if(c.down) continue; const v=c.r===0?11:c.r>=9?10:c.r+1; t+=v; if(c.r===0) aces++; }
  while(t>21&&aces){ t-=10; aces--; } return t; }
function layout(){ ch=Math.floor(Math.min(112,(H-168)/2)); cw=Math.floor(ch*0.7);
  const bh=Math.max(40,Math.min(48,H*0.1)), by=H-bh-8, gap=8, bw=Math.min(170,(W-24-gap*2)/3), x0=(W-bw*3-gap*2)/2;
  btns=[{id:'h',t:'Pedir',k:'H',x:x0,y:by,w:bw,h:bh},{id:'s',t:'Plantarse',k:'S',x:x0+bw+gap,y:by,w:bw,h:bh},{id:'d',t:'Doblar',k:'D',x:x0+2*(bw+gap),y:by,w:bw,h:bh},
        {id:'n',t:'Siguiente',k:'Espacio',x:(W-Math.min(240,W-40))/2,y:by,w:Math.min(240,W-40),h:bh}]; }
function canDouble(){ return phase==='play'&&ph.length===2&&chips>=bet; }
function deal(){
  if(chips<=0||hands>=MAXH){ finish(); return; }
  bet=Math.min(10,chips); chips-=bet; hands++;
  ph=[draw1(),draw1()]; dh=[draw1(),Object.assign(draw1(),{down:true})];
  phase='play'; msg='¿pides otra carta?'; msgCol='#E9F2EF';
  if(total(ph)===21){ stand(); }
}
function hit(){ if(phase!=='play'||over) return; ph.push(draw1()); const t=total(ph);
  if(t>21){ dh[1].down=false; settle(); } else if(t===21) stand(); else msg='tienes '+t; }
function stand(){ if(phase!=='play'||over) return; dh[1].down=false; phase='dealer'; waitT=0.6; msg='juega la banca…'; msgCol='#7E9A9E'; }
function dbl(){ if(!canDouble()||over) return; chips-=bet; bet*=2; ph.push(draw1()); if(total(ph)>21){ dh[1].down=false; settle(); } else stand(); }
function settle(){
  const p=total(ph), d=total(dh), pbj=p===21&&ph.length===2, dbj=d===21&&dh.length===2;
  let res;
  if(p>21) res='lose'; else if(pbj&&!dbj) res='bj'; else if(dbj&&!pbj) res='lose';
  else if(d>21||p>d) res='win'; else if(p===d) res='push'; else res='lose';
  if(res==='bj'){ chips+=Math.round(bet*2.5); won++; msg='¡Blackjack! +'+Math.round(bet*1.5); msgCol='#FFCE5C'; A.burst(W/2,H*0.6,'#FFCE5C',18); }
  else if(res==='win'){ chips+=bet*2; won++; msg=(d>21?'la banca se pasó · ':'ganaste · ')+'+'+bet; msgCol='#5FD6C0'; A.burst(W/2,H*0.6,'#5FD6C0',12); }
  else if(res==='push'){ chips+=bet; msg='empate · recuperas '+bet; msgCol='#9ED8FF'; }
  else { msg=(p>21?'te pasaste · ':'gana la banca · ')+'−'+bet; msgCol='#EE7563'; A.shake(0.3); }
  best=Math.max(best,chips);
  phase='result'; waitT=2.2;
  if(chips<=0||hands>=MAXH){ over=true; endT=1.6; }
}
function finish(){ over=true; if(endT<=0) endT=0.01; }
function next(){ if(phase!=='result'||over) return; deal(); }
function act(id){ if(id==='h') hit(); else if(id==='s') stand(); else if(id==='d') dbl(); else if(id==='n') next(); }
function visible(b){ return phase==='result'? b.id==='n' : (b.id!=='n'&&phase==='play'); }
function drawCard(c,x,y){ const ctx=A.ctx;
  ctx.fillStyle=c.down?'#25454D':'#F4F1E8'; A.roundRect(x,y,cw,ch,Math.max(5,cw*0.1)); ctx.fill();
  ctx.strokeStyle='rgba(13,26,30,.6)'; ctx.lineWidth=1; ctx.stroke();
  if(c.down){ ctx.strokeStyle='rgba(95,214,192,.45)'; A.roundRect(x+5,y+5,cw-10,ch-10,4); ctx.stroke();
    A.text('?',x+cw/2,y+ch/2,ch*0.3,'rgba(95,214,192,.7)',700); return; }
  const red=c.s===1||c.s===2, col=red?'#C8372D':'#14181A';
  ctx.textAlign='left'; A.text(RK[c.r],x+cw*0.1,y+ch*0.14,Math.max(11,ch*0.2),col,700);
  ctx.textAlign='center'; A.text(SU[c.s],x+cw/2,y+ch*0.6,ch*0.38,col,500); }
function drawHand(h,y,label){ const ctx=A.ctx, n=h.length, maxW=W-40;
  const step=n>1?Math.min(cw+8,(maxW-cw)/(n-1)):0, tw=cw+step*(n-1), x0=(W-tw)/2;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  A.text(label,W/2,y-8,11,'#7E9A9E',700);
  h.forEach((c,i)=>drawCard(c,x0+i*step,y)); }
const game={
  id:'blackjack', name:'Blackjack (21)', accent:'#6FE0B0',
  desc:'Llega a 21 sin pasarte y gánale a la banca. Tienes 100 fichas y 15 manos.',
  keys:'<kbd>H</kbd> pedir · <kbd>S</kbd> plantarse · <kbd>D</kbd> doblar · <kbd>Espacio</kbd> siguiente mano · o toca los botones',
  overTitle:'Fin de la mesa', fmt:v=>Math.round(v)+' fichas',
  init(api){ A=api; const cv=document.getElementById('c');
    cv.addEventListener('pointerdown',e=>{ if(window.__padGame!=='blackjack'||!btns||!ph||over) return; const r=cv.getBoundingClientRect(), x=e.clientX-r.left, y=e.clientY-r.top;
      const b=btns.find(b=>visible(b)&&x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h); if(b) act(b.id); }); },
  resize(w,h){ W=w; H=h; layout(); },
  start(){ W=A.W; H=A.H; layout(); newDeck(); chips=100; best=100; hands=0; won=0; over=false; endT=-1; waitT=0; deal(); },
  keydown(e){ const k=e.key.toLowerCase(); if(over) return;
    if(k==='h'||k==='1'||k==='arrowup') act('h'); else if(k==='s'||k==='2'||k==='arrowdown') act('s'); else if(k==='d'||k==='3') act('d');
    else if((k===' '||k==='spacebar'||k==='enter')&&phase==='result') act('n'); },
  update(dt){
    if(endT>0){ endT-=dt; if(endT<=0){ endT=-2; game.overTitle=chips>100?'¡Ganaste fichas!':chips>0?'Fin de la mesa':'Sin fichas';
      A.end({score:chips, rows:[[chips,'fichas'],[hands,'manos'],[won,'ganadas']]}); } }
    else if(!over){
      if(phase==='dealer'){ waitT-=dt; if(waitT<=0){ if(total(dh)<17){ dh.push(draw1()); waitT=0.55; } else settle(); } }
      else if(phase==='result'){ waitT-=dt; if(waitT<=0) next(); }
    }
    A.hud([chips+' fichas','apuesta '+(phase==='result'?0:bet),'mano '+hands+'/'+MAXH]); },
  draw(){ const ctx=A.ctx; ctx.textAlign='center'; ctx.textBaseline='middle';
    const top=62;
    drawHand(dh,top,'banca'+(dh.some(c=>c.down)?'':' · '+total(dh)));
    const my=top+ch+20;
    A.text(msg,W/2,my,Math.min(15,W/28),msgCol,700);
    const py=my+26;
    drawHand(ph,py,'tú · '+total(ph));
    for(const b of btns){ if(!visible(b)) continue; const dis=b.id==='d'&&!canDouble();
      ctx.fillStyle=b.id==='h'||b.id==='n'?'rgba(111,224,176,.22)':'#193036'; A.roundRect(b.x,b.y,b.w,b.h,10); ctx.fill();
      ctx.strokeStyle=dis?'#25454D':b.id==='h'||b.id==='n'?'#6FE0B0':'#7E9A9E'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.globalAlpha=dis?0.35:1;
      A.text(b.t,b.x+b.w/2,b.y+b.h/2-6,b.w<96?12:14,'#E9F2EF',700);
      A.text(b.k,b.x+b.w/2,b.y+b.h/2+11,10,'#7E9A9E',500);
      ctx.globalAlpha=1; }
  }
};
window.Arcade.register(game);
})();
