function syncUI(){
  document.querySelectorAll('.seg[data-key]').forEach(seg=>{
    const v=String(settings[seg.dataset.key]);
    seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v?'true':'false'));
  });
  const n=VKEYS.filter(k=>settings[k]!=='off').length;
  $('vcount').textContent=n; $('vcount').hidden=n===0;
}
document.querySelectorAll('.seg[data-key]').forEach(seg=>{
  seg.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b) return;
    const key=seg.dataset.key; let v=b.dataset.v; if(key==='countIn') v=+v;
    settings[key]=v; store.set('chuteRhythm.v3.settings',JSON.stringify(settings));
    if(key==='sound'){ SFX.set(v==='on'); if(v==='on') SFX.unlock(); }
    if(key==='mode'){ syncUI(); b.blur(); enterMode(); return; }
    syncUI(); b.blur(); if(!running) draw();
  });
});
const vpanel=$('vpanel'),vbtn=$('vbtn');
function setPanel(open){vpanel.hidden=!open;vbtn.setAttribute('aria-expanded',open?'true':'false');
  if(open) vpanel.style.top=(document.querySelector('#app>.bar').offsetHeight)+'px'}
function setDev(open){ document.body.classList.toggle('devclosed',!open); const t=$('devTog');
  t.setAttribute('aria-expanded',open?'true':'false'); t.textContent=open?'✕':'⚙'; t.setAttribute('aria-label',open?'Hide controls':'Show controls');
  if(!open) setPanel(false); }
$('devTog').addEventListener('click',e=>{ setDev(document.body.classList.contains('devclosed')); e.currentTarget.blur(); });
vbtn.addEventListener('click',()=>{setPanel(vpanel.hidden);vbtn.blur()});
