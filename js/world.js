// ---------- world helpers (shared by the simulator and the live game) ----------
function slopeH(wx){ return 0.24*Math.min(1,Math.max(0,(wx-(S.ci+0.5))/S.slopeSpan)) }
function gStatic(d){ return S.mode==='slope'? BASE-slopeH(d.wx) : BASE-d.h }
function groundAt(d,t){
  if(d.plat){ if(d.plat.frozen!=null) return d.plat.frozen; return gStatic(d)-PL_LIFT-PL_AMP*Math.sin(PL_W*(t-(S.t0||0))+d.plat.ph) }
  return gStatic(d);
}
function planeYAt(wx){
  if(!S||!S.dive) return PLANE_Y;
  if(wx<=S.diveA||wx>=S.diveB) return PLANE_Y;
  const f=(wx-S.diveA)/(S.diveB-S.diveA); return PLANE_Y+DIVE_D*Math.pow(Math.sin(Math.PI*f),2);
}
function fallStep(d,dt){
  if(d.vent && d.y>gStatic(d)-STEAM_H){ d.v+=(VVENT-d.v)*Math.min(1,5*dt); d.y+=d.v*dt; return }
  d.v=Math.min(d.heavy?VMAX_H:VMAX,d.v+(d.heavy?ACC_H:ACC)*dt); d.y+=d.v*dt;
}
// Simulate a diver from its drop until it reaches the top of its perfect band.
function simEnter(d,band,dmin=DMIN){
  const p={heavy:d.heavy,vent:d.vent,wx:d.wx,h:d.h,plat:d.plat,y:planeYAt(d.wx)+0.025,v:d.faulty?VPRE:V0};
  const t0=d.wx*S.T; let t=t0, popped=!d.faulty;
  while(t<t0+12){
    if(!popped){ p.y+=VPRE*SIM_DT; if(t+SIM_DT>=t0+d.popDelay){popped=true;p.v=VPRE} }
    else fallStep(p,SIM_DT);
    t+=SIM_DT;
    if(p.y>=groundAt(p,t)-dmin-band) return {t,v:p.v};
  }
  return {t,v:p.v};
}
function computeWindow(d){
  const first=simEnter(d,BAND,DMIN);
  // Band height = speed at the band x a fixed ~120 ms window, so every diver gets the same time to tap.
  d.bandBase=Math.max(0.028,Math.min(0.068,BAND*first.v/VMAX));
  d.band=d.bandBase*S.bandScale;   // Band setting shrinks only the perfect zone
  // Steam divers arrive slowly, so they need less braking height: their band sits lower, nearer the roof.
  d.dmin=d.vent?DMIN*Math.max(0.5,Math.min(1,first.v/VMAX)):DMIN;
  const sec=simEnter(d,d.band,d.dmin); d.enter=sec.t; d.vBand=sec.v;
}
function choosePop(d){
  // Latest pop that still leaves FREEFALL_MIN of free fall before the band, with the band still on screen; pick a height in between.
  let max=POP_MIN;
  for(let p=POP_MIN;p<=2.6;p+=0.05){
    d.popDelay=p; const e=simEnter(d,BAND).t;
    if(e-(d.wx*S.T+p)>=FREEFALL_MIN&&e-d.wx*S.T<=VIEW_BEATS*S.T) max=p; else break;
  }
  d.popDelay=POP_MIN+d.popFrac*(max-POP_MIN);
}

