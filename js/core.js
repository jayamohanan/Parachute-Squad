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
