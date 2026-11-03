// ---------- rendering ----------
let W=0,H=0,dpr=1;
function resize(){
  const r=stage.getBoundingClientRect(); dpr=Math.min(2,window.devicePixelRatio||1);
  const rotated=W&&(r.width>r.height)!==(W>H);
  W=r.width;H=r.height; cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
  if(rotated) pauseRun();   // turning the phone mid-jump must never cost a life
  if(!running) draw();
}

const shortWide=()=>W>H&&H<500;   // a phone on its side; same test as the landscape block in style.css
const TF=2.15; // approx fall time on flat ground
function unit(){
  const T=S?S.T:TEMPO[settings.tempo];
  return Math.max(46,Math.min(W*0.17,0.6*W*T/TF,130,shortWide()?H*0.2:130));   // on a short screen height limits it too, or the bands stretch
}
function draw(){
  if(!W||!H) return;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const k=Math.max(0.75,Math.min(1.45,H/720));
  const u=unit(), T=S?S.T:TEMPO[settings.tempo];
  const planeWX=S?(S.camT!=null?S.camT:S.t)/T:0, PX=(shortWide()?0.62:0.8)*W;
  const sx=wx=>(wx-planeWX)*u+PX;
  const now=performance.now()/1000;
  ctx.save();
  if(S&&S.shake>0){const m=S.shake*6*k;ctx.translate((Math.random()-.5)*m,(Math.random()-.5)*m)}

  // sky
  const sky=ctx.createLinearGradient(0,0,0,H);
  const night=S&&S.night;
  sky.addColorStop(0,night?'#1d2a55':'#2f6ccf');sky.addColorStop(0.55,night?'#3f5590':'#7fb4ee');sky.addColorStop(0.92,night?'#8a7fa8':'#ffe1b8');
  ctx.fillStyle=sky;ctx.fillRect(-20,-20,W+40,H+40);
  if(night){ ctx.fillStyle='rgba(255,255,255,.7)'; for(const p of nightDots){ ctx.beginPath();ctx.arc(p.x*W,p.y*H,p.r*k,0,Math.PI*2);ctx.fill() } }   // plain and still: nothing may pull the eye off the band
  const span=W+240;
  for(const c of bgClouds){
    let x=((c.x*span-planeWX*u*0.3)%span+span)%span-120, y=c.y*H, s=c.s*k;
    ctx.fillStyle=night?'rgba(255,255,255,.16)':'rgba(255,255,255,.75)';
    ctx.beginPath();ctx.ellipse(x,y,34*s,11*s,0,0,Math.PI*2);ctx.ellipse(x-14*s,y-6*s,16*s,11*s,0,0,Math.PI*2);ctx.ellipse(x+12*s,y-9*s,19*s,13*s,0,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle=night?'#4f6f78':'#9cc3a0';
  ctx.beginPath();ctx.moveTo(-20,H);
  for(let x=-20;x<=W+20;x+=16){const w=(x+planeWX*u*0.5)/90;ctx.lineTo(x,H*0.83-Math.sin(w)*10*k-Math.sin(w*0.43)*16*k)}
  ctx.lineTo(W+20,H);ctx.fill();

  // ground
  const mode=S?S.mode:settings.ground;
  if(mode==='slope'&&S){
    ctx.fillStyle='#6fae4f';ctx.beginPath();ctx.moveTo(-20,H+20);
    for(let x=-20;x<=W+20;x+=4){const wx=(x-PX)/u+planeWX;ctx.lineTo(x,(BASE-slopeH(wx))*H)}
    ctx.lineTo(W+20,H+20);ctx.fill();
    ctx.strokeStyle='#5a9440';ctx.lineWidth=4*k;ctx.beginPath();
    for(let x=-20;x<=W+20;x+=4){const wx=(x-PX)/u+planeWX;const y=(BASE-slopeH(wx))*H+2*k;x===-20?ctx.moveTo(x,y):ctx.lineTo(x,y)}
    ctx.stroke();
  } else {
    ctx.fillStyle='#6fae4f';ctx.fillRect(-20,BASE*H,W+40,H);
    ctx.fillStyle='#5a9440';ctx.fillRect(-20,BASE*H,W+40,4*k);
  }
  if(S){
    for(const d of S.divers){
      const x0=sx(d.wx-0.5), x1=sx(d.wx+0.5); if(x1<-20||x0>W+20) continue;
      const gs=gStatic(d);
      if(mode!=='slope'&&d.h>0){
        const top=gs*H;
        ctx.fillStyle=['#c96f4a','#8d7bb8','#4f86a8','#b5894a'][d.i%4];
        ctx.fillRect(x0+2,top,x1-x0-4,BASE*H-top);
        ctx.fillStyle='rgba(255,255,255,.28)';
        for(let wy=top+10*k;wy<BASE*H-8*k;wy+=14*k)for(let wx=x0+9;wx<x1-12;wx+=13*k)ctx.fillRect(wx,wy,6*k,7*k);
        ctx.fillStyle='#3b3330';ctx.fillRect(x0,top-4*k,x1-x0,5*k);
      }
      if(d.vent){ // chimney + steam column
        const cx=sx(d.wx), top=gs*H;
        ctx.fillStyle='#5b5f6b';ctx.fillRect(cx-7*k,top-14*k,14*k,14*k);ctx.fillStyle='#3d414b';ctx.fillRect(cx-9*k,top-16*k,18*k,4*k);
        for(let p=0;p<7;p++){
          const ph=((now*0.55)+p/7)%1, y=top-16*k-ph*STEAM_H*H, r=(6+ph*16)*k;
          ctx.fillStyle=`rgba(255,255,255,${0.42*(1-ph)})`;
          ctx.beginPath();ctx.arc(cx+Math.sin(now*2+p*1.7)*6*k,y,r,0,Math.PI*2);ctx.fill();
        }
      }
      if(d.plat){ // hydraulic lift
        const g=groundAt(d,S.t)*H, base=gs*H, xa=sx(d.wx-0.4), xb=sx(d.wx+0.4);
        ctx.strokeStyle='#6b7280';ctx.lineWidth=5*k;ctx.beginPath();
        for(const f of [0.3,0.7]){const x=xa+(xb-xa)*f;ctx.moveTo(x,base);ctx.lineTo(x,g+6*k)}ctx.stroke();
        ctx.fillStyle='#374151';for(const f of [0.3,0.7]){const x=xa+(xb-xa)*f;ctx.fillRect(x-5*k,base-12*k,10*k,12*k)}
        ctx.fillStyle='#f2b705';ctx.fillRect(xa,g,xb-xa,8*k);
        ctx.save();ctx.beginPath();ctx.rect(xa,g,xb-xa,8*k);ctx.clip();ctx.fillStyle='#1b1b1b';
        for(let x=xa-10*k;x<xb;x+=12*k){ctx.beginPath();ctx.moveTo(x,g+8*k);ctx.lineTo(x+6*k,g+8*k);ctx.lineTo(x+14*k,g);ctx.lineTo(x+8*k,g);ctx.fill()}
        ctx.restore();
      }
    }
  }

  // radar zone + scan line + posts
  if(S&&S.radar&&S.radarPts){
    // radar region: flat, light red fill from the radar ceiling (below the plane) down to the radar height
    const ry=S.radarY*H, rt=RADAR_CEIL*H;
    ctx.fillStyle='rgba(255,107,74,.13)'; ctx.fillRect(-20,rt,W+46,ry-rt);
    // "RADAR ZONE" marker, fixed in the world: it starts left of centre, is read while the plane flies in,
    // and scrolls off the left edge before the first band comes up (so it never competes with the band)
    { const mx=sx((S.lead||0)-0.38*W/u); if(mx>-80) zoneMarker(ctx,mx,rt,ry,k,'left'); }
    for(const p of S.radarPosts){
      const x=sx(p.wx), y=p.g*H; if(x<-40||x>W+40) continue;
      const mh=0.05*H, top=y-mh;
      ctx.fillStyle='#4b5563'; ctx.fillRect(x-1.5*k,top,3*k,mh); ctx.fillRect(x-6*k,y-3*k,12*k,3*k);
      const rot=Math.cos(now*2.2+p.ph);   // spinning dish
      ctx.fillStyle='#d1d5db'; ctx.strokeStyle='#374151'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(x,top-3*k,Math.max(1,8*k*Math.abs(rot)),4*k,0,Math.PI,0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle=`rgba(255,59,59,${0.4+0.6*(Math.sin(now*5+p.ph)>0?1:0)})`; ctx.beginPath(); ctx.arc(x,top-8*k,2*k,0,Math.PI*2); ctx.fill();
      for(let a=0;a<2;a++){ const ph=((now*0.9+p.ph+a*0.5)%1); ctx.strokeStyle=`rgba(255,120,120,${0.5*(1-ph)})`; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.arc(x,top-6*k,(6+ph*20)*k,-Math.PI*0.85,-Math.PI*0.15); ctx.stroke(); }
    }
  }

  // bands
  const cur=running?current():null;
  if(S){
    for(const d of S.divers){
      if(d.state==='landed'||d.state==='chute') continue;
      const x0=sx(d.wx-0.5)+3, w=u-6; if(x0>W||x0+w<0) continue;
      const g=groundAt(d,S.t), b=d.band;
      const isCur=d===cur;
      const m=d.dmin;
      ctx.fillStyle=isCur?'rgba(47,216,138,.55)':'rgba(47,216,138,.2)';
      ctx.fillRect(x0,(g-m-b)*H,w,b*H);
      if(isCur){ctx.strokeStyle='#eafff4';ctx.lineWidth=2;ctx.strokeRect(x0+.5,(g-m-b)*H+.5,w-1,b*H-1)}
    }
  }

  // divers
  if(S){
    if(S.radar) for(const d of S.divers){ if(!d.spotT||S.t-d.spotT>1.4) continue;   // searchlight snaps onto a spotted diver
      const p=nearestPost(d.wx); if(!p) continue; const f=1-(S.t-d.spotT)/1.4, x0=sx(p.wx), y0=p.g*H-0.05*H-8*k, x1=sx(d.wx), y1=d.y*H-26*k;
      const nx=-(y1-y0), ny=x1-x0, nl=Math.hypot(nx,ny)||1, w=18*k;
      ctx.fillStyle=`rgba(255,240,150,${0.5*f})`; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1+nx/nl*w,y1+ny/nl*w); ctx.lineTo(x1-nx/nl*w,y1-ny/nl*w); ctx.closePath(); ctx.fill(); }
    for(const d of S.divers){ if(d.state==='wait') continue;
      if(d.tumble&&d.state!=='landed'){ const x=sx(d.wx), y=d.y*H-10*k; ctx.save(); ctx.translate(x,y); ctx.rotate(d.rot); ctx.translate(-x,-y); drawDiver(d,sx(d.wx),d.y*H,k,now); ctx.restore(); }
      else drawDiver(d,sx(d.wx),d.y*H,k,now); }
    if(S.col) for(const t of S.col.tumblers){ const x=sx(t.wx), y=t.y*H;   // divers spilled from the plane, out of control
      if(t.state!=='landed'){ ctx.save(); ctx.translate(x,y-10*k); ctx.rotate(t.rot); ctx.translate(-x,-(y-10*k)); drawDiver(t,x,y,k,now); ctx.restore(); }
      else drawDiver(t,x,y,k,now); }
    if(S.radar) for(const d of S.divers){ if(!d.spotT||S.t-d.spotT>1.4) continue;
      const x=sx(d.wx)+18*k, y=d.y*H-66*k, sc=Math.min(1,(S.t-d.spotT)/0.12);
      ctx.fillStyle='#ff3b3b'; ctx.beginPath(); ctx.arc(x,y,11*k*sc,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(15*k*sc)}px "Lilita One", system-ui, sans-serif`; ctx.textAlign='center'; ctx.fillText('!',x,y+5*k*sc); }
    if(cur&&settings.ring==='on'){
      const x=sx(cur.wx), y=cur.y*H, sc=cur.heavy?1.3:1;
      ctx.setLineDash([4,5]);ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(x,y+4*k);ctx.lineTo(x,(groundAt(cur,S.t)-cur.dmin-cur.band)*H);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(x,y-9*k*sc,15*k*sc,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x,y-(13+15*sc)*k);ctx.lineTo(x-6*k,y-(21+15*sc)*k);ctx.lineTo(x+6*k,y-(21+15*sc)*k);ctx.fill();
    }
    for(const p of S.particles){
      ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.fillStyle=p.color;
      ctx.fillRect(sx(p.wx)-p.size/2,p.y*H-p.size/2,p.size*k,p.size*k);
    }
    ctx.globalAlpha=1;
  }

  // cloud cover (over divers, under the plane): own layer, flat soft underside that follows the rooftops
  if(S&&S.clouds!=='off'){
    if(cloudCv.width!==cv.width||cloudCv.height!==cv.height){cloudCv.width=cv.width;cloudCv.height=cv.height}
    const c2=cctx;
    c2.setTransform(1,0,0,1,0,0); c2.clearRect(0,0,cloudCv.width,cloudCv.height);
    c2.setTransform(dpr,0,0,dpr,0,0); c2.globalCompositeOperation='source-over'; c2.globalAlpha=1;
    for(const pass of [0,1]){
      const spr=pass?CLOUD_SPR.white:CLOUD_SPR.shade;
      for(const c of S.cloudPuffs){
        const r=c.r*H, x=sx(c.x); if(x<-r*2||x>W+r*2) continue;
        const y=c.y*H+(pass?-r*0.12:r*0.15);
        c2.drawImage(spr,x-r,y-r,r*2,r*2);
      }
    }
    c2.globalCompositeOperation='destination-out';
    const step=2.2*k;
    for(let j=0;j<=12;j++){
      c2.globalAlpha=j===0?1:0.11;
      c2.beginPath(); c2.moveTo(-20,H+20);
      for(let x=-20;x<=W+26;x+=6){const wx=(x-PX)/u+planeWX; c2.lineTo(x,cloudBaseAt(wx)*H-j*step)}
      c2.lineTo(W+26,H+20); c2.closePath(); c2.fill();
    }
    c2.globalAlpha=1; c2.globalCompositeOperation='source-over';
    ctx.drawImage(cloudCv,0,0,W,H);
  }

  // plane (shot down: smoke trail, spiral, wreck)
  const col=S&&S.col, pl=col&&col.plane;
  if(col){ for(const m of col.smoke){ const a=Math.max(0,0.5*(1-m.t/1.8)), r=(5+m.t*9)*k*m.r;
      ctx.fillStyle=`rgba(70,70,78,${a})`; ctx.beginPath(); ctx.arc(sx(m.wx),m.y*H,r,0,Math.PI*2); ctx.fill(); } }
  const planeX=pl?sx(pl.wx):PX, planeY=pl?pl.y*H:planeYAt(planeWX)*H;
  if(col&&col.ev.look&&!pl&&col.post){   // searchlight swings up to the plane
    const p=col.post, x0=sx(p.wx), y0=(p.g-0.062)*H, nx=-(planeY-y0), ny=planeX-x0, nl=Math.hypot(nx,ny)||1, w=26*k;
    ctx.fillStyle='rgba(255,240,150,.42)'; ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(planeX+nx/nl*w,planeY+ny/nl*w); ctx.lineTo(planeX-nx/nl*w,planeY-ny/nl*w); ctx.closePath(); ctx.fill(); }
  if(pl){ if(!pl.gone){ ctx.save(); ctx.translate(planeX,planeY); ctx.rotate(pl.rot+Math.sin(now*14)*0.06); drawPlane(0,0,k); ctx.restore(); } }
  else drawPlane(PX,planeY,k);
  if(col&&col.boom&&col.boom.t<1.6){   // cartoon explosion: flash, fireball puffs that turn to smoke, then gone
    const b=col.boom, t=b.t, x=sx(b.wx), y=b.y*H;
    if(t<0.18){ ctx.fillStyle=`rgba(255,255,240,${0.9*(1-t/0.18)})`; ctx.beginPath(); ctx.arc(x,y,(30+t*400)*k,0,Math.PI*2); ctx.fill(); }
    for(const q of b.puffs){
      const g=Math.min(1,t/0.35), r=(14+30*g)*k*q.s*(1-Math.max(0,t-1.1)/0.5*0.3), px=x+Math.cos(q.a)*q.d*36*k*g, py=y+Math.sin(q.a)*q.d*24*k*g-t*30*k;
      const a=Math.max(0,1-Math.max(0,t-0.7)/0.9);
      const col2=t<0.25?'255,209,102':t<0.5?'255,138,61':'90,90,98';
      ctx.fillStyle=`rgba(${col2},${a})`; ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill(); }
    if(t<0.45){ ctx.fillStyle=`rgba(255,240,170,${1-t/0.45})`; ctx.beginPath(); ctx.arc(x,y-4*k,(18+t*40)*k,0,Math.PI*2); ctx.fill(); }
    if(t<0.5){ ctx.strokeStyle=`rgba(255,255,255,${0.8*(1-t/0.5)})`; ctx.lineWidth=4*k; ctx.beginPath(); ctx.arc(x,y,(20+t*220)*k,0,Math.PI*2); ctx.stroke(); }
  }
  if(col&&col.ev.look&&col.ct<COL.shot2+0.5){   // "!" over the plane
    const x=planeX+30*k, y=planeY-34*k, sc=Math.min(1,(col.ct-COL.look)/0.12);
    ctx.fillStyle='#ff3b3b'; ctx.beginPath(); ctx.arc(x,y,12*k*sc,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font=`bold ${Math.round(16*k*sc)}px "Lilita One", system-ui, sans-serif`; ctx.textAlign='center'; ctx.fillText('!',x,y+5.5*k*sc); }
  if(col) for(const sh of col.shots){   // shot: a quick straight line with a ring where it hits
    const a=Math.max(0,1-sh.t/0.45), x0=sx(sh.x0), y0=sh.y0*H, x1=sx(sh.x1), y1=sh.y1*H;
    ctx.globalAlpha=a; ctx.strokeStyle='#fff6c2'; ctx.lineWidth=3*k; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
    ctx.strokeStyle='#ff5a36'; ctx.lineWidth=3*k; ctx.beginPath(); ctx.arc(x1,y1,(6+sh.t*40)*k,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#fff6c2'; ctx.beginPath(); ctx.arc(x1,y1,5*k*(1-sh.t/0.45),0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(x0,y0,4*k,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }

  // pops
  if(S){
    ctx.textAlign='center';
    for(const p of S.pops){
      const a=p.t<0.8?1:1-(p.t-0.8)/0.3, rise=p.t*28*k, sc=p.t<0.12?0.6+p.t/0.12*0.4*1.15:1;
      ctx.globalAlpha=Math.max(0,a);
      if(p.kind==='heart'){ brokenHeart(sx(p.wx),p.y*H-rise,26*k*sc,Math.min(1,Math.max(0,(p.t-0.12)/0.3))); continue; }
      ctx.font=`${Math.round(20*k*p.size*sc)}px "Lilita One", system-ui, sans-serif`;
      ctx.lineWidth=4;ctx.strokeStyle='rgba(19,34,56,.75)';
      ctx.strokeText(p.text,sx(p.wx),p.y*H-rise);ctx.fillStyle=p.color;ctx.fillText(p.text,sx(p.wx),p.y*H-rise);
    }
    ctx.globalAlpha=1;
  }
  if(col&&col.ct<COL.shot1+0.5){   // dim everything but the caught diver while time slows
    const f=Math.min(1,col.ct/0.15)*Math.min(1,Math.max(0,(COL.shot1+0.5-col.ct)/0.3)), d=col.d, x=sx(d.wx), y=d.y*H-24*k;
    const rg=ctx.createRadialGradient(x,y,50*k,x,y,Math.max(W,H)*0.6);
    rg.addColorStop(0,'rgba(10,18,36,0)'); rg.addColorStop(0.25,`rgba(10,18,36,${0.38*f})`); rg.addColorStop(1,`rgba(10,18,36,${0.5*f})`);
    ctx.fillStyle=rg; ctx.fillRect(-20,-20,W+40,H+40); }
  ctx.restore();

  // HUD
  if(S){
    if(S.level!=null&&S.level>=0){
      ctx.textAlign='center';ctx.font=`${Math.round(22*k)}px "Lilita One", system-ui, sans-serif`;
      ctx.lineWidth=4;ctx.strokeStyle='rgba(19,34,56,.6)';
      const lvl=`Level ${levelLabel(S.level)}`;ctx.strokeText(lvl,W/2,28*k);ctx.fillStyle='#fff';ctx.fillText(lvl,W/2,28*k);
      ctx.textAlign='left';
    }
    if(S.heartsMax){
      const sz=26*k, gap=8*k, x0=W/2-(S.heartsMax*sz+(S.heartsMax-1)*gap)/2+sz/2;
      for(let i=0;i<S.heartsMax;i++){
        const x=x0+i*(sz+gap), y=36*k, full=i<S.hearts;
        const lostNow=(i===S.hearts||(S.col&&i>=S.hearts))&&S.t-S.heartLostT<0.45, sc=lostNow?1+0.6*Math.sin((S.t-S.heartLostT)/0.45*Math.PI):1;
        ctx.save();ctx.translate(x,y+sz/2);ctx.scale(sc,sc);ctx.translate(0,-sz/2);
        heartPath(0,0,sz);
        if(full){ctx.fillStyle='#ff4d6d';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(19,34,56,.55)';ctx.stroke()}
        else{ctx.fillStyle='rgba(19,34,56,.35)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.stroke()}
        ctx.restore();
      }
    }
    if(S.tut&&S.tut.show&&!S.tut.done){   // training: wordless "tap now" cue where the thumb rests (tap anywhere); the band shows when
      const ph=(performance.now()/1000*1.6)%1, press=ph<0.18?ph/0.18:ph<0.3?1-(ph-0.18)/0.12:0, gy=BASE*H+(H-BASE*H)*0.5;
      const hint=(t,x,y,align)=>{ ctx.font=`${Math.round(18*k)}px "Lilita One", system-ui, sans-serif`; ctx.textAlign=align; ctx.textBaseline='middle';
        ctx.lineWidth=4; ctx.strokeStyle='rgba(19,34,56,.8)'; ctx.strokeText(t,x,y); ctx.fillStyle='#fff'; ctx.fillText(t,x,y); ctx.textBaseline='alphabetic'; };
      if(inputMode==='touch'){   // phone: hand on the grass bottom-right, where a right thumb rests
        const x=W-40*k, y=gy-2*k;
        if(ph>0.15){ const q=(ph-0.15)/0.85; ctx.strokeStyle=`rgba(255,255,255,${0.9*(1-q)})`;ctx.lineWidth=3;
          ctx.beginPath();ctx.arc(x-3*k,y-15*k,(10+q*30)*k,0,Math.PI*2);ctx.stroke(); }
        ctx.save();ctx.translate(x+5*k*(1-press),y+6*k*(1-press));ctx.scale(k*(1.15-0.12*press),k*(1.15-0.12*press));
        ctx.fillStyle='#fff';ctx.strokeStyle='#132238';ctx.lineWidth=2.5;ctx.lineJoin='round';
        ctx.beginPath();ctx.moveTo(-6,-16);ctx.arc(-3,-16,3,Math.PI,0);ctx.lineTo(0,-4);ctx.lineTo(9,-2);ctx.quadraticCurveTo(14,0,13,8);
        ctx.lineTo(11,16);ctx.lineTo(-4,16);ctx.lineTo(-10,6);ctx.quadraticCurveTo(-12,1,-7,2);ctx.lineTo(-6,4);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.restore();
        hint('Tap anywhere',x-30*k,gy,'right');
      } else {   // desktop: a space bar pressing in rhythm, bottom centre
        const kw=120*k, kh=24*k, x=W/2-kw/2-50*k, y=gy-kh/2+press*3*k;
        ctx.fillStyle='#9aa5b8'; roundRect(ctx,x,gy-kh/2+4*k,kw,kh,6*k); ctx.fill();
        ctx.fillStyle='#f4f6fb'; roundRect(ctx,x,y,kw,kh,6*k); ctx.fill(); ctx.strokeStyle='#132238'; ctx.lineWidth=2; ctx.stroke();
        ctx.fillStyle='#132238'; ctx.font=`bold ${Math.round(11*k)}px system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('SPACE',x+kw/2,y+kh/2+1); ctx.textBaseline='alphabetic';
        hint('Press Space',x+kw+14*k,gy,'left');
      }
    }
    if(S.confetti) for(const c of S.confetti){ ctx.save(); ctx.translate(c.x,c.y); ctx.rotate(c.r); ctx.fillStyle=c.c; ctx.fillRect(-c.w/2,-c.w/4,c.w,c.w/2); ctx.restore(); }
    const b=S.banner||(!S.humansShown&&running?{text:'COUNT-IN · find the beat',t:1,dur:99,soft:true}:null);
    if(b){
      ctx.textAlign='center';
      const a=b.soft?0.85:Math.min(1,Math.min(b.t/0.15,(b.dur-b.t)/0.3));
      ctx.globalAlpha=Math.max(0,a);
      ctx.font=`${Math.round((b.soft?16:32)*k)}px "Lilita One", system-ui, sans-serif`;
      ctx.lineWidth=5;ctx.strokeStyle='rgba(19,34,56,.7)';
      const y=b.soft?H*0.24:H*0.36;
      ctx.strokeText(b.text,W/2,y);ctx.fillStyle=b.soft?'#fff':(b.col||'#ffe066');ctx.fillText(b.text,W/2,y);
      ctx.globalAlpha=1;
    }
  }
}

function heartPath(x,y,s){
  ctx.beginPath();ctx.moveTo(x,y+s*0.3);
  ctx.bezierCurveTo(x,y,x-s*0.5,y,x-s*0.5,y+s*0.3);
  ctx.bezierCurveTo(x-s*0.5,y+s*0.6,x,y+s*0.75,x,y+s);
  ctx.bezierCurveTo(x,y+s*0.75,x+s*0.5,y+s*0.6,x+s*0.5,y+s*0.3);
  ctx.bezierCurveTo(x+s*0.5,y,x,y,x,y+s*0.3);ctx.closePath();
}
// A heart that cracks down the middle and the halves drift apart (f: 0 = whole, 1 = split).
function brokenHeart(cx,cy,s,f){
  const y0=cy-s/2, crack=[[0,0.28],[-0.09,0.45],[0.07,0.6],[-0.06,0.78],[0,1]];
  for(const side of [-1,1]){
    ctx.save();
    ctx.translate(cx+side*f*s*0.22,cy+f*s*0.08); ctx.rotate(side*f*0.4); ctx.translate(-cx,-cy);
    ctx.beginPath(); ctx.moveTo(cx+side*s,y0-3); ctx.lineTo(cx,y0-3);
    for(const [dx,dy] of crack) ctx.lineTo(cx+dx*s,y0+dy*s);
    ctx.lineTo(cx,y0+s+3); ctx.lineTo(cx+side*s,y0+s+3); ctx.closePath(); ctx.clip();
    heartPath(cx,y0,s); ctx.fillStyle='#ff4d6d'; ctx.fill(); ctx.lineWidth=2.5; ctx.strokeStyle='rgba(19,34,56,.75)'; ctx.stroke();
    ctx.restore();
  }
}
// ---------- cosmetics: planes (same size footprint) ----------
function propLine(x,len){ctx.strokeStyle='#132238';ctx.lineWidth=2;const pr=performance.now()/30;ctx.beginPath();ctx.moveTo(x,-len*Math.cos(pr));ctx.lineTo(x,len*Math.cos(pr));ctx.stroke()}
const PLANES=[
  {id:'classic',name:'Classic',tier:'default',draw:()=>drawPlaneClassic()},
  {id:'biplane',name:'Biplane',tier:'rare',draw:()=>{
    ctx.fillStyle='#ffd23f';ctx.fillRect(-12,-17,34,5);
    ctx.strokeStyle='#5c3d1e';ctx.lineWidth=1.6;ctx.beginPath();for(const x of [-6,14]){ctx.moveTo(x,-12);ctx.lineTo(x,6)}ctx.stroke();
    ctx.fillStyle='#e03131';ctx.beginPath();ctx.ellipse(0,0,34,8,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(-28,-3);ctx.lineTo(-40,-18);ctx.lineTo(-32,-18);ctx.lineTo(-20,-5);ctx.fill();
    ctx.fillStyle='#ffd23f';ctx.fillRect(-12,5,34,5);ctx.fillRect(-36,-2,10,3);
    ctx.fillStyle='#132238';ctx.beginPath();ctx.ellipse(6,-7,6,4,0,Math.PI,0);ctx.fill();
    ctx.fillStyle='#868e96';ctx.beginPath();ctx.arc(34,0,4,0,Math.PI*2);ctx.fill();propLine(38,12)}},
  {id:'cargo',name:'Cargo jet',tier:'epic',draw:()=>{
    ctx.fillStyle='#6c7a89';ctx.beginPath();ctx.moveTo(-34,-5);ctx.lineTo(-46,-26);ctx.lineTo(-36,-26);ctx.lineTo(-22,-8);ctx.fill();
    ctx.fillStyle='#8d99ae';ctx.beginPath();ctx.ellipse(0,0,44,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5c677d';ctx.beginPath();ctx.moveTo(-10,-10);ctx.lineTo(-24,-16);ctx.lineTo(18,-16);ctx.lineTo(14,-10);ctx.fill();
    ctx.fillStyle='#495057';ctx.beginPath();ctx.ellipse(2,-15,8,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#132238';ctx.beginPath();ctx.ellipse(34,-4,8,4.5,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#dee2e6';for(let x=-22;x<22;x+=7)ctx.fillRect(x,-4,3.5,3.5);
    ctx.fillStyle='#ffd23f';ctx.fillRect(-30,3,58,2.5)}},
  {id:'blimp',name:'Blimp',tier:'epic',draw:()=>{
    ctx.fillStyle='#868e96';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-34,-4);ctx.lineTo(-48,-4+s*16);ctx.lineTo(-40,-4+s*16);ctx.lineTo(-26,-4+s*4);ctx.fill()}
    const g=ctx.createLinearGradient(0,-22,0,14);g.addColorStop(0,'#f1f3f5');g.addColorStop(1,'#adb5bd');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,-4,46,17,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff5a36';ctx.fillRect(-38,-6,76,5);
    ctx.fillStyle='#495057';ctx.fillRect(-10,13,22,7);ctx.fillStyle='#a5d8ff';for(const x of [-7,0,7])ctx.fillRect(x,14.5,4,3);
    ctx.strokeStyle='#495057';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-8,13);ctx.lineTo(-4,11);ctx.moveTo(10,13);ctx.lineTo(6,11);ctx.stroke();propLine(-14,5)}},
  {id:'stealth',name:'Stealth jet',tier:'legendary',draw:()=>{
    ctx.fillStyle='#212529';ctx.beginPath();ctx.moveTo(46,0);ctx.lineTo(10,-8);ctx.lineTo(-36,-6);ctx.lineTo(-44,-22);ctx.lineTo(-30,-22);ctx.lineTo(-18,-8);ctx.lineTo(-40,4);ctx.lineTo(10,6);ctx.closePath();ctx.fill();
    ctx.fillStyle='#343a40';ctx.beginPath();ctx.moveTo(14,2);ctx.lineTo(-20,2);ctx.lineTo(-34,16);ctx.lineTo(-22,16);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ffd43b';ctx.beginPath();ctx.moveTo(26,-5);ctx.lineTo(12,-10);ctx.lineTo(2,-7);ctx.closePath();ctx.fill();
    const f=(Math.sin(performance.now()/60)+1)/2;ctx.fillStyle=`rgba(255,${140+f*80|0},60,.9)`;ctx.beginPath();ctx.moveTo(-40,-2);ctx.lineTo(-52-f*6,1);ctx.lineTo(-40,4);ctx.fill()}},
];
const PLANE_BY=Object.fromEntries(PLANES.map(c=>[c.id,c]));
function drawPlane(x,y,k,style){
  ctx.save();ctx.translate(x,y);ctx.scale(k,k);
  const bob=Math.sin(performance.now()/300)*1.5;ctx.translate(0,bob);
  (PLANE_BY[style||(prog.sel&&prog.sel.plane)]||PLANES[0]).draw();
  ctx.restore();
}
function drawPlaneClassic(){
  ctx.fillStyle='#e9eef6';ctx.beginPath();ctx.ellipse(0,0,40,10,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ff5a36';ctx.fillRect(-30,-2,58,4);
  ctx.beginPath();ctx.moveTo(-34,-4);ctx.lineTo(-46,-22);ctx.lineTo(-36,-22);ctx.lineTo(-24,-6);ctx.fill();
  ctx.fillStyle='#c9d3e2';ctx.beginPath();ctx.moveTo(-6,2);ctx.lineTo(-18,18);ctx.lineTo(-4,18);ctx.lineTo(10,2);ctx.fill();
  ctx.fillStyle='#132238';ctx.beginPath();ctx.ellipse(26,-3,8,4.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#132238';ctx.fillRect(-6,-3,9,9);
  ctx.strokeStyle='#132238';ctx.lineWidth=2;const pr=performance.now()/30;
  ctx.beginPath();ctx.moveTo(41,-11*Math.cos(pr));ctx.lineTo(41,11*Math.cos(pr));ctx.stroke();
}

// ---------- cosmetics: chutes (all the same size; only the look changes) ----------
function cLines(r,cy,col){ctx.strokeStyle=col||'rgba(30,30,40,.6)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(-r,cy);ctx.moveTo(0,-18);ctx.lineTo(r,cy);ctx.moveTo(0,-18);ctx.lineTo(0,cy-2);ctx.stroke()}
function cPath(r,cy,s=1){ctx.beginPath();ctx.ellipse(0,cy,r*s,r*0.75*s,0,Math.PI,0);ctx.closePath()}
function cFill(r,cy,col,s=1){cPath(r,cy,s);ctx.fillStyle=col;ctx.fill()}
function cClip(r,cy,fn){ctx.save();cPath(r,cy);ctx.clip();fn();ctx.restore()}
function cEdge(r,cy){cPath(r,cy);ctx.strokeStyle='rgba(19,34,56,.35)';ctx.lineWidth=1;ctx.stroke()}
function cGores(r,cy,cols,n){cClip(r,cy,()=>{for(let i=0;i<n;i++){ctx.fillStyle=cols[i%cols.length];ctx.fillRect(-r+i*2*r/n,cy-r,2*r/n+0.5,r+1)}})}
function cDots(r,cy,col,sz,step){cClip(r,cy,()=>{ctx.fillStyle=col;for(let y=cy-r*0.62;y<cy;y+=step)for(let x=-r+((Math.round((y-cy)/step)%2)?step/2:0);x<=r;x+=step){ctx.beginPath();ctx.arc(x,y,sz,0,Math.PI*2);ctx.fill()}})}
const CHUTES=[
  {id:'classic',name:'Classic',tier:'default',draw:(r,cy,d)=>{cFill(r,cy,d.suit);ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(0,cy,r*0.33,r*0.75,0,Math.PI,0);ctx.closePath();ctx.fill()}},
  {id:'stripes',name:'Stripes',tier:'common',main:'#e8412c',draw:(r,cy)=>{cGores(r,cy,['#e8412c','#ffffff'],7);cEdge(r,cy)}},
  {id:'polka',name:'Polka dots',tier:'common',main:'#3a7bf0',draw:(r,cy)=>{cFill(r,cy,'#3a7bf0');cDots(r,cy,'#ffffff',r*0.1,r*0.36)}},
  {id:'checker',name:'Checker',tier:'common',main:'#132238',draw:(r,cy)=>{cClip(r,cy,()=>{const q=r/3;for(let y=cy-r;y<cy;y+=q)for(let x=-r;x<r;x+=q){ctx.fillStyle=(Math.round((x+r)/q)+Math.round((y-cy)/q))%2?'#132238':'#f4f6fb';ctx.fillRect(x,y,q+0.4,q+0.4)}});cEdge(r,cy)}},
  {id:'twotone',name:'Two-tone',tier:'common',main:'#16a3a3',draw:(r,cy)=>{cGores(r,cy,['#16a3a3','#ffd23f'],2)}},
  {id:'sunset',name:'Sunset',tier:'common',main:'#ff7a3d',draw:(r,cy)=>{const g=ctx.createLinearGradient(0,cy-r*0.75,0,cy);g.addColorStop(0,'#ff4d6d');g.addColorStop(0.55,'#ff8a3d');g.addColorStop(1,'#ffd166');cFill(r,cy,g)}},
  {id:'sky',name:'Sky',tier:'common',main:'#7fc8ff',draw:(r,cy)=>{cFill(r,cy,'#7fc8ff');cClip(r,cy,()=>{ctx.fillStyle='#fff';for(const [x,y,s] of [[-0.45,-0.25,0.2],[-0.25,-0.32,0.24],[0.3,-0.45,0.18],[0.5,-0.4,0.15]]){ctx.beginPath();ctx.arc(x*r,cy+y*r,s*r,0,Math.PI*2);ctx.fill()}});cEdge(r,cy)}},
  {id:'watermelon',name:'Watermelon',tier:'rare',main:'#ff4d6d',draw:(r,cy)=>{cFill(r,cy,'#2f9e44');cFill(r,cy,'#ffffff',0.9);ctx.save();ctx.translate(0,0);cPath(r,cy,0.82);ctx.fillStyle='#ff4d6d';ctx.fill();ctx.restore();ctx.fillStyle='#1b1b1b';for(const [x,y] of [[-0.45,-0.18],[-0.15,-0.4],[0.2,-0.3],[0.48,-0.15],[0,-0.15]]){ctx.beginPath();ctx.ellipse(x*r,cy+y*r,r*0.05,r*0.08,0,0,Math.PI*2);ctx.fill()}}},
  {id:'pizza',name:'Pizza',tier:'rare',main:'#ffcf57',draw:(r,cy)=>{cFill(r,cy,'#d9902f');cFill(r,cy,'#ffcf57',0.84);ctx.fillStyle='#d63c2f';for(const [x,y] of [[-0.42,-0.2],[-0.08,-0.42],[0.32,-0.28],[0.06,-0.14],[0.55,-0.1]]){ctx.beginPath();ctx.arc(x*r,cy+y*r,r*0.11,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#3f8f3f';for(const [x,y] of [[-0.25,-0.32],[0.2,-0.5]])ctx.fillRect(x*r,cy+y*r,r*0.08,r*0.05)}},
  {id:'camo',name:'Camo',tier:'rare',main:'#6b8e4e',draw:(r,cy)=>{cFill(r,cy,'#7a9a55');cClip(r,cy,()=>{for(const [x,y,s,c] of [[-0.6,-0.2,0.3,'#3e5a2e'],[-0.1,-0.45,0.28,'#a3b56b'],[0.35,-0.2,0.32,'#2f3b22'],[0.1,-0.1,0.2,'#3e5a2e'],[0.6,-0.45,0.25,'#a3b56b'],[-0.35,-0.6,0.22,'#2f3b22']]){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x*r,cy+y*r,s*r,s*r*0.7,x,0,Math.PI*2);ctx.fill()}})}},
  {id:'flower',name:'Flower',tier:'rare',main:'#ff7eb6',draw:(r,cy)=>{ctx.fillStyle='#ff7eb6';for(let i=0;i<5;i++){const a=Math.PI+(i+0.5)*Math.PI/5;ctx.beginPath();ctx.arc(Math.cos(a)*r*0.62,cy+Math.sin(a)*r*0.46,r*0.36,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#ffd23f';ctx.beginPath();ctx.arc(0,cy-r*0.2,r*0.26,0,Math.PI*2);ctx.fill()}},
  {id:'leaf',name:'Leaf',tier:'rare',main:'#3fae5a',draw:(r,cy)=>{cFill(r,cy,'#3fae5a');ctx.strokeStyle='#23753a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-r*0.95,cy);ctx.quadraticCurveTo(0,cy-r*0.9,r*0.95,cy);for(const f of [-0.5,0,0.5]){ctx.moveTo(f*r,cy-r*0.45*(1-f*f*0.6));ctx.lineTo(f*r-r*0.12,cy-2)}ctx.stroke()}},
  {id:'bubble',name:'Bubble',tier:'rare',main:'#74c0fc',draw:(r,cy)=>{cFill(r,cy,'rgba(116,192,252,.55)');cPath(r,cy);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.95)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,cy,r*0.7,r*0.5,0,Math.PI*1.15,Math.PI*1.45);ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(r*0.45,cy-r*0.45,r*0.07,0,Math.PI*2);ctx.fill()}},
  {id:'jellyfish',name:'Jellyfish',tier:'epic',main:'#ff8fd1',noLines:true,draw:(r,cy)=>{ctx.strokeStyle='rgba(255,143,209,.85)';ctx.lineWidth=1.6;const t=performance.now()/260;for(const f of [-0.7,-0.3,0.1,0.5,0.8]){ctx.beginPath();ctx.moveTo(f*r,cy);for(let y=0;y<=1;y+=0.2)ctx.lineTo(f*r*(1-y)+Math.sin(t+y*6+f*4)*2,cy+y*(-18-cy));ctx.stroke()}cFill(r,cy,'rgba(255,143,209,.88)');ctx.fillStyle='rgba(255,255,255,.55)';for(const [x,y] of [[-0.35,-0.4],[0.1,-0.55],[0.45,-0.3]]){ctx.beginPath();ctx.arc(x*r,cy+y*r,r*0.09,0,Math.PI*2);ctx.fill()}}},
  {id:'mushroom',name:'Mushroom',tier:'epic',main:'#e03131',draw:(r,cy)=>{ctx.fillStyle='#f3e3c3';ctx.fillRect(-r*0.9,cy-1,r*1.8,3);cFill(r,cy,'#e03131');ctx.fillStyle='#fff';for(const [x,y,s] of [[-0.5,-0.25,0.14],[-0.05,-0.5,0.16],[0.45,-0.3,0.13],[0.15,-0.15,0.09],[-0.3,-0.55,0.08]]){ctx.beginPath();ctx.arc(x*r,cy+y*r,s*r,0,Math.PI*2);ctx.fill()}}},
  {id:'umbrella',name:'Umbrella',tier:'epic',main:'#7048e8',draw:(r,cy)=>{cGores(r,cy,['#7048e8','#ffd23f'],6);for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#ffd23f':'#7048e8';ctx.beginPath();ctx.arc(-r+r/6+i*2*r/6,cy,r/6,0,Math.PI);ctx.fill()}ctx.strokeStyle='#2b2b2b';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(0,cy-r*0.75);ctx.lineTo(0,cy-r*0.95);ctx.stroke()}},
  {id:'rainbow',name:'Rainbow',tier:'epic',main:'#ff6b6b',draw:(r,cy)=>{['#ff6b6b','#ffa94d','#ffe066','#69db7c','#4dabf7','#9775fa'].forEach((c,i)=>cFill(r,cy,c,1-i*0.14));cFill(r,cy,'#ffffff',0.16)}},
  {id:'balloon',name:'Hot-air balloon',tier:'legendary',main:'#e8590c',draw:(r,cy)=>{const by=cy-r*0.35;ctx.save();ctx.beginPath();ctx.ellipse(0,by,r*0.92,r*1.02,0,0,Math.PI*2);ctx.clip();for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#ffd23f':'#e8590c';ctx.fillRect(-r+i*r/3,by-r*1.1,r/3+0.5,r*2.2)}ctx.restore();ctx.strokeStyle='rgba(19,34,56,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,by,r*0.92,r*1.02,0,0,Math.PI*2);ctx.stroke()}},
  {id:'gold',name:'Gold',tier:'legendary',main:'#f5b800',draw:(r,cy)=>{const g=ctx.createLinearGradient(-r,cy-r,r,cy);g.addColorStop(0,'#fff3b0');g.addColorStop(0.35,'#ffd43b');g.addColorStop(0.7,'#f59f00');g.addColorStop(1,'#c77c00');cFill(r,cy,g);ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.ellipse(-r*0.35,cy-r*0.42,r*0.12,r*0.28,0.6,0,Math.PI*2);ctx.fill();const tw=(Math.sin(performance.now()/300)+1)/2;ctx.fillStyle=`rgba(255,255,255,${tw})`;ctx.fillRect(r*0.45,cy-r*0.62,1.5,5);ctx.fillRect(r*0.45-2,cy-r*0.62+2,5.5,1.5)}},
  {id:'diamond',name:'Diamond',tier:'legendary',main:'#a5d8ff',draw:(r,cy)=>{cFill(r,cy,'#a5d8ff');cClip(r,cy,()=>{const cs=['#d0ebff','#74c0fc','#e7f5ff','#4dabf7'];for(let i=0;i<6;i++){ctx.fillStyle=cs[i%4];ctx.beginPath();ctx.moveTo(0,cy+2);ctx.lineTo(-r+i*r/3,cy-r);ctx.lineTo(-r+(i+1)*r/3,cy-r);ctx.closePath();ctx.fill()}});cEdge(r,cy);const tw=(Math.sin(performance.now()/250)+1)/2;ctx.fillStyle=`rgba(255,255,255,${0.4+0.6*tw})`;for(const [x,y] of [[-0.4,-0.5],[0.35,-0.35]]){ctx.fillRect(x*r-0.75,cy+y*r-3,1.5,6);ctx.fillRect(x*r-3,cy+y*r-0.75,6,1.5)}}},
];
const CHUTE_BY=Object.fromEntries(CHUTES.map(c=>[c.id,c]));
const chuteOf=d=>CHUTE_BY[d.chuteStyle||(prog.sel&&prog.sel.chute)]||CHUTES[0];
const chuteMain=d=>{const c=chuteOf(d);return c.main||d.suit};
function drawChute(d,r){
  const cy=-40, c=chuteOf(d);
  if(!c.noLines) cLines(r,cy);
  c.draw(r,cy,d);
}
// ---------- cosmetics: divers (same stick figure, different outfit and head) ----------
const SKIN='#f2c9a0';
const DIVERS=[
  {id:'agent',name:'Agent',tier:'default',head:(x,y,r)=>{ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#132238';ctx.fillRect(x-r+0.5,y-2,2*r-1,2.4)}},
  {id:'ninja',name:'Ninja',tier:'common',body:'#22232b',head:(x,y,r,d)=>{ctx.fillStyle='#22232b';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle=SKIN;ctx.fillRect(x-r+1,y-1.6,2*r-2,2.2);ctx.fillStyle='#e03131';ctx.fillRect(x-r,y-r*0.7,2*r,1.6);ctx.beginPath();ctx.moveTo(x-r,y-r*0.6);ctx.lineTo(x-r-4,y-r*0.2);ctx.lineTo(x-r-3,y-r*0.9);ctx.fill()}},
  {id:'chef',name:'Chef',tier:'common',body:'#f1f3f5',head:(x,y,r)=>{ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.strokeStyle='rgba(19,34,56,.4)';ctx.lineWidth=0.8;ctx.fillRect(x-r*0.8,y-r*1.9,r*1.6,r*1.1);ctx.strokeRect(x-r*0.8,y-r*1.9,r*1.6,r*1.1);for(const dx of [-0.5,0,0.5]){ctx.beginPath();ctx.arc(x+dx*r,y-r*2.05,r*0.55,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.fillStyle='#132238';ctx.fillRect(x-r*0.45,y-0.5,1.2,1.2);ctx.fillRect(x+r*0.25,y-0.5,1.2,1.2)}},
  {id:'tourist',name:'Tourist',tier:'common',body:'#f08a24',head:(x,y,r)=>{ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9c46a';ctx.beginPath();ctx.ellipse(x,y-r*0.55,r*1.9,r*0.38,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x,y-r*0.9,r*0.95,r*0.65,0,Math.PI,0);ctx.fill();ctx.fillStyle='#e03131';ctx.fillRect(x-r*0.95,y-r*0.8,r*1.9,1.3);ctx.fillStyle='#132238';ctx.fillRect(x-r*0.7,y-0.4,r*0.55,1.6);ctx.fillRect(x+r*0.15,y-0.4,r*0.55,1.6)}},
  {id:'robot',name:'Robot',tier:'rare',body:'#3d4a5c',head:(x,y,r)=>{ctx.fillStyle=outlineCol();ctx.fillRect(x-r-1,y-r-1,2*r+2,2*r+2);ctx.fillStyle='#adb5bd';ctx.fillRect(x-r,y-r,2*r,2*r);ctx.fillStyle='#22d3ee';ctx.fillRect(x-r+1,y-1.5,2*r-2,2.4);ctx.strokeStyle='#495057';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x,y-r-3.5);ctx.stroke();ctx.fillStyle='#ff3b3b';ctx.beginPath();ctx.arc(x,y-r-4,1.4,0,Math.PI*2);ctx.fill()}},
  {id:'granny',name:'Granny',tier:'rare',body:'#9b5cf6',head:(x,y,r)=>{ctx.fillStyle='#dee2e6';ctx.beginPath();ctx.arc(x-r*0.6,y-r*0.75,r*0.6,0,Math.PI*2);ctx.fill();ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dee2e6';ctx.beginPath();ctx.arc(x,y-r*0.35,r,Math.PI*1.05,Math.PI*1.95);ctx.fill();ctx.strokeStyle='#132238';ctx.lineWidth=0.9;ctx.beginPath();ctx.arc(x-r*0.42,y+0.3,r*0.32,0,Math.PI*2);ctx.moveTo(x+r*0.74,y+0.3);ctx.arc(x+r*0.42,y+0.3,r*0.32,0,Math.PI*2);ctx.stroke()}},
  {id:'astronaut',name:'Astronaut',tier:'rare',body:'#eef1f6',head:(x,y,r)=>{ctx.fillStyle='#f8f9fa';ctx.strokeStyle='#adb5bd';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r*1.3,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#1c7ed6';ctx.beginPath();ctx.ellipse(x+0.5,y,r*0.95,r*0.7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.ellipse(x-r*0.3,y-r*0.25,r*0.28,r*0.16,-0.4,0,Math.PI*2);ctx.fill()}},
  {id:'chicken',name:'Chicken',tier:'epic',body:'#ffd23f',head:(x,y,r)=>{ctx.fillStyle='#e03131';for(const dx of [-0.45,0,0.45]){ctx.beginPath();ctx.arc(x+dx*r,y-r*0.95,r*0.38,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#fff3bf';ctx.beginPath();ctx.arc(x,y,r*1.05,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f08c00';ctx.beginPath();ctx.moveTo(x+r*0.8,y-0.5);ctx.lineTo(x+r*1.7,y+0.6);ctx.lineTo(x+r*0.8,y+1.8);ctx.fill();ctx.fillStyle='#132238';ctx.beginPath();ctx.arc(x+r*0.3,y-r*0.25,0.9,0,Math.PI*2);ctx.fill()}},
  {id:'dino',name:'Dino',tier:'epic',body:'#3fae5a',head:(x,y,r)=>{ctx.fillStyle='#2f9e44';for(const dx of [-0.55,-0.05,0.45]){ctx.beginPath();ctx.moveTo(x+dx*r-2,y-r*0.8);ctx.lineTo(x+dx*r,y-r*1.55);ctx.lineTo(x+dx*r+2,y-r*0.8);ctx.fill()}ctx.fillStyle='#51cf66';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(x+r*0.7,y+r*0.25,r*0.75,r*0.55,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#132238';ctx.beginPath();ctx.arc(x+r*0.15,y-r*0.3,0.9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x+r*0.9,y+r*0.45,1,1.2);ctx.fillRect(x+r*1.2,y+r*0.45,1,1.2)}},
  {id:'goldagent',name:'Gold agent',tier:'legendary',body:'#f2b705',head:(x,y,r)=>{ctx.fillStyle=SKIN;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(x-r*0.42,y-0.3,r*0.38,r*0.28,0,0,Math.PI*2);ctx.ellipse(x+r*0.42,y-0.3,r*0.38,r*0.28,0,0,Math.PI*2);ctx.fill();ctx.fillRect(x-r*0.1,y-0.8,r*0.2,0.9);ctx.fillStyle='#f59f00';ctx.beginPath();ctx.arc(x,y-r*0.15,r*1.02,Math.PI*1.12,Math.PI*1.88);ctx.lineTo(x,y-r*0.35);ctx.fill();const tw=(Math.sin(performance.now()/280)+1)/2;ctx.fillStyle=`rgba(255,255,255,${tw})`;ctx.fillRect(x+r*1.2,y-r*1.4,1.2,4);ctx.fillRect(x+r*1.2-1.4,y-r*1.4+1.4,4,1.2)}},
];
const DIVER_BY=Object.fromEntries(DIVERS.map(c=>[c.id,c]));
const diverOf=d=>DIVER_BY[d.diverStyle||(prog.sel&&prog.sel.diver)]||DIVERS[0];
const bodyCol=d=>d.dummy?d.suit:(diverOf(d).body||d.suit);
const outlineCol=()=>S&&S.night?'rgba(255,255,255,.75)':'rgba(19,34,56,.7)';   // keeps every skin readable from the corner of the eye
function drawBody(d,arms){
  const bc=bodyCol(d), lw=d.heavy?4:3;
  ctx.strokeStyle=bc;ctx.lineWidth=lw;
  if(d.heavy){ctx.fillStyle=bc;ctx.beginPath();ctx.ellipse(0,-11,6.5,7,0,0,Math.PI*2);ctx.fill()}
  ctx.beginPath();
  ctx.moveTo(0,-8);ctx.lineTo(-4,0);ctx.moveTo(0,-8);ctx.lineTo(4,0);ctx.moveTo(0,-8);ctx.lineTo(0,-16);
  if(arms==='up'){ctx.moveTo(0,-15);ctx.lineTo(-5,-22);ctx.moveTo(0,-15);ctx.lineTo(5,-22)}
  else if(arms==='cheer'){ctx.moveTo(0,-15);ctx.lineTo(-6,-23);ctx.moveTo(0,-15);ctx.lineTo(6,-23)}
  else {ctx.moveTo(0,-15);ctx.lineTo(-5,-9);ctx.moveTo(0,-15);ctx.lineTo(5,-9)}
  ctx.strokeStyle=outlineCol();ctx.lineWidth=lw+2;ctx.stroke();
  ctx.strokeStyle=bc;ctx.lineWidth=lw;ctx.stroke();
}
