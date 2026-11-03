// ---------- "house of cards" collapse after being caught ----------
// Times are on the collapse clock (real seconds). Tune here: set shot2 = shot1 to shoot diver and plane together.
const COL={slow:0.3, slowEnd:0.9, shot1:0.9, look:1.3, shot2:1.8, spill:0.2, spillGap:0.1, after:1.0};
function groundAtX(wx){   // what a stray falling body hits at world x: roofs, ground, or a radar post
  if(S.mode==='slope') return BASE-slopeH(wx);
  let g=BASE;
  for(const d of S.divers) if(Math.abs(d.wx-wx)<0.47) g=Math.min(g,groundAt(d,S.t));
  for(const p of S.radarPosts||[]) if(Math.abs(p.wx-wx)<0.035) g=Math.min(g,p.g-0.062);
  return g;
}
function colFire(c,wx,y){ const p=c.post; if(!p) return; c.shots.push({x0:p.wx,y0:p.g-0.062,x1:wx,y1:y,t:0}); SFX.zap(); }
function collapseStep(dt){
  const c=S.col, e=c.ev, T=S.T;
  if(!e.s1&&c.ct>=COL.shot1){ e.s1=1; const d=c.d;           // 1. shoot the canopy
    colFire(c,d.wx,d.y-0.055);
    d.state='fall'; d.opened=false; d.tumble=true; d.rot=0; d.rotV=8; d.v=Math.min(d.v,0.05);
    burst(d.wx,d.y-0.055,16,d.suit,0.45,true,0.6); burst(d.wx,d.y-0.055,8,'#ffffff',0.35,true,0.5);
    SFX.pop(); SFX.whistle(1.1); }
  if(!e.look&&c.ct>=COL.look){ e.look=1; SFX.siren(); }       // 2. radar finds the plane
  if(!e.s2&&c.ct>=COL.shot2){ e.s2=1;                          // 3. shoot the plane
    const wx=S.t/T, y=planeYAt(wx);
    colFire(c,wx,y); S.camT=S.t;
    c.plane={wx,y,vx:1/T,vy:-0.08,rot:0};
    burst(wx,y,18,'#3b3b3b',0.35,true,0.9); burst(wx,y,10,'#ffd166',0.3,true,0.4);
    if(!reduceMotion) S.shake=0.7; SFX.boom(); SFX.sputter(); SFX.whistle(1.6);
    c.waiting=S.divers.filter(d=>d.state==='wait'); c.spilled=0; }
  const pl=c.plane;
  if(pl&&!pl.crashed){                                         // plane spirals down
    pl.vx+=(0.06/T-pl.vx)*Math.min(1,2.4*dt); pl.vy+=0.78*dt;
    pl.wx+=pl.vx*dt; pl.y+=pl.vy*dt; pl.rot=Math.min(0.95,pl.rot+0.9*dt);
    const g=groundAtX(pl.wx);
    if(pl.y+0.05*Math.sin(pl.rot)>=g){ pl.crashed=true; pl.gone=true; pl.y=g-0.03;   // hits the ground: explodes and is gone
      c.boom={wx:pl.wx,y:g-0.03,t:0,puffs:Array.from({length:7},(_,i)=>({a:i/7*Math.PI*2+Math.random()*0.5,d:0.4+Math.random()*0.6,s:0.7+Math.random()*0.6}))};
      burst(pl.wx,g-0.03,22,'#9a7a52',0.6,true,0.9);
      burst(pl.wx,g-0.04,10,'#e9eef6',0.9,true,1.1); burst(pl.wx,g-0.04,8,'#ff5a36',0.85,true,1.1); burst(pl.wx,g-0.04,6,'#132238',0.8,true,1.1);
      if(!reduceMotion) S.shake=1.3; SFX.boom(); SFX.crash(); SFX.wahwah(0.5);
      S.banner={text:'CAUGHT BY RADAR!',t:0,dur:2.2,col:'#ff6b5e'}; }
  }
  if(c.boom) c.boom.t+=dt;
  if(pl&&!pl.gone){ c.smokeAcc+=dt; const gap=0.03;
    while(c.smokeAcc>gap){ c.smokeAcc-=gap; c.smoke.push({wx:pl.wx-0.08,y:pl.y-(pl.crashed?0.04:0),t:0,r:0.5+Math.random()*0.6,dx:(Math.random()-.5)*0.08}) } }
  for(const m of c.smoke){ m.t+=dt; m.y-=0.05*dt; m.wx+=m.dx*dt }
  c.smoke=c.smoke.filter(m=>m.t<1.8);
  if(c.waiting) while(c.spilled<c.waiting.length&&c.ct>=COL.shot2+COL.spill+c.spilled*COL.spillGap){   // 4. everyone on board falls out
    const o=c.waiting[c.spilled++];
    c.tumblers.push({i:o.i,suit:o.suit,heavy:false,dummy:false,state:'fall',wx:pl.wx+(Math.random()-.5)*0.08,y:pl.y+0.02,
      v:-0.22-Math.random()*0.2,vx:-2.6+Math.random()*2.4,rot:0,rotV:(Math.random()<.5?-1:1)*(5+Math.random()*6),landT:0,outcome:null});
    SFX.drop(); }
  for(const t of c.tumblers){
    if(t.state==='landed'){ t.landT+=dt; continue }
    t.v=Math.min(VMAX,t.v+ACC*dt); t.y+=t.v*dt; t.wx+=t.vx*dt; t.vx*=Math.pow(0.6,dt); t.rot+=t.rotV*dt;
    const g=groundAtX(t.wx);
    if(t.y>=g&&t.v>0){ t.y=g; t.state='landed'; t.outcome='splat'; t.landT=0; burst(t.wx,g,12,'#9a7a52',0.4,true); SFX.oof(); }
  }
  for(const sh of c.shots) sh.t+=dt; c.shots=c.shots.filter(sh=>sh.t<0.45);
  // end once the plane is down and everyone has hit the ground
  if(S.endAt===null&&pl&&pl.crashed&&c.spilled===c.waiting.length&&c.tumblers.every(t=>t.state==='landed')) S.endAt=S.t+COL.after;
  if(S.endAt===null&&c.ct>COL.shot2+5){ S.endAt=S.t+0.3 }    // safety net
}
function pop(wx,y,text,color,size=1){S.pops.push({wx,y,text,color,size,t:0})}
function burst(wx,y,n,color,spd,up,life=0.6){
  for(let k=0;k<n;k++){
    const a=Math.PI+Math.random()*Math.PI;
    S.particles.push({wx,y,vx:Math.cos(a)*spd*(0.3+Math.random())*1.6,vy:Math.sin(a)*spd*(0.4+Math.random())*(up?1.4:1),
      life:life+Math.random()*0.5,t:0,color,size:2+Math.random()*3});
  }
}

