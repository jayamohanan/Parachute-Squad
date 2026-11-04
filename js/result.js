// ---------- result ----------
const NAMES={platforms:'Platforms',faulty:'Faulty chutes',heavy:'Heavy divers',dive:'Plane dive',vents:'Vents'};
let resultSeq=0;   // bumps every time a result is shown or left, so delayed effects from an old result never fire
// Every delayed result-screen effect goes through rt(). Leaving the result (Next / Retry / Levels) cancels them all and
// cuts any result sounds still ringing. All progress (stars, coins, wins, unlocks) is saved the moment the result
// opens or a button is pressed — never at the end of an animation — so skipping can't lose anything.
let resultTimers=[];
function rt(fn,ms){ const id=setTimeout(()=>{ resultTimers=resultTimers.filter(x=>x!==id); fn(); },ms); resultTimers.push(id); return id; }
function leaveResult(){ resultSeq++; for(const id of resultTimers) clearTimeout(id); resultTimers=[]; SFX.cutAll(); clearFlyCoins(); coinFx=null; $('wPop').hidden=true; }
function showEnd(){
  resultSeq++; $('strip').className='strip'; $('strip').style.minHeight='';
  if(S.training){   // training never fails. First time (and "Practice again" from the card): graduation card. From "?": back to the levels.
    const grad=trainingThen==='level1'||trainingThen==='grad';
    training=false; prog.trained=true;
    if(grad){ const hs=S.divers.filter(d=>!d.dummy), perf=hs.filter(d=>d.rating==='perfect').length;
      let gift=0; if(!prog.gradGift){ prog.gradGift=true; gift=100; prog.coins+=gift; }
      saveProg(); showGrad(perf,hs,gift); return; }
    saveProg(); curLevel=0; showLevels(); return;
  }
  if(S.level!=null) return showLevelEnd();
  $('rTotal').textContent='/ '+S.humansN;
  const humans=S.divers.filter(d=>!d.dummy);
  const cls=d=>(d.outcome==='splat'||d.outcome==='crash')?'splat':d.rating==='perfect'?'perfect':'miss';
  const perf=humans.filter(d=>cls(d)==='perfect').length;
  const close=humans.filter(d=>cls(d)==='miss').length;
  const splats=humans.filter(d=>cls(d)==='splat').length;
  const c=S.cfg;
  const vars=VKEYS.filter(k=>k!=='clouds'&&c[k]==='on').map(k=>NAMES[k]);
  if(c.clouds!=='off') vars.push(c.clouds==='full'?'Full clouds':'Patchy clouds');
  const gName={flat:'Flat',slope:'Slope',steps:'Steps'}[S.mode], tName={slow:'Slow',med:'Med',fast:'Fast'}[S.tempoKey];
  const bName={normal:'',thin:'Thin band',razor:'Razor band'}[c.band]||'';
  $('rMode').textContent=[`${gName} · ${tName}`].concat(bName?[bName]:[],vars).join(' · ');
  const key='chuteRhythm.v3.best.'+[c.ground,c.tempo,c.band,c.platforms,c.faulty,c.heavy,c.dive,c.vents,c.clouds].join('-');
  const prev=+(store.get(key)??-1), isBest=perf>prev;
  if(isBest) store.set(key,String(perf));
  $('rPerf').textContent=perf;
  $('rVerdict').textContent=
    perf===12?'Flawless. Every single one.':
    splats>=6?'The ground is winning':
    splats>=3?'Paperwork for the insurance team':
    perf>=10?'So close to all twelve':
    close>=4?'Living dangerously':
    splats===0?'Everyone walked away':'Mostly in one piece';
  $('rBadge').hidden=!(isBest&&prev>=0); $('rBadge').textContent='NEW BEST!';
  $('againBtn').className='btn';
  $('rPB').textContent=prev<0?'First jump with this setup.':isBest?`Up from ${prev}/12 on this setup.`:`Best on this setup: ${prev}/12`;
  $('stats').innerHTML=[['p',perf,'Perfect'],['c',close,'Misses'],['x',splats,'Splats'],['',S.best,'Best streak']]
    .map(([cl,v,l])=>`<div class="stat ${cl}"><strong>${v}</strong>${l}</div>`).join('');
  $('strip').style.setProperty('--n',S.humansN);
  $('strip').innerHTML=humans.map((d,n)=>{
    const cl=cls(d), tag=d.faulty?'pop':d.heavy?'big':d.plat?'lift':d.vent?'vent':'';
    return `<div class="tile ${cl}" style="--d:${(n*0.06).toFixed(2)}s" title="${cl}">${TILE_ICON[cl==='perfect'?'perfect':'miss']}${tag?`<i>${tag}</i>`:''}</div>`;
  }).join('');
  SFX.end(isBest&&prev>=0);
  $('endOv').hidden=false;$('endOv').scrollTop=0;endShownAt=performance.now();
}