// ---------- build a jump ----------
function newRound(){
  rng=Math.random;
  const T=TEMPO[settings.tempo], ci=settings.countIn, N=ci+HUMANS;
  S={T,ci,N,radar:settings.radar!=='off',mode:settings.ground,bandScale:BANDSCALE[settings.band]||1,dive:settings.dive==='on',clouds:settings.clouds,slopeSpan:HUMANS+2,
     divers:[],t:0,particles:[],pops:[],streak:0,best:0,perf:0,shake:0,banner:null,humansShown:false,endAt:null,
     tempoKey:settings.tempo,cfg:Object.assign({},settings),fixes:0,humansN:HUMANS,level:null,tut:null};
  const humans=[...Array(HUMANS).keys()].map(k=>k+ci);
  const heavy=new Set(settings.heavy==='on'?pickSome(humans,3):[]);
  // faulty: not the first human, never two in a row, never heavy
  const faulty=new Set();
  if(settings.faulty==='on'){
    for(const i of pickSome(humans.slice(1).filter(i=>!heavy.has(i)),12)){
      if(faulty.size>=3) break; if(!faulty.has(i-1)&&!faulty.has(i+1)) faulty.add(i);
    }
  }
  const plats=new Set(settings.platforms==='on'?pickSome(humans,4):[]);
  const vents=new Set(settings.vents==='on'?pickSome(humans.filter(i=>!plats.has(i)),3):[]);
  const lv=[0,0.06,0.12,0.18]; let prev=0, wx=0;
  for(let i=0;i<N;i++){
    const dummy=i<ci;
    let h=0;
    if(S.mode==='steps'&&!dummy){ do{h=lv[Math.random()*lv.length|0]}while(h===prev); prev=h }
    if(vents.has(i)&&S.mode!=='slope'&&h===0) h=0.06;   // a vent sits on a rooftop
    wx+= (i>0&&S.divers[i-1].faulty)?2:1;             // Option A: empty slot after a faulty diver
    S.divers.push({i,dummy,heavy:heavy.has(i),faulty:faulty.has(i),vent:vents.has(i),
      plat:plats.has(i)?{ph:rnd(0,Math.PI*2),frozen:null}:null,h,wx,popDelay:0,popFrac:rnd(0,1),band:BAND,bandBase:BAND,dmin:DMIN,enter:0,
      state:'wait',y:0,v:0,opened:false,openY:0,vOpen:0,rating:null,outcome:null,chuteT:0,landT:0,popT:0,
      suit:dummy?'#f2b705':SUITS[(i-ci)%SUITS.length]});
  }
  finishLayout();
}
function newLevelRound(n){
  const L=n<0?TRAINING:LEVELS[n]; seedRng(L.seed!=null?L.seed:n+1);
  const T=TEMPO[L.tempo], ci=L.dummies, hs=L.d.filter(x=>x!=='gap'), N=ci+hs.length;
  const night=helper==='night', wide=helper==='wide', lead=offerNext?Math.ceil(HELP_OFFER/T):0;   // lead: empty beats while the retry offer is up
  helper=null; offerNext=false;
  S={T,ci,N,radar:n>=RADAR_FROM,mode:'steps',bandScale:(BANDSCALE[L.band]||1)*(wide?HELP_WIDE:1),dive:false,clouds:night?'off':L.clouds||'off',night,lead,t0:lead*T,offerEnd:lead?HELP_OFFER:null,slopeSpan:hs.length+2,
     divers:[],t:0,particles:[],pops:[],streak:0,best:0,perf:0,shake:0,banner:null,humansShown:ci===0,endAt:null,
     tempoKey:L.tempo,cfg:Object.assign({},settings),fixes:0,humansN:hs.length,level:n,
     tut:L.tut?{idx:0,done:false,show:false,k:1}:null,
     heartsMax:L.hearts,hearts:L.hearts,misses:0,failed:false,heartLostT:-9};
  S.training=n<0; if(n<0) S.banner={text:'TRAINING',t:0,dur:1.8};
  let wx=lead;
  const add=(x,dummy)=>{ const o=typeof x==='object'?x:{h:x}, h=o.h, i=S.divers.length;
    wx+=(i>0&&S.divers[i-1].faulty)?2:1;   // an empty slot after a faulty diver (same as the sandbox)
    S.divers.push({i,dummy,heavy:false,faulty:!!o.faulty,vent:!!o.vent&&!night,plat:o.plat&&!night?{ph:rnd(0,Math.PI*2),frozen:null}:null,h,wx,popDelay:0,popFrac:rnd(0,1),band:BAND,bandBase:BAND,dmin:DMIN,enter:0,
      state:'wait',y:0,v:0,opened:false,openY:0,vOpen:0,rating:null,outcome:null,chuteT:0,landT:0,popT:0,
      suit:dummy?'#f2b705':SUITS[(i-ci)%SUITS.length]}) };
  for(let i=0;i<ci;i++) add(0,true);
  for(const x of L.d){ if(x==='gap') wx+=1; else add(x,false) }
  finishLayout();
}
function finishLayout(){
  const N=S.N, T=S.T, ci=S.ci;
  S.diveA=ci+2.5; S.diveB=ci+10.5;
  // All-perfect check: each band window must open at least MIN_GAP after the previous one.
  // When it doesn't, push that building (and every later one) out just enough.
  for(let i=0;i<N;i++){
    const d=S.divers[i];
    if(d.faulty) choosePop(d);
    computeWindow(d);
    if(i===0) continue;
    const prevD=S.divers[i-1];
    let guard=0;
    while(d.enter-prevD.enter<MIN_GAP && guard++<40){
      const shift=(MIN_GAP-(d.enter-prevD.enter)+0.02)/T;
      for(let j=i;j<N;j++) S.divers[j].wx+=shift;
      S.fixes++;
      if(d.faulty) choosePop(d);
      computeWindow(d);
    }
  }
  for(const d of S.divers) d.tDrop=d.wx*T;
  buildClouds(); buildRadar();
}

