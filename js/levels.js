// ---------- tuning (vertical units are fractions of canvas height) ----------
const HUMANS=12;
const PLANE_Y=0.13, BASE=0.9;
const V0=0.08, VMAX=0.38, ACC=0.9, VC=0.07;
const VMAX_H=0.47, ACC_H=1.08;          // heavy divers
const DMIN=0.09;                        // height a chute needs to slow the diver
const BAND=0.045;                       // perfect band at normal speed (~120 ms)
const LATE_OK=0.62;                     // opened at >= 62% of the braking height: close call; below: splat
// Slow divers (in steam) need less height to brake, so their band sits lower: braking height scales with speed.
const VPRE=0.11;                        // drift speed under a faulty chute
const POP_MIN=0.3, FREEFALL_MIN=0.75;   // faulty chute pops >= 0.3 s after jump, leaving >= 0.75 s of free fall before the band
const VIEW_BEATS=3.7;                   // a faulty diver's band opens within this many beats of the jump: at phone width the left edge is 4.7 beats behind the plane
const VVENT=0.22, STEAM_H=0.32;         // updraft: speed inside steam, steam column height
const PL_LIFT=0.05, PL_AMP=0.04, PL_W=2*Math.PI/2.6; // moving platform
const DIVE_D=0.14;                      // plane dive depth
const CLOUD_EMERGE=0.3;                 // a diver comes out of the cloud this many seconds before its band
const CLOUD_TH=0.17;                    // cloud bank thickness
const CLOUD_DIP=0.09;                   // max dip of the cloud base between neighbouring landings
const MIN_GAP=0.15;                     // all-perfect check: next band window must open >= this after the previous one
const SIM_DT=1/240;
const TEMPO={slow:1.1,med:0.85,fast:0.65};
const BANDSCALE={normal:1,thin:0.75,razor:0.55,wide:2};   // perfect window ≈ 120 / 90 / 65 ms; wide: dev only, to try the helper
const HELPERS_ON=false;                 // ad helpers are hidden for now (user's choice); true brings the retry offer back
const HELP_WIDE=2, HELP_OFFER=2.5;      // Wide green helper: band ×2 (grows upward only); seconds the retry offer stays up

const SUITS=['#ff5a36','#3a7bf0','#9b5cf6','#e8417a','#16a3a3','#f08a24','#4c6ef5','#d6336c','#12b886','#7048e8','#e8590c','#1c7ed6'];
// Chance inside a level comes from a seed, so a level plays the same every time and a playtest holds for everyone. The sandbox stays random.
let rng=Math.random;
function seedRng(s){ rng=()=>{ s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296 } }
const rnd=(a,b)=>a+rng()*(b-a);
const pickSome=(arr,n)=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,n)};
const nightDots=Array.from({length:40},()=>({x:Math.random(),y:Math.random()*0.55,r:0.7+Math.random()*0.7}));
const bgClouds=Array.from({length:9},()=>({x:Math.random(),y:0.16+Math.random()*0.42,s:0.7+Math.random()*0.8}));