// v6.7: one icon per meaning. Perfect = small open chute; any landing that cost a life = 💔;
// after the last life is gone nothing counts any more (grey dot), so a fail always shows exactly the lives that were lost.
const TICK_ICON='<svg class="ttick" viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-8,0.5 L-2.5,6 L8,-6" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const TILE_ICON={perfect:TICK_ICON,miss:'💔',none:'·'};
function showLevelEnd(){
  const n=S.level, L=LEVELS[n], N=S.humansN, humans=S.divers.filter(d=>!d.dummy);
  const cls=d=>d.rating==='perfect'?'perfect':d.lost?'miss':'none';
  const perf=humans.filter(d=>cls(d)==='perfect').length, close=humans.filter(d=>cls(d)==='miss').length;
  const passed=!S.failed;
  const st=passed?Math.max(0,S.hearts):0, prevSt=prog.stars[n]||0;   // stars = hearts left
  const nw=worldOf(n)+1, worldEnd=n%PER_WORLD===PER_WORLD-1&&nw<WORLDS.length;
  const wasOpen=worldEnd&&worldOpen(nw);
  if(st>prevSt) prog.stars[n]=st;
  prog.best[n]=Math.max(prog.best[n]||0,perf);
  lvFails[n]=passed?0:(lvFails[n]||0)+1;
  const earned=passed?Math.max(0,st-prevSt)*20+10+(S.best>=5?10:0):0;   // new stars x20, +10 finished, +10 streak of 5+
  prog.coins+=earned; if(passed&&prevSt===0) prog.wins++;
  saveProg();   // everything (stars, coins, wins, a world opened by these stars) is saved now; animations only show it
  const opensNow=worldEnd&&passed&&!wasOpen&&worldOpen(nw);
  renderCoinRow(earned); if(passed) renderTrack(); else $('rTrack').hidden=true;
  $('rMode').textContent=`Level ${levelLabel(n)}`;
  $('endOv').querySelector('.result').classList.toggle('lost',!passed);
  $('rFail').hidden=passed;
  let doneAt=600;   // when the result animations are over (ms)
  if(passed){
    // hearts first, then each one flips into a star: kept hearts -> gold stars, lost hearts -> empty stars
    $('rStars').innerHTML=[0,1,2].map(i=>`<span class="hs ${i<st?'on':'off'}" style="--d:${(0.45+i*0.32).toFixed(2)}s"><b class="h">${i<st?'❤':'♡'}</b><b class="s">★</b></span>`).join('');
    // the star chimes are the win jingle (no extra jingle on top)
    if(!reduceMotion) for(let i=0;i<st;i++) rt(()=>SFX.star(i),(0.45+i*0.32+0.3)*1000); else SFX.end(st>prevSt);
    doneAt=(0.45+2*0.32+0.3+0.4)*1000;
  } else {
    $('rStars').innerHTML=[0,1,2].map(i=>`<span class="bh" style="--d:${(0.15+i*0.12).toFixed(2)}s">💔</span>`).join('');
  }
  $('rPerf').textContent=perf; $('rTotal').textContent='/ '+N;
  $('rVerdict').textContent=!passed?(L.hearts?'No more lives':'Nobody splats on level 1. Try again!'):
    st===3?'Flawless. Every single one.':st===2?'One miss from flawless':'Passed!';
  $('rBadge').hidden=!(st>prevSt&&prevSt>0); $('rBadge').textContent=st>prevSt?'NEW STARS!':'NEW BEST!';
  $('rPB').textContent=!passed?(L.hearts?`Every landing that isn't perfect costs a ❤. You had ${L.hearts}.`:'Land every diver without a splat to pass.'):
    st<3?`${S.misses} miss${S.misses>1?'es':''}. Land all ${N} perfect for ★★★`:'Every diver landed perfectly.';
  $('stats').innerHTML=[['p',perf,'Perfect'],['c',close,'Lives lost'],['',S.best,'Best streak']]
    .map(([cl,v,l])=>`<div class="stat ${cl}"><strong>${v}</strong>${l}</div>`).join('');
  const strip=$('strip'); strip.className='strip'; strip.style.minHeight='';
  strip.style.setProperty('--n',N);
  strip.innerHTML=humans.map((d,i)=>{const c=cls(d);
    return `<div class="tile ${c}" style="--d:${(i*0.06).toFixed(2)}s">${TILE_ICON[c]}</div>`}).join('');
  if(passed&&perf===N){   // every landing perfect: "ALL PERFECT!" replaces the tiles at once
    const seq=resultSeq, t0=N*60+250+450;
    rt(()=>{ if(seq!==resultSeq) return;
      const chute='<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M-17,-2 A17,13 0 0 1 17,-2 Z" fill="#ffd23f" stroke="#a87400" stroke-width="2"/><path d="M-6,-2 A6,13 0 0 1 6,-2 Z" fill="#fff6c2"/><path d="M-16,-2 L0,14 M16,-2 L0,14 M0,-2 L0,14" stroke="#a87400" stroke-width="1.6"/><circle cx="0" cy="16" r="3" fill="#ffd23f" stroke="#a87400" stroke-width="1.5"/></svg>';
      strip.style.minHeight=strip.offsetHeight+'px'; strip.className='strip ap';   // keep the height so buttons don't jump
      strip.innerHTML=`<div class="allperf">${chute}<span>ALL PERFECT!</span>${chute}</div>`+
        Array.from({length:12},(_,i)=>{const a=i/12*Math.PI*2, r=70+Math.random()*60;
          return `<span class="spark" style="--x:${(Math.cos(a)*r).toFixed(0)}px;--y:${(Math.sin(a)*r*0.45).toFixed(0)}px;--sd:${(Math.random()*0.15).toFixed(2)}s">✦</span>`}).join('');
      SFX.chord();   // one warm chord (v6.7: was a second jingle + 4 rising high notes)
    },t0);
    doneAt=Math.max(doneAt,t0+1600);
  }
  // buttons; the last level of a world always shows the way to the next world
  const won=passed||prevSt>0;   // failed a replay of a level already won: Next is offered, Retry stays the main button
  const toWorld=worldEnd&&won, hasNext=toWorld||(won&&n<LEVELS.length-1&&unlocked(n+1));
  const nb=$('nextBtn'); nb.hidden=!hasNext; nb.classList.remove('popbtn'); nb.classList.toggle('wend',toWorld); nb.classList.toggle('ghost',!passed);
  nb.innerHTML='<i class="ico lg i-next" role="img" aria-label="Next level"></i>';
  $('againBtn').className=hasNext&&passed?'btn ghost':'btn';
  if(toWorld){
    // before the unlock animation the button shows the stars from BEFORE this run
    renderWorldBtn(nw,wasOpen,opensNow?totalStars()-Math.max(0,st-prevSt):null);
    if(opensNow){ const seq=resultSeq; rt(()=>{ if(seq===resultSeq) playWorldUnlock(nw); },reduceMotion?300:doneAt); }
  }
  $('endOv').hidden=false;$('endOv').scrollTop=0;endShownAt=performance.now();
  if(earned) startDoubleOffer(Math.max(DBL_OFFER_MS,reduceMotion?0:doneAt));
}
// the next-world button on the result screen of a world's last level; locked, it shows the stars and opens the popup
function renderWorldBtn(nw,open,before){
  const ts=before!=null?before:totalStars();
  $('nextBtn').innerHTML=open?`World ${nw+1} ▶`:`<span class="lock">🔒</span> World ${nw+1}<small>${ts}/${worldNeed(nw)}★</small>`;
}
function showWorldPop(nw){
  const ts=totalStars(), need=worldNeed(nw), gate=$('rGate');
  $('wpTitle').textContent=`🔒 World ${nw+1}`;
  $('wpNeed').textContent=`${need}★ needed · you have ${ts}★`;
  gate.hidden=ts<need-GATE_NEAR;
  gate.onclick=()=>watchAd(()=>{ prog.gate[nw]=1; saveProg(); $('wPop').hidden=true; playWorldUnlock(nw); });
  $('wPop').hidden=false;
}
$('wpClose').addEventListener('click',()=>{ $('wPop').hidden=true; });
$('wpLevels').addEventListener('click',()=>{ $('wPop').hidden=true; viewWorld=worldOf(curLevel); showLevels(true); });
function playWorldUnlock(nw){   // lock shakes, opens, UNLOCKED! stamp + confetti on the next-world button
  const b=$('nextBtn'), seq=resultSeq, lock=b.querySelector('.lock'); if(lock) lock.classList.add('shake');
  rt(()=>{ if(seq!==resultSeq) return;
    renderWorldBtn(nw,true); b.classList.add('popbtn');
    const cols=['#ff5a36','#ffd23f','#2fd88a','#4dabf7','#e8417a','#ffffff'];
    b.insertAdjacentHTML('beforeend','<div class="stamp">UNLOCKED!</div>'+(reduceMotion?'':Array.from({length:16},()=>`<i class="cf" style="background:${cols[Math.random()*cols.length|0]};--x:${(Math.random()*240-40).toFixed(0)}px;--y:${(-Math.random()*80-10).toFixed(0)}px;--r:${(Math.random()*720-360).toFixed(0)}deg"></i>`).join('')));
    SFX.worldOpen();
  },reduceMotion?0:550);
}

