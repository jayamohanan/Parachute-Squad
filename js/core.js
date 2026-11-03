const $=id=>document.getElementById(id);
const cv=$('cv'),stage=$('stage');
let ctx=cv.getContext('2d');   // swapped briefly to draw the how-to-play card
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const store={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};

// ---------- settings (remembered in this browser) ----------
const DEF={mode:'levels',ground:'steps',tempo:'med',band:'normal',countIn:3,sound:'on',ring:'off',radar:'on',platforms:'off',faulty:'off',heavy:'off',dive:'off',vents:'off',clouds:'off'};
const settings=Object.assign({},DEF);
try{const s=JSON.parse(store.get('chuteRhythm.v3.settings')||'{}');for(const k in DEF) if(k in s) settings[k]=s[k]}catch(e){}
const VKEYS=['platforms','faulty','heavy','dive','vents','clouds'];
let S=null, running=false, lastTS=0;
const AD_ICO='<i class="ico i-ad" role="img" aria-label="Watch ad"></i><b class="adtag">AD</b>';   // every rewarded-ad button starts with this
// Countdown stroke around a button: full at the start, draining anticlockwise back to top centre.
function drainRing(el,ms,r){
  const old=el.querySelector('.drainring'); if(old) old.remove();
  if(reduceMotion) return;
  const w=el.offsetWidth, h=el.offsetHeight, R=r-1, x0=1, y0=1, x1=w-1, y1=h-1, a=`A${R} ${R} 0 0 1`;
  el.insertAdjacentHTML('beforeend',`<svg class="drainring" width="${w}" height="${h}" style="left:${-el.clientLeft}px;top:${-el.clientTop}px" aria-hidden="true"><path pathLength="1" style="animation-duration:${ms}ms" d="M${w/2} ${y0}H${x1-R}${a} ${x1} ${y0+R}V${y1-R}${a} ${x1-R} ${y1}H${x0+R}${a} ${x0} ${y1-R}V${y0+R}${a} ${x0+R} ${y0}Z"/></svg>`);
}
