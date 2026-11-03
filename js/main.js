// test hook (read-only view of a run, used for automated checks)
// wake the audio on any gesture (iOS needs one after a phone lock) and try again when the tab comes back
for(const ev of ['pointerdown','touchend','keydown']) addEventListener(ev,()=>SFX.unlock(true),{capture:true,passive:true});
const wentAway=()=>{ pauseRun(); SFX.stale(); };
document.addEventListener('visibilitychange',()=>{ if(document.hidden) wentAway(); else SFX.unlock(false); });
addEventListener('blur',wentAway); addEventListener('pagehide',wentAway);
window.__chute={state:()=>S,current,tap,ground:d=>groundAt(d,S.t),playLevel:n=>{curLevel=n;training=false;start(true)},sfx:SFX.debug,
  playTraining:then=>startTraining(then||'level1')};

new ResizeObserver(resize).observe(stage);
const cardFit=new ResizeObserver(fitCards);   // fires when the screen resizes, a card opens or its content changes
cardFit.observe(stage); fitList.forEach(c=>cardFit.observe(c));
syncUI();
enterMode();
resize();
