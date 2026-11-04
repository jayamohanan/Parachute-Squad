// ---------- input ----------
// Which hint to show: the last input type wins (touch → "Tap anywhere", keyboard → "Press Space").
let inputMode=(window.matchMedia&&matchMedia('(pointer: coarse)').matches)?'touch':'key';
addEventListener('pointerdown',e=>{ if(e.pointerType==='touch'||e.pointerType==='pen') inputMode='touch'; },{capture:true,passive:true});
addEventListener('keydown',()=>{ inputMode='key'; },{capture:true,passive:true});
function roundRect(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function tap(){
  if(paused){ resumeRun(); return; }      // this tap only brings the game back
  if(!running||(S&&S.failed)) return;   // caught / out of hearts: input is locked
  if(S&&S.offerEnd!=null){ endOffer(true); return; }   // this tap only starts the level
  const d=current(); if(!d||d.state==='pre') return;   // chute hasn't popped yet: nothing to open
  // Level 1 tutorial: ignore blind taps before the finger shows. A tap once it shows always counts: if the diver is still easing into the band, it fires on arrival.
  if(S.tut&&!S.tut.done&&d.i===S.tut.idx&&groundAt(d,S.t)-d.y>d.dmin+d.band){ if(S.tut.show) S.tut.queued=true; return; }
  if(S.t-d.tDrop<DROP_GUARD) return;               // fresh out of the plane: ignore stray/double taps
  const g=groundAt(d,S.t), h=g-d.y, b=d.band;
  if(d.plat) d.plat.frozen=g;                       // any tap freezes the lift
  d.opened=true; d.openY=d.y; d.vOpen=d.v; d.state='chute'; d.chuteT=0;
  let r,col;
  const m=d.dmin;
  if(h>m+3*d.bandBase){r='early';col='#d7e6ff'}
  else if(h>m+b){r='good';col='#bff5d6'}
  else if(h>=m){r='perfect';col='#2fd88a'}
  else if(h>=m*LATE_OK){r='late';col='#ffb547'}
  else {r='toolate';col='#ff6b4a'}
  d.rating=r;
  const label=r==='perfect'?'PERFECT':'';   // only perfects get a word; misses show a breaking heart
  SFX.chute();
  if(!d.dummy){
    if(r==='perfect'){S.streak++;S.best=Math.max(S.best,S.streak);S.perf++} else S.streak=0;
    SFX.rate(r,S.streak);
    const inRadar=S.radar&&r!=='perfect'&&d.y>RADAR_CEIL&&d.y<radarAt(d.wx);   // canopy opened inside the radar zone
    if(inRadar){ d.spotT=S.t; SFX.siren(); }
    if(r!=='perfect'){ if(inRadar&&S.heartsMax) caught(d); else loseHeart(d); }
    if(label) pop(d.wx,d.y-0.05,S.streak>1?`PERFECT ×${S.streak}`:label,col,1.25);
  } else {
    if(r!=='toolate') SFX.rate(r==='perfect'?'good':r,0);
    if(label) pop(d.wx,d.y-0.05,label,col,0.9);
  }
}
stage.addEventListener('pointerdown',e=>{
  if(e.target!==cv) return;
  if(!document.body.classList.contains('devclosed')){ setDev(false); if(!running) return; }   // tapping the game closes the controls
  if(!vpanel.hidden){ setPanel(false); if(!running) return; }
  e.preventDefault(); tap();
});
let endShownAt=0;
addEventListener('keydown',e=>{
  if(running&&(e.code==='ArrowUp'||e.code==='KeyW')){ e.preventDefault(); tap(); return; }   // extra jump keys during play
  if(e.code==='Space'||e.code==='ArrowDown'||e.code==='Enter'){
    if(running){e.preventDefault();tap();return}
    if(!$('adOv').hidden||!$('shopOv').hidden) return;
    if(e.code==='Enter') return;
    if(!$('gradOv').hidden){e.preventDefault();const b=$('gradActs').querySelector('.btn');if(b)b.click();return}
    if(!$('startOv').hidden){e.preventDefault();start()}
    else if(!$('levelsOv').hidden){e.preventDefault();let n=gridNext(viewWorld); if(n<0) n=worldOf(curLevel)===viewWorld?curLevel:viewWorld*PER_WORLD; if(unlocked(n)){curLevel=n; training=false; start()}}
    else if(!$('howOv').hidden){e.preventDefault();$('howBtn').click()}
    else if(!$('wPop').hidden){e.preventDefault();$('wPop').hidden=true}
    else if(!$('endOv').hidden&&performance.now()-endShownAt>500){e.preventDefault();
      if(settings.mode==='levels'&&!$('nextBtn').hidden&&!$('nextBtn').classList.contains('ghost')) $('nextBtn').click(); else $('againBtn').click()}
  }
});

function loseHeart(d){
  if(!S||S.failed) return;   // after the last life is gone nothing else counts (v6.7)
  d.lost=true;               // this landing cost a life: the result strip shows 💔 for it
  S.pops.push({wx:d.wx,y:d.y-0.06,kind:'heart',text:'',color:'',size:1,t:0});   // broken heart where it happened
  SFX.heart();
  if(S.level==null) return;
  S.misses++;
  if(!S.heartsMax) return;
  S.hearts--; S.heartLostT=S.t;
  if(S.hearts<=0){ S.failed=true; S.frozenAt=performance.now(); S.endAt=S.t+1.5; S.banner={text:'NO MORE LIVES',t:0,dur:1.5,col:'#ff6b5e'}; SFX.droneStop(); SFX.fail(); }
}
function caught(d){   // spotted by radar: the level ends on the spot
  if(!S||S.failed) return;
  d.lost=true;
  S.pops.push({wx:d.wx,y:d.y-0.06,kind:'heart',text:'',color:'',size:1,t:0});
  S.misses++; S.hearts=0; S.heartLostT=S.t;
  S.failed=true; S.endAt=null; SFX.droneStop();
  S.col={d,ct:0,ev:{},post:nearestPost(d.wx),shots:[],smoke:[],tumblers:[],plane:null,smokeAcc:0};
}