// ---------- result screen: coins + reward track ----------
// Coins are saved before any of this runs; the animations only show them arriving.
const FLY_N=10, FLY_GAP=45, FLY_MS=520, FLY_TOTAL=(FLY_N-1)*FLY_GAP+FLY_MS;
let flying=[];
function clearFlyCoins(){ for(const c of flying) c.remove(); flying=[]; }
function flyCoins(fromEl,toEl){
  const a=fromEl.getBoundingClientRect(), b=toEl.getBoundingClientRect(), x0=a.left+a.width/2, y0=a.top+a.height/2, dx=b.left+b.width/2-x0, dy=b.top+b.height/2-y0;
  for(let i=0;i<FLY_N;i++){
    const c=document.createElement('i'); c.className='coin flycoin'; c.style.left=x0+'px'; c.style.top=y0+'px';
    document.body.appendChild(c); flying.push(c);
    c.animate([{transform:'translate(0,0) scale(.8)',opacity:1},{transform:`translate(${dx/2}px,${dy/2-34}px) scale(1.15)`,opacity:1,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(.7)`,opacity:1}],
      {duration:FLY_MS,delay:i*FLY_GAP,easing:'ease-in',fill:'both'}).onfinish=()=>{ c.remove(); flying=flying.filter(x=>x!==c); };
  }
}
function popEl(el){ el.animate([{transform:'scale(1)'},{transform:'scale(1.28)'},{transform:'scale(1)'}],{duration:280,easing:'ease-out'}); }
function countUp(el,from,to,ms,alive){
  const t0=performance.now();
  const step=()=>{ if(!alive()) return; const f=Math.min(1,(performance.now()-t0)/ms);
    el.textContent=Math.round(from+(to-from)*f); if(f<1) requestAnimationFrame(step); };
  step();
}
let coinFx=null;   // what the result's coin row has shown so far: the total on screen, and coins not yet sent to it
function sendCoins(){
  const fx=coinFx; if(!fx||!fx.pend) return;
  const seq=resultSeq, from=fx.shown, to=from+fx.pend, tot=$('rCoinTotal'), pill=$('rTotalPill'); fx.pend=0; fx.shown=to;
  if(reduceMotion){ tot.textContent=to; popEl(pill); SFX.coin(); return; }
  flyCoins($('rCoinIco'),pill);
  rt(()=>countUp(tot,from,to,FLY_TOTAL-FLY_MS,()=>seq===resultSeq),FLY_MS);
  rt(()=>{ tot.textContent=to; popEl(pill); SFX.coin(); },FLY_TOTAL);
}
function renderCoinRow(earned){
  const el=$('rCoins'); coinFx=null; if(!earned){ el.innerHTML=''; return; }
  coinFx={shown:prog.coins-earned,pend:earned};
  el.innerHTML=`<i class="coin" id="rCoinIco"></i><span>+<span id="rCoinN">${earned}</span></span><button class="btn" id="dblBtn">${AD_ICO} ×2</button><span class="coinpill" id="rTotalPill"><i class="coin"></i><span id="rCoinTotal">${coinFx.shown}</span></span>`;
  $('dblBtn').onclick=()=>{ clearTimeout(coinFx.offerT); const ring=$('dblBtn').querySelector('.drainring'); if(ring) ring.remove(); watchAd(()=>{
    prog.coins+=earned; saveProg(); coinFx.pend+=earned;
    const b=$('dblBtn'), n=$('rCoinN'), seq=resultSeq; b.disabled=true; b.textContent='Doubled!';
    popEl(n.parentElement);
    if(reduceMotion){ n.textContent=earned*2; sendCoins(); return; }
    countUp(n,earned,earned*2,650,()=>seq===resultSeq);
    rt(()=>{ popEl(n.parentElement); sendCoins(); },750);
  },endDoubleOffer); };
}
// ×2 is offered once, for a few seconds: coins only leave for the total when it's over, and running out or closing the ad removes the button.
const DBL_OFFER_MS=5000;
function startDoubleOffer(ms){ const b=$('dblBtn'); drainRing(b,ms,parseFloat(getComputedStyle(b).borderTopLeftRadius)); coinFx.offerT=rt(endDoubleOffer,ms); }
function endDoubleOffer(){ const b=$('dblBtn'); b.disabled=true; b.style.visibility='hidden'; sendCoins(); }   // hidden, not removed, so the row doesn't jump
function drawSilhouette(cv,kind,id,frac){
  const off=document.createElement('canvas'); off.width=cv.width; off.height=cv.height; itemThumb(off,kind,id);
  const g=cv.getContext('2d'); g.clearRect(0,0,cv.width,cv.height);
  g.drawImage(off,0,0); g.globalCompositeOperation='source-in'; g.fillStyle='#0b1526'; g.fillRect(0,0,cv.width,cv.height); g.globalCompositeOperation='source-over';
  if(frac>0){ const h=cv.height*Math.min(1,frac); g.save(); g.beginPath(); g.rect(0,cv.height-h,cv.width,h); g.clip(); g.drawImage(off,0,0); g.restore(); }
}
function celebrateClaim(el,kind,id,obj,old){   // item pops out, rays, UNLOCKED! stamp, confetti, Equipped + Keep old; then the next reward
  const seq=resultSeq, cols=['#ff5a36','#ffd23f','#2fd88a','#4dabf7','#e8417a','#ffffff'];
  el.className='track reveal';
  el.innerHTML=`<div class="tcan"><div class="rays"></div><canvas width="136" height="136"></canvas></div>
    <div style="flex:1;min-width:0"><div class="tt">${obj.name}</div><span class="eq">✓ Equipped</span><button class="keepold">Keep old</button></div>
    <div class="stamp">UNLOCKED!</div>`+
    Array.from({length:16},()=>`<i class="cf" style="background:${cols[Math.random()*cols.length|0]};--x:${(Math.random()*220-60).toFixed(0)}px;--y:${(-Math.random()*90-10).toFixed(0)}px;--r:${(Math.random()*720-360).toFixed(0)}deg"></i>`).join('');
  itemThumb(el.querySelector('canvas'),kind,id);
  const keep=el.querySelector('.keepold'), KEEP_MS=4000; drainRing(keep,KEEP_MS,keep.offsetHeight/2);
  keep.onclick=()=>{ prog.sel[kind]=old; saveProg(); keep.remove(); el.querySelector('.eq').textContent='✓ In your Store'; };
  SFX.end(true); rt(()=>SFX.star(2),180);
  rt(()=>{ if(seq!==resultSeq) return; el.classList.add('fadeout');
    rt(()=>{ if(seq!==resultSeq) return; renderTrack(); },300); },KEEP_MS);
}
function renderTrack(){
  const el=$('rTrack'), it=trackItem(); if(!it||prog.rlv>=REWARD_LV.length){ el.hidden=true; return; }
  const [kind,id]=it, obj=LISTS[kind].find(x=>x.id===id), kn=KIND_NAME[kind];
  const lv=REWARD_LV[prog.rlv], prev=prog.rlv?REWARD_LV[prog.rlv-1]:-1, span=lv-prev;
  let got=0; for(let i=prev+1;i<=lv;i++) if(prog.stars[i]>0) got++;
  const due=prog.stars[lv]>0, free=prog.rlv===0, justWon=S&&S.level>prev&&S.level<=lv&&!S.failed;
  el.hidden=false; el.className='track'+(due?' reveal':'');
  el.innerHTML=`<canvas width="136" height="136"></canvas><div style="flex:1;min-width:0">`+(due
    ?`<div class="tt">New ${kn}: ${obj.name}!</div><div class="ts">${free?'A free gift for you':'Skip it and it waits in the Store'}</div><div class="tacts"></div>`
    :`<div class="tt">Next ${kn}</div><div class="ts">Unlocks at Level ${levelLabel(lv)}</div><div class="tbar"><i style="width:${(justWon?Math.max(0,got-1):got)/span*100}%"></i></div>`)+`</div>`;
  drawSilhouette(el.querySelector('canvas'),kind,id,due?1:got/span);
  if(!due){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ const i=el.querySelector('.tbar i'); if(i) i.style.width=(got/span*100)+'%'; })); return; }
  const used=()=>{ prog.trackDone++; prog.rlv++; saveProg(); };
  const acts=el.querySelector('.tacts');
  const claim=document.createElement('button'); claim.className='btn'; claim.innerHTML=free?'Claim':`${AD_ICO} Claim`;
  claim.onclick=()=>{ const go=()=>{ const old=prog.sel[kind]; grant(kind,id,true); used(); celebrateClaim(el,kind,id,obj,old); }; free?go():watchAd(go); };
  acts.appendChild(claim);
  if(!free){ const no=document.createElement('button'); no.className='btn ghost'; no.textContent='No thanks';
    no.onclick=()=>{ used(); renderTrack(); }; acts.appendChild(no); }
}