// ---------- radar (theme layer: visuals + a "spotted" moment, no rule change) ----------
const RADAR_GAP=0.10, RADAR_CEIL=0.22, RADAR_FROM=4, DROP_GUARD=0.3;   // RADAR_FROM: level index (4 = Level 5)   // radar scan line sits this far above the top of each band (fraction of screen height)
function terrainLineAt(p,x){   // same shape rule as the cloud base: steps only over the lower neighbour
  const ease=f=>(1-Math.cos(Math.PI*Math.max(0,Math.min(1,f))))/2;
  if(x<=p[0].x) return p[0].y; if(x>=p[p.length-1].x) return p[p.length-1].y;
  let i=0; while(p[i+1].x<x) i++;
  const A=p[i], B=p[i+1], mid=(A.x+B.x)/2;
  if(A.y<=B.y) return x<=mid?A.y:A.y+(B.y-A.y)*ease((x-mid)/(B.x-mid));
  return x>=mid?B.y:B.y+(A.y-B.y)*ease((mid-x)/(mid-A.x));
}
const radarAt=x=>terrainLineAt(S.radarPts,x);
function buildRadar(){
  S.radarPts=null; S.radarPosts=[]; if(!S.radar) return;
  // One flat radar height for the whole level: RADAR_GAP above the highest band top (tallest landing).
  const ry=Math.max(RADAR_CEIL+0.04,Math.min(...S.divers.map(d=>gStatic(d)-(d.plat?PL_LIFT+PL_AMP:0)-d.dmin-d.band-RADAR_GAP)));
  S.radarY=ry; S.radarPts=S.divers.map(d=>({x:d.wx,y:ry}));
  // posts: on the roof/ground of every 3rd plain landing, off to the right of its band
  S.divers.forEach((d,i)=>{ if(i%3===1&&!d.plat&&!d.vent) S.radarPosts.push({wx:d.wx+0.34,g:gStatic(d),ph:i*1.7}) });
  if(!S.radarPosts.length&&S.divers.length) S.radarPosts.push({wx:S.divers[0].wx+0.34,g:gStatic(S.divers[0]),ph:0});
}
function nearestPost(wx){ let b=null,bd=1e9; for(const p of S.radarPosts){const dd=Math.abs(p.wx-wx); if(dd<bd){bd=dd;b=p}} return b }