// ---------- World 1 levels ----------
// d: landing height per diver (0 ground, .06 low roof, .12 mid, .18 tall); 'gap' = the plane skips a drop.
// Every level has 3 hearts; every non-perfect landing costs one; lose all three and the level fails on the spot.
// Stars = hearts left at the end (shown as hearts turning into stars on the result screen).
const Lo=0.06, Mi=0.12, Ta=0.18;
// Training jump: outside the level list. No hearts, can't fail, no stars; flows straight into Level 1 the first time.
const TRAINING={name:'Training jump', tempo:'slow', dummies:0, hearts:0, tut:true, d:[0,0,0,0,0,0]};
const LEVELS=[
  {name:'Find the beat',    tempo:'slow', dummies:0, hearts:3, d:[0,0,0,0,0,0]},
  {name:'Picking up speed', tempo:'med',  dummies:0, hearts:3, d:[0,0,0,0,0,0,0,0]},
  {name:'Hold your nerve',  tempo:'med',  dummies:0, hearts:3, d:[0,0,0,0,'gap',0,0,0,0]},
  {name:'First rooftop',    tempo:'slow', dummies:0, hearts:3, d:[0,0,0,0,Lo,0,0,0,0]},
  {name:'Rooftops',         tempo:'med',  dummies:0, hearts:3, d:[0,Lo,0,0,Lo,0,Lo,0,0,Lo]},
  {name:'Stairs',           tempo:'med',  dummies:0, hearts:3, d:[0,0.04,0.08,0.12,0.08,0.04,0,0.04,0.08,0]},
  {name:'Double tap',       tempo:'slow', dummies:0, hearts:3, d:[0,Lo,0,Mi,0,0,Mi,Lo,0,Mi]},
  {name:"Don't rush",       tempo:'med',  dummies:0, hearts:3, d:[0,Lo,0,Mi,0,Lo,0,Mi,0,Lo]},
  {name:'Skyline',          tempo:'med',  dummies:0, hearts:3, d:[0,Mi,0,Ta,Lo,0,Ta,Mi,0,Ta]},
  // World 1 finale: stairs up, sudden drop (bait), two ground→rooftop double taps, stairs down.
  {name:'Grand finale',     tempo:'med',  dummies:0, hearts:3, d:[0,Lo,Mi,Ta,0,Mi,0,Ta,Lo,0]},
];
// ---------- Worlds 2-5 ----------
// Entries: a number = plain landing height; V(h) steam vent on a roof, P(h) moving lift, F(h) faulty chute.
// Level options: band 'normal'|'thin'|'razor', clouds 'off'|'patchy'|'full', seed (lift positions, chute pops, clouds; default = level number; change it to get a different arrangement).
const Hi=0.24;
const V=h=>({h:Math.max(h,Lo),vent:true}), P=h=>({h,plat:true}), F=h=>({h,faulty:true});
const L3=(name,tempo,d,o={})=>Object.assign({name,tempo,dummies:0,hearts:3,d},o);
LEVELS.push(
  // World 2 · City rooftops — taller roofs, Fast tempo, thin bands; steam vents from Level 14
  L3('Rush hour','med',[0,Mi,Ta,Mi,0,Ta,Hi,Ta,Mi,0]),
  L3('Fast lane','fast',[0,Lo,0,Lo,Mi,0,Mi,Lo,0,Mi]),
  L3('High rise','fast',[Mi,Ta,Hi,Ta,Mi,Ta,Hi,Mi,Ta,Hi]),
  L3('Steam','slow',[0,Lo,0,V(Lo),0,Lo,0,V(Mi),0,Lo]),
  L3('Hot air','med',[0,V(Lo),Mi,0,V(Mi),Lo,0,Ta,V(Lo),0]),
  L3('Wait for it','med',[Mi,Mi,V(Mi),Mi,Mi,V(Mi),Mi,Mi,Mi,V(Mi)]),
  L3('Thin air','med',[0,Lo,Mi,Ta,Mi,Lo,0,Mi,Ta,0],{band:'thin'}),
  L3('Steam stairs','fast',[0,V(Lo),Mi,V(Ta),0,Lo,V(Mi),Ta,0,V(Lo)]),
  L3('Smog','fast',[Mi,V(Ta),0,Hi,V(Mi),0,Ta,V(Lo),Hi,0],{band:'thin'}),
  L3('Rooftop finale','fast',[0,Lo,Mi,V(Ta),Hi,0,V(Mi),Ta,0,V(Hi)],{band:'thin'}),
  // World 3 · Base elevators — moving lifts (a tap freezes the lift)
  L3('Going up','slow',[0,0,P(0),0,0,P(0),0,0,P(0),0]),
  L3('Lifts','slow',[0,P(0),Lo,P(Lo),0,P(0),Lo,0,P(Lo),0]),
  L3('Elevator music','med',[P(0),0,P(0),0,P(0),0,P(0),0,P(0),0]),
  L3('Up and down','med',[0,P(Lo),Mi,P(0),Lo,P(Mi),0,P(Lo),Mi,0]),
  L3('Double lift','med',[0,P(0),P(0),Mi,0,P(Lo),P(Lo),0,Mi,P(0)]),
  L3('Steam lift','med',[0,P(Lo),V(Lo),0,P(Mi),V(Mi),Lo,P(0),V(Lo),0]),
  L3('Thin lift','med',[0,P(0),Lo,P(Lo),Mi,P(Mi),0,P(0),Ta,P(Lo)],{band:'thin'}),
  L3('Fast floors','fast',[0,P(0),Lo,0,P(Lo),Mi,0,P(Mi),Lo,P(0)]),
  L3('Shaft','fast',[P(0),P(Lo),P(Mi),P(Lo),P(0),P(Lo),P(Mi),P(Ta),P(Mi),P(Lo)]),
  L3('Base elevators','fast',[0,P(Lo),V(Mi),Ta,P(0),V(Lo),Hi,P(Mi),0,P(Ta)],{band:'thin'}),
  // World 4 · Cloud cover — divers only come out of the cloud just above their band
  L3('Fog','slow',[0,0,0,0,0,0,0,0,0,0],{clouds:'patchy'}),
  L3('Cloud cover','slow',[0,Lo,0,Lo,0,Mi,0,Lo,0,Mi],{clouds:'full'}),
  L3('Blind beat','med',[0,0,0,0,0,0,0,0,0,0],{clouds:'full'}),
  L3('Peekaboo','med',[0,Mi,0,Ta,Lo,0,Mi,0,Ta,0],{clouds:'patchy'}),
  L3('Steam in the fog','med',[0,V(Lo),0,Mi,V(Mi),0,Lo,V(Lo),Mi,0],{clouds:'full'}),
  L3('Lifts in the fog','med',[0,P(0),Lo,P(Lo),0,Mi,P(0),Lo,0,P(Mi)],{clouds:'full'}),
  L3('Thin fog','med',[0,Lo,Mi,0,Ta,Mi,Lo,0,Mi,Ta],{clouds:'full',band:'thin'}),
  L3('Storm','fast',[0,Lo,Mi,Ta,Hi,Ta,Mi,Lo,0,Mi],{clouds:'patchy'}),
  L3('Pea soup','fast',[0,V(Mi),P(0),Ta,0,V(Lo),Mi,P(Lo),Hi,0],{clouds:'full'}),
  L3('Whiteout','fast',[0,Lo,Mi,V(Ta),P(0),Hi,0,V(Mi),P(Lo),Ta],{clouds:'full',band:'thin'}),
  // World 5 · Sabotage — faulty chutes pop off by themselves; open the spare in the green
  L3('Sabotage','slow',[0,0,0,F(0),0,0,0,F(0),0,0]),
  L3('Second chute','slow',[0,Lo,F(0),Lo,0,F(Mi),0,Lo,F(0),0]),
  L3('Pop!','med',[0,F(0),0,0,F(Lo),0,Mi,F(0),0,Lo]),
  L3('Trust nothing','med',[Lo,F(Mi),0,V(Lo),F(0),Mi,0,F(Ta),Lo,0]),
  L3('Faulty lifts','med',[0,P(0),F(Lo),0,P(Lo),Mi,F(0),P(0),0,Lo]),
  L3('Faulty fog','med',[0,F(0),Lo,0,F(Mi),0,Lo,F(0),Mi,0],{clouds:'patchy'}),
  L3('Thin threads','med',[0,F(Lo),Mi,0,F(0),Ta,Lo,F(Mi),0,Lo],{band:'thin'}),
  L3('Rapid fire','fast',[0,Lo,F(0),Mi,Lo,F(Ta),0,Mi,F(Lo),0]),
  L3('Everything','fast',[0,V(Lo),F(0),P(Lo),Ta,F(Mi),V(Mi),P(0),Hi,F(0)]),
  L3('Final mission','fast',[0,Lo,V(Mi),F(0),P(Lo),Hi,F(Mi),V(Lo),P(0),Ta],{band:'thin'}),
);
const WORLDS=[
  {name:'Drop Zone'},{name:'City rooftops'},{name:'Base elevators'},{name:'Cloud cover'},{name:'Sabotage'},
];
const PER_WORLD=10, W_NEED=25;   // running star total opens worlds: World 2 at 25★, World 3 at 50★, World 4 at 75★... stars are never spent
const worldOf=n=>Math.floor(n/PER_WORLD);
const levelLabel=n=>n+1;   // levels count on across worlds: World 2 starts at Level 11
let training=false, trainingThen='level1';
function startTraining(then){ training=true; trainingThen=then; start(); }
let curLevel=0;
const PKEY='chuteRhythm.v5.progress';   // new key: level numbering changed in v5.6
let prog={stars:[],best:[],trained:false};
try{const v=JSON.parse(store.get(PKEY)||'null'); if(v&&Array.isArray(v.stars)) prog=v}catch(e){}
const saveProg=()=>store.set(PKEY,JSON.stringify(prog));
// ---------- economy ----------
// Coins: 20 per NEW star, 10 per finished level (replays too), +10 for a perfect streak of 5+. Ads only speed things up:
// everything can be bought with coins alone (players with ad blockers can still get it all).
const PRICE={chute:{common:100,rare:250,epic:600,legendary:1200},diver:{common:200,rare:450,epic:900,legendary:2000},plane:{rare:900,epic:1600,legendary:2500}};
const AD_NEED={common:1,rare:3};                      // epic / legendary: coins only
const AD_COINS=100, AD_COINS_CD=120000, GATE_NEAR=5;  // store ad, cooldown (ms); "unlock now" offered within 5★ of the gate
const TRACK=[['plane','biplane'],['chute','watermelon'],['diver','robot'],['plane','cargo'],['chute','camo'],
  ['diver','astronaut'],['plane','blimp'],['chute','jellyfish'],['diver','chicken'],['plane','stealth']];
