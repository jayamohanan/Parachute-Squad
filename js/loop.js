// ---------- loop ----------
// Level 1 tutorial: the world eases to a stop with the first diver centred in its band, until the player taps.
function tutScale(dtReal){
  const tu=S&&S.tut; if(!tu) return 1;
  const d=S.divers[tu.idx];
  if(!tu.done&&(d.opened||d.state==='landed')){tu.done=true;tu.show=false}
  if(tu.done){ tu.k=Math.min(1,tu.k+dtReal*3); return tu.k }
  if(d.state==='fall'){
    const h=groundAt(d,S.t)-d.y, hc=d.dmin+d.band*0.5;
    if(h<hc+0.07){ tu.show=true; tu.k=Math.max(0,(h-hc)/0.07); if(tu.k<0.05&&!tu.frozenAt) tu.frozenAt=performance.now(); return tu.k }
  }
  tu.k=1; return 1;
}
let runId=0;   // each jump gets its own id so a restart never leaves an old loop running
function loop(ts,id){
  if(id!==runId) return;
  const dt=Math.min(0.05,(ts-lastTS)/1000||0);lastTS=ts;
  if(running&&S) update(dt*tutScale(dt));
  draw();
  if(running) requestAnimationFrame(t=>loop(t,id));
}
function start(skipIntro){
  leaveResult();
  setPanel(false);
  if(!skipIntro&&settings.mode==='levels'&&!training){
    const f=INTROS.find(x=>x.level===curLevel);
    if(f&&!(prog.seen||[]).includes(f.key)){ stopRun(); showHow('intro',f); return; }
  }
  if(settings.mode==='levels') newLevelRound(training?-1:curLevel); else newRound();
  $('startOv').hidden=true;$('endOv').hidden=true;$('levelsOv').hidden=true;
  SFX.unlock(); SFX.droneStart();
  const id=++runId;
  running=true;lastTS=performance.now();requestAnimationFrame(t=>loop(t,id));
}
function restart(){
  // From the level screen (nothing running), level 1 always goes through the how-to-play card.
  stopRun(); start();
}
$('restartBtn').addEventListener('click',e=>{setDev(false);restart();e.currentTarget.blur()});
addEventListener('keydown',e=>{ if(e.code==='KeyR'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&$('adOv').hidden&&$('shopOv').hidden){e.preventDefault();restart()} });
$('startBtn').addEventListener('click',start);
$('againBtn').addEventListener('click',start);
$('nextBtn').addEventListener('click',()=>{ if(curLevel<LEVELS.length-1&&unlocked(curLevel+1)){curLevel++;start()} });
$('lvBtn').addEventListener('click',showLevels);
$('menuBtn').addEventListener('click',e=>{setDev(false);showLevels();e.currentTarget.blur()});
function stopRun(){ SFX.droneStop(); running=false; runId++; }
let viewWorld=null;
$('wPrev').addEventListener('click',()=>{ if(viewWorld>0){viewWorld--; showLevels(true)} });
$('wNext').addEventListener('click',()=>{ if(viewWorld<WORLDS.length-1){viewWorld++; showLevels(true)} });
$('unlockAll').addEventListener('click',()=>{ prog.unlockAll=!prog.unlockAll; saveProg(); showLevels(true) });
function showLevels(keepWorld){
  if(!$('endOv').hidden) leaveResult();
  stopRun(); S=null; training=false; $('gradOv').hidden=true;
  $('startOv').hidden=true;$('endOv').hidden=true;
  const g=$('lvgrid'); g.innerHTML='';
  let nextUp=LEVELS.findIndex((_,n)=>unlocked(n)&&!(prog.stars[n]>0)); if(nextUp<0) nextUp=-1;
  if(keepWorld!==true||viewWorld==null) viewWorld=worldOf(nextUp>=0?nextUp:Math.min(curLevel,LEVELS.length-1));
  const vw=viewWorld;
  $('wName').textContent=`World ${vw+1} · ${WORLDS[vw].name}`;
  $('wPrev').disabled=vw===0; $('wNext').disabled=vw===WORLDS.length-1;
  $('unlockAll').textContent=prog.unlockAll?'Lock levels again (testing)':'Unlock all levels (testing)';
  LEVELS.forEach((L,n)=>{ if(worldOf(n)!==vw) return;
    const b=document.createElement('button'), st=prog.stars[n]||0, open=unlocked(n);
    b.className='lv'+(n===nextUp?' next':''); b.disabled=!open; b.title=L.name;
    b.innerHTML=`${open?n%PER_WORLD+1:'🔒'}<small>${open?'★'.repeat(st):''}</small>`;
    if(n===0&&nextUp===0&&prog.trained){   // first visit after training: a tapping hand invites the player to Level 1
      b.insertAdjacentHTML('beforeend',`<span class="lvring"></span><span class="lvhand" aria-hidden="true"><svg viewBox="-14 -22 30 42"><path d="M-6,-16 A3,3 0 0 1 0,-16 L0,-4 L9,-2 Q14,0 13,8 L11,16 L-4,16 L-10,6 Q-12,1 -7,2 L-6,4 Z" fill="#fff" stroke="#132238" stroke-width="2.5" stroke-linejoin="round"/></svg></span>`); }
    b.addEventListener('click',()=>{curLevel=n; training=false; start()});
    g.appendChild(b);
  });
  refreshCoins();
  const nw=vw+1, ts=worldStars(vw);
  if(nw<WORLDS.length){ const open2=worldOpen(nw), canGate=!open2&&ts>=GATE_MIN;
    $('w2').innerHTML=`<span class="lock">${open2?'🔓':'🔒'}</span><div style="flex:1;min-width:0"><b>World ${nw+1} · ${WORLDS[nw].name}</b>
      <span>${open2?'Unlocked! Tap › to go there.':`Collect ${W_NEED}★ in World ${vw+1} to unlock · you have ${ts}★`}</span></div>`+
      (canGate?`<button class="gatebtn" id="gateBtn">▶ Unlock now</button>`:`<div class="bar2"><i style="width:${Math.min(100,ts/W_NEED*100).toFixed(0)}%"></i></div>`);
    if(canGate) $('gateBtn').onclick=()=>watchAd(()=>{ prog.gate[nw]=1; saveProg(); viewWorld=nw; showLevels(true); });
  } else $('w2').innerHTML=`<span class="lock">🚧</span><div><b>More worlds coming</b><span>World ${vw+1}: ${ts}★ of 30</span></div>`;
  $('levelsOv').hidden=false; draw();
}
function applyMode(){
  document.body.classList.toggle('levels',settings.mode==='levels');
  $('againBtn').textContent=settings.mode==='levels'?'Retry':'Jump again';
}
function enterMode(){
  applyMode(); stopRun(); S=null; setPanel(false); $('shopOv').hidden=true; $('gradOv').hidden=true;
  if(settings.mode==='levels'){ showLevels(); if(!prog.trained){ curLevel=0; showHow('start'); } }
  else { $('levelsOv').hidden=true;$('endOv').hidden=true;$('startOv').hidden=false; draw(); }
}