// Cloud bank: its underside follows the terrain, so every diver comes out of the cloud
// about CLOUD_EMERGE seconds above the top of its own green band (ground or rooftop alike).
function cloudBaseAt(x){
  const p=S.cloudPts, ease=f=>(1-Math.cos(Math.PI*Math.max(0,Math.min(1,f))))/2;
  if(x<=p[0].x) return p[0].y; if(x>=p[p.length-1].x) return p[p.length-1].y;
  let i=0; while(p[i+1].x<x) i++;
  const A=p[i], B=p[i+1], mid=(A.x+B.x)/2;
  // the cloud base steps between neighbours only over the LOWER landing, never over the higher one's band
  if(A.y<=B.y) return x<=mid?A.y:A.y+(B.y-A.y)*ease((x-mid)/(B.x-mid));
  return x>=mid?B.y:B.y+(A.y-B.y)*ease((mid-x)/(mid-A.x));
}
function buildClouds(){
  S.cloudPuffs=[]; if(S.clouds==='off') return;
  S.cloudPts=S.divers.map(d=>{
    const top=gStatic(d)-(d.plat?PL_LIFT+PL_AMP:0)-d.dmin-d.band;
    return {x:d.wx,y:Math.max(0.3,top-d.vBand*CLOUD_EMERGE)};
  });
  // Soften: the base never dips more than CLOUD_DIP below a neighbour (only ever raises the cloud).
  // On narrow screens buildings are squeezed sideways, so allow less dip to keep the base smooth.
  const P=S.cloudPts, dip=CLOUD_DIP*(H>0?Math.max(0.4,Math.min(1,(unit()/H)/0.17)):1);
  for(let pass=0;pass<3;pass++) for(let i=0;i<P.length;i++){
    if(i>0) P[i].y=Math.min(P[i].y,P[i-1].y+dip);
    if(i<P.length-1) P[i].y=Math.min(P[i].y,P[i+1].y+dip);
  }
  const full=S.clouds==='full', th=CLOUD_TH, end=S.cloudPts[S.cloudPts.length-1].x+6;
  let x=-3+(S.lead||0), inCloud=true, segStart=x, segEnd=full?Infinity:x+rnd(1.3,2.6);
  while(x<end){
    if(!full&&x>segEnd){ inCloud=!inCloud; segStart=x; segEnd=x+(inCloud?rnd(1.3,2.6):rnd(0.9,1.7)) }
    if(inCloud){
      const base=cloudBaseAt(x);
      const edge=full?1:Math.max(0,Math.min(1,(x-segStart)/0.55,(segEnd-x)/0.55));
      const sc=0.5+0.5*edge, lift=(1-edge)*th*0.3;
      const jx=()=>x+rnd(-0.05,0.05);
      S.cloudPuffs.push({x:jx(),y:base-th*0.1-lift,r:th*rnd(0.38,0.5)*sc});
      S.cloudPuffs.push({x:jx(),y:base-th*0.45-lift*0.5,r:th*rnd(0.34,0.5)*sc});
      if(rng()<0.75) S.cloudPuffs.push({x:jx(),y:base-th*rnd(0.7,0.88),r:th*rnd(0.2,0.36)*sc});
    }
    x+=0.15;
  }
}
// Soft puff sprites: opaque core, feathered edge.
const cloudCv=document.createElement('canvas'), cctx=cloudCv.getContext('2d');
const CLOUD_SPR=(()=>{
  const mk=col=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
    const gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,col(1));gr.addColorStop(0.6,col(1));gr.addColorStop(0.8,col(0.55));gr.addColorStop(1,col(0));
    g.fillStyle=gr;g.fillRect(0,0,128,128);return c};
  return {white:mk(a=>`rgba(255,255,255,${a})`),shade:mk(a=>`rgba(203,214,231,${a})`)};
})();

// Tap target = earliest-dropped diver in free fall. Bands open in drop order (checked above),
// so a diver whose chute just popped can never take the tap from one already at its band.
function current(){
  if(!S) return null;
  for(const d of S.divers){ if(d.state==='fall') return d; }
  return null;
}