// v6.7: each reward belongs to a fixed level (5th and 10th of every world), so the screen can say "Unlocks at Level 10"
const REWARD_LV=[4,9,14,19,24,29,34,39,44,49];
function ensureEco(){
  if(typeof prog.coins!=='number') prog.coins=0;
  prog.own=prog.own||{}; prog.sel=prog.sel||{}; prog.adp=prog.adp||{}; prog.gate=prog.gate||{};
  for(const [k,def] of [['chute','classic'],['diver','agent'],['plane','classic']]){
    prog.own[k]=prog.own[k]||[def]; if(!prog.own[k].includes(def)) prog.own[k].unshift(def); if(!prog.sel[k]) prog.sel[k]=def; }
  if(typeof prog.wins!=='number') prog.wins=prog.stars.filter(x=>x>0).length;
  if(typeof prog.trackDone!=='number') prog.trackDone=0;
  // rlv = reward levels already used (claimed or skipped). trackDone points at the next item in TRACK order;
  // an item bought in the Store is skipped, so that reward level gives the next unowned item instead.
  if(typeof prog.rlv!=='number') prog.rlv=Math.min(REWARD_LV.length,prog.trackDone);
  delete prog.trackProg;
}
ensureEco();
const owns=(kind,id)=>prog.own[kind].includes(id);
function grant(kind,id,select){ if(!owns(kind,id)) prog.own[kind].push(id); if(select) prog.sel[kind]=id; saveProg(); }
function trackItem(){   // current reward on the track, skipping anything already owned
  while(prog.trackDone<TRACK.length&&owns(...TRACK[prog.trackDone])) prog.trackDone++;
  return prog.trackDone<TRACK.length?TRACK[prog.trackDone]:null;
}
// Night is only offered where it changes something: faulty chutes don't depend on the time of day.
const nightOk=n=>{ const L=LEVELS[n]; return (L.clouds&&L.clouds!=='off')||L.d.some(x=>x&&(x.vent||x.plat)); };
const worldStars=w=>{let a=0;for(let n=w*PER_WORLD;n<(w+1)*PER_WORLD;n++)a+=prog.stars[n]||0;return a};
const totalStars=()=>LEVELS.reduce((a,_,n)=>a+(prog.stars[n]||0),0);
const worldNeed=w=>w*W_NEED;
const worldOpen=w=>w===0||!!prog.unlockAll||!!(prog.gate&&prog.gate[w])||totalStars()>=worldNeed(w);
const unlocked=n=>{ if(n<0||n>=LEVELS.length) return false; if(prog.unlockAll) return true;
  const w=worldOf(n); if(n%PER_WORLD===0) return worldOpen(w); return (prog.stars[n-1]||0)>0; };
