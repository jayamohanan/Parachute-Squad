// ---------- TEMPORARY: on-screen ad log, to find out why the fake ad card doesn't show on phones. Delete this file and its <script> line once solved. ----------
const adLog=(()=>{
  let box=null;
  const write=t=>{
    if(!box){ box=document.createElement('div');
      box.style.cssText='position:fixed;left:0;right:0;top:0;z-index:99999;max-height:45vh;overflow:auto;padding:6px 8px;background:#000c;color:#7fff9f;font:11px/1.35 monospace;white-space:pre-wrap;word-break:break-word';
      box.addEventListener('click',()=>{ box.remove(); box=null; });
      document.body.appendChild(box); }
    box.textContent+=`${(performance.now()/1000).toFixed(2)} ${t}\n`;
    box.scrollTop=box.scrollHeight;
  };
  return write;
})();
function adSnap(label){
  const ov=$('adOv'), cs=getComputedStyle(ov), r=ov.getBoundingClientRect(), top=document.elementFromPoint(innerWidth/2,innerHeight/2);
  adLog(`${label}: hidden=${ov.hidden} display=${cs.display} vis=${cs.visibility} op=${cs.opacity} z=${cs.zIndex} box=${r.x|0},${r.y|0} ${r.width|0}x${r.height|0} fill=${$('adFill').getBoundingClientRect().width|0} topEl=${top?(top.id||top.className||top.tagName):'none'}`);
}
{
  const realWatchAd=watchAd;
  watchAd=function(onDone,onCancel){
    adLog(`watchAd called, screen ${innerWidth}x${innerHeight}`);
    realWatchAd(()=>{ adSnap('ad finished'); if(onDone) onDone(); },onCancel);
    adSnap('at once');
    requestAnimationFrame(()=>requestAnimationFrame(()=>adSnap('next frame')));
    setTimeout(()=>adSnap('at 1s'),1000);
  };
}
addEventListener('pointerdown',e=>{
  const b=e.target.closest&&e.target.closest('button');
  if(b&&(b.querySelector('.i-ad')||b.classList.contains('ad'))) adLog(`pressed ad button ${b.id||b.className} disabled=${b.disabled}`);
},{capture:true,passive:true});
addEventListener('error',e=>adLog(`ERROR ${e.message} (${e.lineno})`));
addEventListener('unhandledrejection',e=>adLog(`REJECTED ${e.reason}`));