// ---------- simulation ----------
function update(dt){
  if(S.col){ const c=S.col; c.ct+=dt;
    dt*=c.ct<COL.slowEnd?COL.slow:Math.min(1,COL.slow+(c.ct-COL.slowEnd)/0.25*(1-COL.slow)); }
  S.t+=dt;
  if(S.offerEnd!=null&&S.t>=S.offerEnd) endOffer();
  for(const d of S.divers){
    if(d.state==='wait'&&S.t>=d.tDrop&&!S.failed){
      d.y=planeYAt(d.wx)+0.025; SFX.drop();
      if(d.faulty){ d.state='pre'; d.v=VPRE; d.chuteT=0 } else { d.state='fall'; d.v=V0 }
      if(!d.dummy&&!S.humansShown){S.humansShown=true;if(!S.banner){S.banner={text:'HUMANS NOW',t:0,dur:1.3}}SFX.humans()}
    }
    if(d.state==='pre'){
      d.chuteT+=dt; d.y+=VPRE*dt;
      if(S.t>=d.tDrop+d.popDelay){
        d.state='fall'; d.v=VPRE; d.popT=S.t;
        burst(d.wx,d.y-0.045,14,d.suit,0.35,true,0.5); burst(d.wx,d.y-0.045,6,'#ffffff',0.3,true,0.4);
        pop(d.wx,d.y-0.07,'POP!','#ffffff',1); SFX.pop();
      }
    } else if(d.state==='fall'){
      fallStep(d,dt);
      if(d.tumble) d.rot+=d.rotV*dt;
      else if(S.col){ const h=groundAt(d,S.t)-d.y;   // already jumped: leave them be, chute opens on its own
        if(h<=d.dmin+d.band*0.5){ d.opened=true; d.openY=d.y; d.vOpen=d.v; d.state='chute'; d.chuteT=0; d.rating='good'; } }
    } else if(d.state==='chute'){
      d.chuteT+=dt;
      const s=d.y-d.openY;
      d.v=Math.max(VC,d.vOpen-(d.vOpen-VC)*s/d.dmin);
      d.y+=d.v*dt;
    }
    if(d.state==='fall'||d.state==='chute'||d.state==='pre'){
      const g=groundAt(d,S.t);
      if(d.y>=g){ if(d.plat&&d.plat.frozen==null) d.plat.frozen=g; d.y=g; land(d); }
    }
    if(d.state==='landed') d.landT+=dt;
  }
  for(const p of S.particles){p.t+=dt;p.wx+=p.vx*dt;p.y+=p.vy*dt;p.vy+=0.9*dt}
  S.particles=S.particles.filter(p=>p.t<p.life);
  for(const p of S.pops){p.t+=dt}
  S.pops=S.pops.filter(p=>p.t<1.1);
  if(S.banner){S.banner.t+=dt;if(S.banner.t>S.banner.dur)S.banner=null}
  S.shake=Math.max(0,S.shake-dt*3);
  if(S.col) collapseStep(dt);
  if(S.endAt===null&&!S.col&&S.divers.every(d=>d.state==='landed'||d.state==='wait')&&S.divers.every(d=>d.state==='landed')){
    S.endAt=S.t+1.3; SFX.droneStop();
    if(S.training){ S.endAt=S.t+2.1; S.banner={text:'TRAINING COMPLETE!',t:0,dur:2.0}; SFX.end(true);   // finish moment
      const cols=['#ff5a36','#ffd23f','#2fd88a','#4dabf7','#e8417a','#ffffff'];
      S.confetti=Array.from({length:90},()=>({x:Math.random()*W,y:-Math.random()*H*0.4-10,vx:(Math.random()-.5)*60,vy:60+Math.random()*120,r:Math.random()*6,vr:(Math.random()-.5)*10,c:cols[Math.random()*cols.length|0],w:4+Math.random()*4})); }
  }
  if(S.confetti) for(const c of S.confetti){ c.x+=c.vx*dt; c.y+=c.vy*dt; c.vy+=40*dt; c.r+=c.vr*dt; }
  if(S.endAt!==null&&S.t>=S.endAt){running=false;showEnd()}
}
function land(d){
  d.state='landed';d.landT=0;
  if(d.opened&&(d.rating==='late'||d.rating==='toolate')){
    // Opened below the band: the chute can't save you. Hard crash, bounce, canopy drapes over the diver.
    d.outcome='crash';
    burst(d.wx,d.y,14,'#9a7a52',0.42,true);
    if(!reduceMotion) S.shake=Math.max(S.shake,d.dummy?0.45:0.75);
    pop(d.wx,d.y-0.05,d.dummy?'CLONK':'CRASH!','#ff8a5c',1.0);
    if(d.dummy) SFX.clonk(); else SFX.crash();
  } else if(!d.opened){
    d.outcome='splat';
    if(!d.opened&&!d.dummy){ S.streak=0; loseHeart(d); }
    burst(d.wx,d.y,18,'#9a7a52',0.5,true);
    burst(d.wx,d.y,8,'#5a4632',0.35,true);
    if(!reduceMotion) S.shake=d.dummy?0.5:1;
    pop(d.wx,d.y-0.05,d.dummy?'CLONK':'SPLAT','#ff6b4a',1.1);
    if(d.dummy) SFX.clonk(); else SFX.splat();
  } else {
    d.outcome='safe';
    burst(d.wx,d.y,5,'#b9a07a',0.18,true);
    if(d.rating==='perfect') burst(d.wx,d.y-0.03,10,'#ffe066',0.3,true);
    SFX.land(d.heavy);
  }
}
