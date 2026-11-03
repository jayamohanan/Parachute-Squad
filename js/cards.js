// ---------- how-to-play card (static picture) ----------
let howMode='start', howIntro=null;
// New-feature cards: shown once, before the first level that introduces the feature. Same style as the how-to card.
const INTROS=[
  {key:'steam', level:13, draw:drawSteamCard, aria:'Steam vents. Steam blows up from some roofs and slows the diver down. Wait for the diver to reach the green zone.'},
  {key:'lift', level:20, draw:drawLiftCard, aria:'Moving lifts. Some landing spots move up and down and the green zone moves with them. Tapping stops the lift.'},
  {key:'clouds', level:30, draw:drawCloudCard, aria:'Clouds. Clouds hide your divers until just above the green zone. Be ready to tap.'},
  {key:'faulty', level:40, draw:drawFaultyCard, aria:'Broken chutes. Some chutes pop off by themselves. Open a new one in the green zone.'},
  {key:'radar', level:RADAR_FROM, draw:drawRadarCard,
   aria:'Radar ahead. Open your chute in the red zone and you get caught. Don\'t open your chute in it.'},
];
function showHow(mode,intro){
  howMode=mode; howIntro=intro||null;
  $('howBtn').textContent=mode==='start'?'Start':mode==='intro'?'Play':'Practice'; $('howBack').hidden=mode!=='view'&&mode!=='gallery';
  $('howBtn').hidden=mode==='gallery'; $('howNav').hidden=mode!=='gallery';
  $('howCv').setAttribute('aria-label',howIntro?howIntro.aria:'Open too early and you lose a heart. Open in the green band for a perfect landing. Open too late and you crash.');
  $('levelsOv').hidden=true; $('endOv').hidden=true; $('startOv').hidden=true; $('howOv').hidden=false; drawHow();
}
$('howBtn').addEventListener('click',()=>{
  if(howMode==='gallery'){ showGallery(galIdx+1); return; }   // Space lands here while the button is hidden
  $('howOv').hidden=true;
  if(howMode==='intro'){ prog.seen=(prog.seen||[]).concat(howIntro.key); saveProg(); start(true); return; }
  startTraining(howMode==='start'?'level1':'levels'); });
$('howBack').addEventListener('click',()=>{ $('howOv').hidden=true; showLevels(); });
// Erase all progress (two taps, no browser dialog): back to the card + training jump as a brand-new player.
let resetArmed=0;
$('resetProg').addEventListener('click',e=>{
  const b=e.currentTarget;
  if(!resetArmed){ resetArmed=setTimeout(()=>{resetArmed=0;b.classList.remove('armed');b.textContent='Reset progress'},3000);
    b.classList.add('armed'); b.textContent='Tap again to erase all progress'; return; }
  clearTimeout(resetArmed); resetArmed=0; b.classList.remove('armed'); b.textContent='Reset progress';
  b.blur(); setDev(false); prog={stars:[],best:[],trained:false,seen:[]}; ensureEco(); saveProg(); curLevel=0; training=false; enterMode();
});
$('howOpen').addEventListener('click',()=>showHow('view'));
// Dev: flip through every tutorial card without playing to it. Nothing is marked as seen. Back returns to the level screen.
let galIdx=0;
function showGallery(i){
  const n=INTROS.length+1; galIdx=(i+n)%n;   // the how-to card first, then the intro cards in level order
  showHow('gallery',galIdx?INTROS[galIdx-1]:null);
  $('galPos').textContent=`${galIdx+1} / ${n}`;
}
$('galPrev').addEventListener('click',()=>showGallery(galIdx-1));
$('galNext').addEventListener('click',()=>showGallery(galIdx+1));
$('cardsBtn').addEventListener('click',e=>{ e.currentTarget.blur(); setDev(false); leaveResult(); stopRun();
  $('shopOv').hidden=true; $('gradOv').hidden=true; showGallery(0); });
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{ if(!$('howOv').hidden) drawHow() });
function cardKey(g,x,y){   // desktop version of the tap hand: a little SPACE key
  const w=44,h=18,x0=x-w/2,y0=y-h/2-8;
  g.fillStyle='#9aa5b8'; roundRect(g,x0,y0+3,w,h,4); g.fill();
  g.fillStyle='#f4f6fb'; roundRect(g,x0,y0,w,h,4); g.fill(); g.strokeStyle='#132238'; g.lineWidth=1.6; g.stroke();
  g.fillStyle='#132238'; g.font='bold 8px system-ui, sans-serif'; g.textAlign='center'; g.fillText('SPACE',x,y0+12.5);
}
function cardHand(g,x,y){   // tap hand + ripple (shared by all cards)
  if(inputMode==='key') return cardKey(g,x,y);
  g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2; g.beginPath(); g.arc(x-3,y-15,7,0,Math.PI*2); g.stroke();
  g.save(); g.translate(x,y); g.scale(0.85,0.85);
  g.fillStyle='#fff'; g.strokeStyle='#132238'; g.lineWidth=2.5; g.lineJoin='round';
  g.beginPath();g.moveTo(-6,-16);g.arc(-3,-16,3,Math.PI,0);g.lineTo(0,-4);g.lineTo(9,-2);g.quadraticCurveTo(14,0,13,8);
  g.lineTo(11,16);g.lineTo(-4,16);g.lineTo(-10,6);g.quadraticCurveTo(-12,1,-7,2);g.lineTo(-6,4);g.closePath();g.fill();g.stroke();
  g.restore();
}
function cardText(g,x,y,t,size,col,align='left'){
  g.textAlign=align; g.lineWidth=4; g.strokeStyle='rgba(19,34,56,.75)'; g.lineJoin='round';
  g.font=`${size}px "Lilita One", system-ui, sans-serif`; g.strokeText(t,x,y); g.fillStyle=col; g.fillText(t,x,y);
}
function cardPost(g,x,groundY,s=1){   // same radar post as in the game, bigger
  const mh=46*s, top=groundY-mh;
  g.fillStyle='#4b5563'; g.fillRect(x-2.5*s,top,5*s,mh); g.fillRect(x-10*s,groundY-5*s,20*s,5*s);
  g.fillStyle='#d1d5db'; g.strokeStyle='#374151'; g.lineWidth=2;
  g.beginPath(); g.ellipse(x,top-4*s,13*s,6*s,0,Math.PI,0); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#ff3b3b'; g.beginPath(); g.arc(x,top-12*s,3*s,0,Math.PI*2); g.fill();
  for(const [r,a] of [[16,.7],[26,.45],[36,.25]]){ g.strokeStyle=`rgba(255,90,90,${a})`; g.lineWidth=2;
    g.beginPath(); g.arc(x,top-10*s,r*s,-Math.PI*0.8,-Math.PI*0.2); g.stroke(); }
  return {x,y:top-12*s};
}
function cardScene(g,Wc,Hc,groundY){
  const sky=g.createLinearGradient(0,0,0,Hc); sky.addColorStop(0,'#2f6ccf'); sky.addColorStop(0.6,'#7fb4ee'); sky.addColorStop(0.95,'#ffe1b8');
  g.fillStyle=sky; g.fillRect(0,0,Wc,Hc);
  g.fillStyle='#6fae4f'; g.fillRect(0,groundY,Wc,Hc-groundY); g.fillStyle='#5a9440'; g.fillRect(0,groundY,Wc,4);
}
function cardBuilding(g,x0,x1,top,groundY,col){
  g.fillStyle=col; g.fillRect(x0,top,x1-x0,groundY-top);
  g.fillStyle='rgba(255,255,255,.28)'; for(let y=top+10;y<groundY-8;y+=14) for(let x=x0+8;x<x1-10;x+=13) g.fillRect(x,y,6,7);
  g.fillStyle='#3b3330'; g.fillRect(x0-2,top-4,x1-x0+4,5);
}
function cardBand(g,x0,x1,top,h){ g.fillStyle='rgba(47,216,138,.6)'; g.fillRect(x0,top,x1-x0,h); g.strokeStyle='#eafff4'; g.lineWidth=2; g.strokeRect(x0+1,top+1,x1-x0-2,h-2); }
const CARD_SUIT='#ff5a36', cardMk=(state,chuteT=1)=>({i:0,suit:CARD_SUIT,state,chuteT,heavy:false,dummy:false});
functionfor(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*0.45:r;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}g.closePath();g.fillStyle='#ffe066';g.fill();g.strokeStyle='#132238';g.lineWidth=1.5;g.stroke()}
function drawSteamCard(g,Wc,Hc){
  const groundY=372, top=300, cx=110; cardScene(g,Wc,Hc,groundY);
  cardText(g,Wc/2,34,'Steam vents!',26,'#ffffff','center'); drawPlane(250,62,0.7);
  cardBuilding(g,30,190,top,groundY,'#8d7bb8');
  for(let p=0;p<9;p++){ const f=p/9, y=top-16-f*170, r=10+f*22; g.fillStyle=`rgba(255,255,255,${0.55*(1-f*0.7)})`; g.beginPath(); g.arc(cx+Math.sin(p*1.9)*8,y,r,0,Math.PI*2); g.fill(); }
  g.fillStyle='#5b5f6b'; g.fillRect(cx-8,top-16,16,16); g.fillStyle='#3d414b'; g.fillRect(cx-10,top-18,20,4);
  cardBand(g,30,190,top-46,20);
  drawDiver(cardMk('fall'),cx,150,1.25,0);
  g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=2; for(const dx of [-14,0,14]){ g.beginPath(); g.moveTo(cx+dx,108); g.lineTo(cx+dx,96); g.stroke(); }
  cardText(g,cx+62,160,'Slow…',19,'#ffffff','center');
  drawDiver(cardMk('chute'),cx,top-28,1.25,0); cardHand(g,cx+34,top-22);
  cardText(g,Wc/2,395,'Steam slows divers down. Wait for it!',15,'#ffffff','center');
}
function drawLiftCard(g,Wc,Hc){
  const groundY=372, xa=40, xb=190, plat=276; cardScene(g,Wc,Hc,groundY);
  cardText(g,Wc/2,34,'Moving lifts!',26,'#ffffff','center'); drawPlane(250,62,0.7);
  g.setLineDash([5,5]); g.strokeStyle='rgba(255,255,255,.7)'; g.lineWidth=2; for(const y of [plat-40,plat+40]) g.strokeRect(xa,y,xb-xa,8); g.setLineDash([]);
  g.strokeStyle='#6b7280'; g.lineWidth=6; g.beginPath(); for(const f of [0.3,0.7]){const x=xa+(xb-xa)*f; g.moveTo(x,groundY); g.lineTo(x,plat+6)} g.stroke();
  g.fillStyle='#374151'; for(const f of [0.3,0.7]){const x=xa+(xb-xa)*f; g.fillRect(x-6,groundY-14,12,14)}
  g.fillStyle='#f2b705'; g.fillRect(xa,plat,xb-xa,9);
  g.save(); g.beginPath(); g.rect(xa,plat,xb-xa,9); g.clip(); g.fillStyle='#1b1b1b'; for(let x=xa-10;x<xb;x+=12){g.beginPath();g.moveTo(x,plat+9);g.lineTo(x+6,plat+9);g.lineTo(x+14,plat);g.lineTo(x+8,plat);g.fill()} g.restore();
  cardBand(g,xa,xb,plat-44,20);
  g.fillStyle='#ffffff'; const ax=222; g.fillRect(ax-3,plat-46,6,92);
  g.beginPath(); g.moveTo(ax,plat-62); g.lineTo(ax-12,plat-44); g.lineTo(ax+12,plat-44); g.fill();
  g.beginPath(); g.moveTo(ax,plat+62); g.lineTo(ax-12,plat+44); g.lineTo(ax+12,plat+44); g.fill();
  drawDiver(cardMk('fall'),115,128,1.25,0);
  g.setLineDash([3,5]); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2; g.beginPath(); g.moveTo(115,140); g.lineTo(115,180); g.stroke(); g.setLineDash([]);
  drawDiver(cardMk('chute'),115,plat-26,1.25,0); cardHand(g,152,plat-20);
  cardText(g,Wc/2,395,'The green zone rides the lift',15,'#ffffff','center');
}
function drawCloudCard(g,Wc,Hc){
  const groundY=372, base=236, bandTop=272; cardScene(g,Wc,Hc,groundY);
  cardText(g,Wc/2,34,'Clouds!',26,'#ffffff','center'); drawPlane(250,62,0.7);
  cardBand(g,0,Wc,bandTop,22);
  for(const [x,y,r] of [[10,200,40],[60,212,36],[110,196,44],[165,214,40],[220,198,44],[275,210,40],[320,198,40],[40,170,34],[140,166,36],[250,168,34],[300,176,30],[90,180,30],[200,176,32]]){
    g.fillStyle='rgba(205,220,240,.95)'; g.beginPath(); g.arc(x,y+6,r,0,Math.PI*2); g.fill(); }
  for(const [x,y,r] of [[10,196,36],[60,206,32],[110,190,40],[165,208,36],[220,192,40],[275,204,36],[320,192,36],[40,164,30],[140,160,32],[250,162,30],[300,170,26],[90,174,26],[200,170,28]]){
    g.fillStyle='#ffffff'; g.beginPath(); g.arc(x,y,r,0,Math.PI*2); g.fill(); }
  drawDiver(cardMk('fall'),110,base+20,1.25,0);   // just dropping out of the cloud
  g.fillStyle='#ff3b3b'; g.beginPath(); g.arc(142,base-8,11,0,Math.PI*2); g.fill(); g.fillStyle='#fff'; g.font='bold 15px "Lilita One", system-ui, sans-serif'; g.textAlign='center'; g.fillText('!',142,base-3);
  cardHand(g,152,bandTop+22);
  cardText(g,Wc/2,395,'Clouds hide your divers. Be ready!',15,'#ffffff','center');
}
function drawFaultyCard(g,Wc,Hc){
  const groundY=372, bandTop=290; cardScene(g,Wc,Hc,groundY);
  cardText(g,Wc/2,34,'Broken chutes!',26,'#ffffff','center'); drawPlane(250,62,0.7);
  cardBand(g,0,Wc,bandTop,22);
  const A={x:190,y:150};
  drawDiver(cardMk('fall'),A.x,A.y,1.25,0);
  g.fillStyle=CARD_SUIT; for(const [dx,dy,r] of [[-26,-54,0.5],[18,-62,-0.4],[-6,-74,0.2],[30,-44,0.9]]){ g.save(); g.translate(A.x+dx,A.y+dy); g.rotate(r); g.fillRect(-8,-4,16,8); g.restore(); }
  g.fillStyle='#fff'; for(const [dx,dy] of [[-14,-66],[10,-50]]){ g.fillRect(A.x+dx,A.y+dy,8,5); }
  cardText(g,A.x-52,A.y-40,'POP!',22,'#ffffff','center');
  g.setLineDash([3,5]); g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2; g.beginPath(); g.moveTo(A.x-10,A.y+10); g.lineTo(100,bandTop-74); g.stroke(); g.setLineDash([]);
  g.fillStyle='rgba(255,255,255,.9)'; g.beginPath(); g.moveTo(96,bandTop-66); g.lineTo(108,bandTop-74); g.lineTo(96,bandTop-80); g.fill();
  drawDiver(cardMk('chute'),86,bandTop+20,1.25,0); cardHand(g,122,bandTop+24);
  cardText(g,Wc/2,395,'Chute popped? Open a new one in the green!',14,'#ffffff','center');
}
// "RADAR ZONE" marker: a long double-headed arrow whose tips touch the top and bottom of the zone, label beside it.
// side: where the label sits ('right' = label to the LEFT of the arrow, for the card's right edge; 'left' = label to the right).
function zoneMarker(g,x,top,bot,s,side){
  const red='#ff3b3b', head=9*s, hw=7*s;
  g.save(); g.lineCap='round'; g.lineJoin='round';
  const shaft=()=>{ g.beginPath(); g.moveTo(x,top+head); g.lineTo(x,bot-head); g.stroke(); };
  const heads=()=>{ g.beginPath(); g.moveTo(x,top); g.lineTo(x-hw,top+head); g.lineTo(x+hw,top+head); g.closePath();
    g.moveTo(x,bot); g.lineTo(x-hw,bot-head); g.lineTo(x+hw,bot-head); g.closePath(); };
  g.strokeStyle='rgba(255,255,255,.95)'; g.lineWidth=7*s; shaft(); heads(); g.lineWidth=4*s; g.stroke();   // white outline reads on any sky
  g.strokeStyle=red; g.lineWidth=3.5*s; shaft(); heads(); g.fillStyle=red; g.fill();
  // little end ticks so the boundaries read as edges, not just arrow tips
  g.strokeStyle=red; g.lineWidth=2.5*s; g.beginPath(); g.moveTo(x-11*s,top); g.lineTo(x+11*s,top); g.moveTo(x-11*s,bot); g.lineTo(x+11*s,bot); g.stroke();
  const mid=(top+bot)/2, tx=side==='right'?x-14*s:x+14*s, al=side==='right'?'right':'left';
  g.font=`${Math.round(16*s)}px "Lilita One", system-ui, sans-serif`; g.textAlign=al; g.lineWidth=4*s; g.strokeStyle='rgba(19,34,56,.85)'; g.fillStyle='#fff';
  for(const [t,dy] of [['RADAR',-3*s],['ZONE',15*s]]){ g.strokeText(t,tx,mid+dy); g.fillText(t,tx,mid+dy); }
  // danger triangle, centred above the label
  const ix=side==='right'?tx-24*s:tx+24*s, iy=mid-30*s;
  g.beginPath(); g.moveTo(ix,iy-10*s); g.lineTo(ix+11*s,iy+9*s); g.lineTo(ix-11*s,iy+9*s); g.closePath();
  g.fillStyle='#ffd23f'; g.fill(); g.strokeStyle='#132238'; g.lineWidth=2.5*s; g.stroke();
  g.beginPath(); g.moveTo(ix,iy-3.5*s); g.lineTo(ix,iy+2*s); g.lineWidth=2.6*s; g.stroke();
  g.beginPath(); g.arc(ix,iy+5.8*s,1.5*s,0,Math.PI*2); g.fillStyle='#132238'; g.fill();
  g.restore();
}
function drawRadarCard(g,Wc,Hc){
  const groundY=372, bandTop=300, bandH=22, zTop=78, zBot=232;
  const sky=g.createLinearGradient(0,0,0,Hc); sky.addColorStop(0,'#2f6ccf'); sky.addColorStop(0.6,'#7fb4ee'); sky.addColorStop(0.95,'#ffe1b8');
  g.fillStyle=sky; g.fillRect(0,0,Wc,Hc);
  // radar zone: the same red grid as in the game, with a clear bottom edge for the picture
  g.fillStyle='rgba(255,107,74,.22)'; g.fillRect(0,zTop,Wc,zBot-zTop);
  // band + ground
  g.fillStyle='rgba(47,216,138,.6)'; g.fillRect(0,bandTop,Wc,bandH);
  g.strokeStyle='#eafff4'; g.lineWidth=2; g.strokeRect(1,bandTop+1,Wc-2,bandH-2);
  g.fillStyle='#6fae4f'; g.fillRect(0,groundY,Wc,Hc-groundY); g.fillStyle='#5a9440'; g.fillRect(0,groundY,Wc,4);
  // title
  cardText(g,Wc/2,34,'Skip radar zone',26,'#ffffff','center');
  drawPlane(262,60,0.75);   // the plane flies above the radar
  const SUIT='#ff5a36', mk=(state,chuteT=1)=>({i:0,suit:SUIT,state,chuteT,heavy:false,dummy:false});
  // MIDDLE: opened inside the radar -> caught
  const A={x:150,y:178};
  const post=cardPost(g,34,groundY,1);
  g.fillStyle='rgba(255,240,150,.55)'; g.beginPath(); g.moveTo(post.x,post.y); g.lineTo(A.x-24,A.y-60); g.lineTo(A.x+26,A.y-44); g.closePath(); g.fill();
  drawDiver(mk('chute'),A.x,A.y,1.3,0);
  cardHand(g,A.x+32,A.y+6);
  g.fillStyle='#ff3b3b'; g.beginPath(); g.arc(A.x+22,A.y-72,11,0,Math.PI*2); g.fill();
  g.fillStyle='#fff'; g.font='bold 15px "Lilita One", system-ui, sans-serif'; g.textAlign='center'; g.fillText('!',A.x+22,A.y-67);
  cardText(g,A.x-54,A.y+40,'✕ Caught!',19,'#ff8a7a','center');
  // LEFT to RIGHT: fall through closed, open below the radar -> safe
  cardPost(g,292,groundY,1);
  const B1={x:48,y:124}, B2={x:222,y:bandTop+bandH-2};   // reads top-left to bottom-right, like the how-to card
  drawDiver(mk('fall'),B1.x,B1.y,1.25,0);
  drawDiver(mk('chute'),B2.x,B2.y,1.25,0);
  cardHand(g,B2.x-30,B2.y-4);
  cardText(g,B2.x+44,bandTop-48,'✓ Safe',19,'#9ff2c4','center');
  // RIGHT EDGE: radar zone marker, a double arrow spanning the whole red zone (same marker as in the game)
  zoneMarker(g,300,zTop,zBot,1,'right');
  // rule line at the bottom (on the ground)
  cardText(g,Wc/2,395,"Don't open your chute in the red zone",15,'#ffffff','center');
}
function drawHow(){
  const c=$('howCv'), g=c.getContext('2d'), Wc=320, Hc=400, sc=c.width/Wc;
  const saved=ctx; ctx=g; g.setTransform(sc,0,0,sc,0,0);
  if(howIntro){ g.clearRect(0,0,Wc,Hc); howIntro.draw(g,Wc,Hc); ctx=saved; return; }
  const now=0, groundY=372, bandTop=268, bandH=40;   // band holds the diver's body (not the chute)
  // sky + ground
  const sky=g.createLinearGradient(0,0,0,Hc); sky.addColorStop(0,'#2f6ccf'); sky.addColorStop(0.6,'#7fb4ee'); sky.addColorStop(0.95,'#ffe1b8');
  g.fillStyle=sky; g.fillRect(0,0,Wc,Hc);
  g.fillStyle='rgba(255,255,255,.75)'; for(const [x,y,s] of [[150,78,1],[250,120,0.8],[150,200,0.9]]){g.beginPath();g.ellipse(x,y,30*s,10*s,0,0,Math.PI*2);g.ellipse(x+12*s,y-8*s,16*s,11*s,0,0,Math.PI*2);g.fill()}
  // perfect band, full width: see-through so it sits in the sky, no outline (the outline is an in-game helper)
  g.fillStyle='rgba(47,216,138,.38)'; g.fillRect(0,bandTop,Wc,bandH);
  g.fillStyle='#6fae4f'; g.fillRect(0,groundY,Wc,Hc-groundY); g.fillStyle='#5a9440'; g.fillRect(0,groundY,Wc,4);
  // One diver's story reads top-left → bottom-right: dropped from a plane flying right, the diver keeps drifting right. Jump, then three places you could tap.
  const F={x:54,y:92}, d1={x:96,y:158}, d2={x:136,y:bandTop+bandH-4}, d3={x:170,y:groundY-6};
  // plane (top right: it has flown on past the diver)
  drawPlane(244,40,0.9);
  const SUIT='#ff5a36', mk=(state,chuteT=1)=>({i:0,suit:SUIT,state,chuteT,heavy:false,dummy:false});
  { const d=mk('fall'); g.save(); g.translate(F.x,F.y); g.rotate(-0.35); g.scale(1.45,1.45);   // just jumped: a clear little person, arms up
    g.lineCap='round'; g.lineJoin='round'; drawBody(d,'up'); drawHead(d,0,-20); g.restore(); }
  g.setLineDash([3,5]); g.strokeStyle='rgba(255,255,255,.75)'; g.lineWidth=2;
  g.beginPath(); g.moveTo(F.x+8,F.y+8); g.lineTo(F.x+20,F.y+24); g.stroke(); g.setLineDash([]);
  g.fillStyle='rgba(255,255,255,.85)'; g.beginPath(); g.moveTo(F.x+24,F.y+30); g.lineTo(F.x+15,F.y+25); g.lineTo(F.x+23,F.y+20); g.fill();
  drawDiver(mk('chute'),d1.x,d1.y,1.25,now);                  // 1. tapped too high
  drawDiver(mk('chute'),d2.x,d2.y,1.25,now);                  // 2. tapped in the band
  drawDiver(mk('chute',0.02),d3.x,d3.y,1.25,now);             // 3. tapped too low: chute barely open
  const hand=(x,y)=>{   // tap hand + ripple (a SPACE key on desktop)
    if(inputMode==='key') return cardKey(g,x+4,y);
    g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=2; g.beginPath(); g.arc(x-3,y-15,7,0,Math.PI*2); g.stroke();
    g.save(); g.translate(x,y); g.scale(0.85,0.85);
    g.fillStyle='#fff'; g.strokeStyle='#132238'; g.lineWidth=2.5; g.lineJoin='round';
    g.beginPath();g.moveTo(-6,-16);g.arc(-3,-16,3,Math.PI,0);g.lineTo(0,-4);g.lineTo(9,-2);g.quadraticCurveTo(14,0,13,8);
    g.lineTo(11,16);g.lineTo(-4,16);g.lineTo(-10,6);g.quadraticCurveTo(-12,1,-7,2);g.lineTo(-6,4);g.closePath();g.fill();g.stroke();
    g.restore();
  };
  // hands sit in their own column at the left, level with each diver: they say WHEN to tap, not WHERE (tap anywhere)
  hand(36,d1.y-14); hand(36,bandTop+bandH/2+14); hand(36,groundY-10);
  // marks
  const stroke2=(col,draw)=>{ g.lineCap='round'; g.lineJoin='round'; g.beginPath(); draw();   // dark outline, then the colour
    g.strokeStyle='#132238'; g.lineWidth=8; g.stroke(); g.strokeStyle=col; g.lineWidth=4.5; g.stroke(); };
  const cross=(cx,cy,r)=>stroke2('#ff4d4d',()=>{g.moveTo(cx-r,cy-r);g.lineTo(cx+r,cy+r);g.moveTo(cx+r,cy-r);g.lineTo(cx-r,cy+r)});
  const tick=(cx,cy,r)=>stroke2('#3be07a',()=>{g.moveTo(cx-r,cy);g.lineTo(cx-r*0.25,cy+r*0.75);g.lineTo(cx+r,cy-r*0.75)});
  // each mark sits just left of its diver, level with the body
  cross(d1.x-30,d1.y-16,8);   // too early
  tick(d2.x-30,d2.y-16,10);   // perfect
  cross(d3.x-30,d3.y-16,8);   // too late
  g.strokeStyle='rgba(90,70,50,.7)'; g.lineWidth=2; for(const a of [-0.9,-0.5,0.5,0.9]){g.beginPath();g.moveTo(d3.x+Math.sin(a)*10,groundY+2);g.lineTo(d3.x+Math.sin(a)*22,groundY-6);g.stroke()}
  // labels (numbered top to bottom)
  const label=(x,y,num,t1,t2,col)=>{
    g.textAlign='left'; g.lineWidth=4; g.strokeStyle='rgba(19,34,56,.75)'; g.lineJoin='round';
    g.font='19px "Lilita One", system-ui, sans-serif'; g.strokeText(`${num}. ${t1}`,x,y); g.fillStyle=col; g.fillText(`${num}. ${t1}`,x,y);
    if(t2){ g.font='15px "Lilita One", system-ui, sans-serif'; g.strokeText(t2,x+18,y+19); g.fillStyle='#fff'; g.fillText(t2,x+18,y+19); }
  };
  label(d1.x+46,d1.y-8,1,'Too early','','#ff8a7a');
  label(d2.x+28,bandTop+bandH/2+7,2,'Perfect','','#ffffff');
  label(d3.x+33,groundY-22,3,'Too late','','#ffb547');
  ctx=saved;
}

function drawDiver(d,x,y,k,now){
  const s=d.heavy?1.3:1;
  ctx.save();ctx.translate(x,y);ctx.scale(k*s,k*s);
  ctx.lineCap='round';ctx.lineJoin='round';
  if(d.state==='landed'&&d.outcome==='crash'){
    const t=d.landT, bounce=t<0.35?Math.sin(t/0.35*Math.PI)*9:0;
    ctx.fillStyle='rgba(60,42,28,.45)';ctx.beginPath();ctx.ellipse(0,1,16,3.5,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(0,-bounce);   // flat on its back, one bounce
    ctx.strokeStyle=bodyCol(d);ctx.lineWidth=d.heavy?4:3;ctx.beginPath();
    ctx.moveTo(-9,-2);ctx.lineTo(5,-2);ctx.moveTo(-9,-2);ctx.lineTo(-15,-6);ctx.moveTo(-9,-2);ctx.lineTo(-15,1);
    ctx.moveTo(3,-2);ctx.lineTo(8,-8);ctx.moveTo(3,-2);ctx.lineTo(9,1);ctx.stroke();
    drawHead(d,10,-3);ctx.restore();
    if(t<1.8){ctx.fillStyle='#ffe066';for(let q=0;q<3;q++){const a=t*4+q*2.1;ctx.fillRect(10+Math.cos(a)*8-1.5,-14+Math.sin(a)*2.5,3,3)}}
    const f=Math.min(1,t/0.7), e=1-Math.pow(1-f,2), cx=-2+5*e, cy=-46+42*e, rx=17+7*e, ry=12.75*(1-e)+4.5*e;
    ctx.strokeStyle='rgba(30,30,40,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,-4);ctx.lineTo(cx-rx*0.8,cy);ctx.moveTo(0,-4);ctx.lineTo(cx+rx*0.8,cy);ctx.stroke();
    ctx.fillStyle=chuteMain(d);ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,0,Math.PI,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.ellipse(cx,cy,rx*0.33,ry,0,Math.PI,0);ctx.closePath();ctx.fill();
    ctx.restore();return;
  }
  if(d.state==='landed'&&d.outcome==='splat'){
    ctx.fillStyle='rgba(60,42,28,.55)';ctx.beginPath();ctx.ellipse(0,1,18,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=bodyCol(d);ctx.beginPath();ctx.ellipse(0,-1.5,13,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=d.dummy?'#f2b705':'#f2c9a0';ctx.beginPath();ctx.ellipse(11,-2,4,2.5,0,0,Math.PI*2);ctx.fill();
    if(d.landT<1.6){ctx.fillStyle='#ffe066';for(let q=0;q<3;q++){const a=d.landT*4+q*2.1;ctx.fillRect(Math.cos(a)*10-1.5,-12+Math.sin(a)*3,3,3)}}
    ctx.restore();return;
  }
  if(d.state==='landed'){
    const fade=Math.max(0,1-d.landT/1.2);
    if(fade>0){ctx.globalAlpha=fade;ctx.fillStyle=chuteMain(d);ctx.beginPath();ctx.ellipse(-12,-3,12,4,0,Math.PI,0);ctx.fill();ctx.globalAlpha=1}
    drawBody(d,d.rating==='perfect'?'cheer':'down');drawHead(d,0,-21);
    ctx.restore();return;
  }
  if(d.state==='chute'||d.state==='pre'){
    const open=Math.min(1,d.chuteT/0.22), sc=0.25+0.75*open*(1+0.08*Math.sin(Math.min(1,d.chuteT/0.4)*Math.PI));
    if(d.state==='pre') ctx.rotate(Math.sin(now*3+d.i)*0.06);
    drawChute(d,17*sc);
    drawBody(d,'up');drawHead(d,0,-20);ctx.restore();return;
  }
  // free fall: spread-eagle star with flutter
  const fl=Math.sin(now*14+d.i)*1.5;
  const lw=d.heavy?4:3;
  if(d.heavy){ctx.fillStyle=outlineCol();ctx.beginPath();ctx.ellipse(0,-10,7.5,8,0,0,Math.PI*2);ctx.fill()}
  const limbs=new Path2D();
  limbs.moveTo(0,-6);limbs.lineTo(-6,1+fl);limbs.moveTo(0,-6);limbs.lineTo(6,1-fl);
  limbs.moveTo(0,-6);limbs.lineTo(0,-14);
  limbs.moveTo(0,-12);limbs.lineTo(-8,-18-fl);limbs.moveTo(0,-12);limbs.lineTo(8,-18+fl);
  ctx.strokeStyle=outlineCol();ctx.lineWidth=lw+2;ctx.stroke(limbs);
  if(d.heavy){ctx.fillStyle=bodyCol(d);ctx.beginPath();ctx.ellipse(0,-10,6.5,7,0,0,Math.PI*2);ctx.fill()}
  ctx.strokeStyle=bodyCol(d);ctx.lineWidth=lw;ctx.stroke(limbs);
  drawHead(d,0,-18);
  ctx.restore();
}
function drawHead(d,x,y){
  const r=d.heavy?5.5:4.5;
  if(d.dummy){
    ctx.fillStyle='#f2b705';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1b1b1b';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,0,Math.PI/2);ctx.fill();
    ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,r,Math.PI,Math.PI*1.5);ctx.fill();
  } else { ctx.fillStyle=outlineCol(); ctx.beginPath(); ctx.arc(x,y,r+1,0,Math.PI*2); ctx.fill(); diverOf(d).head(x,y,r,d); }
}

// ---------- training graduation card ----------
function drawBadge(cv){
  const g=cv.getContext('2d'), sc=cv.width/320, saved=ctx; ctx=g; g.setTransform(sc,0,0,sc,0,0);
  const W2=320,H2=180; g.clearRect(0,0,W2,H2);
  g.fillStyle='#e9eef6'; g.beginPath(); g.roundRect?g.roundRect(0,0,W2,H2,14):g.rect(0,0,W2,H2); g.fill();
  g.fillStyle='#132238'; g.fillRect(0,0,W2,36);
  g.fillStyle='#ff5a36'; g.fillRect(0,36,W2,5);
  g.fillStyle='#fff'; g.font='20px "Lilita One", system-ui, sans-serif'; g.textAlign='left'; g.fillText('AGENT',16,25);
  g.fillStyle='#9fb2cf'; g.font='bold 11px system-ui, sans-serif'; g.textAlign='right'; g.fillText('SKY DIVISION',W2-16,23);
  g.fillStyle='#bcd6f5'; g.fillRect(16,52,96,112); g.strokeStyle='#132238'; g.lineWidth=2; g.strokeRect(16,52,96,112);
  drawDiver({i:0,suit:'#ff5a36',state:'landed',landT:9,rating:'perfect',outcome:'safe',heavy:false,dummy:false},64,156,3.1,0);
  g.fillStyle='#132238'; g.font='bold 12px system-ui, sans-serif'; g.textAlign='left'; g.fillText('TRAINING',128,66);
  g.fillStyle='#c4cfdd'; for(const [y,w] of [[82,150],[100,120],[118,140]]) g.fillRect(128,y,w,8);
  g.setTransform(1,0,0,1,0,0); ctx=saved;
}
function showGrad(perf,hs,gift){
  const ready=perf>=3;
  $('levelsOv').hidden=true; $('endOv').hidden=true; $('gradOv').hidden=false;
  drawBadge($('gradCv'));
  const st=$('gradStamp'); st.textContent=ready?'READY!':'ALMOST!'; st.className='stamp'+(ready?'':' soft');
  st.style.animation='none'; void st.offsetWidth; st.style.animation='';
  $('gradStrip').style.setProperty('--n',hs.length);
  $('gradStrip').innerHTML=hs.map((d,i)=>{const c=d.rating==='perfect'?'perfect':'miss';
    return `<div class="tile ${c}" style="--d:${(i*0.06).toFixed(2)}s">${TILE_ICON[c]}</div>`}).join('');
  $('gradCoins').innerHTML=gift?`<i class="coin"></i><span>+${gift}</span>`:'';
  const acts=$('gradActs'); acts.innerHTML='';
  const startB=document.createElement('button'); startB.textContent='Start';
  startB.onclick=()=>{ $('gradOv').hidden=true; curLevel=0; showLevels(); };
  if(ready){ startB.className='btn'; acts.appendChild(startB); SFX.end(true); }
  else { const pr=document.createElement('button'); pr.className='btn'; pr.textContent='Practice again';
    pr.onclick=()=>{ $('gradOv').hidden=true; startTraining('grad'); };
    startB.className='btn ghost'; acts.appendChild(pr); acts.appendChild(startB); SFX.rate('good',0); }
}

// ---------- fit cards to short screens (the store scrolls instead; the result only scales on a phone on its side, and scrolls on a short upright screen) ----------
const fitList=[...document.querySelectorAll('.ov .card:not(.shopcard), .ov .result')];
function fitCards(){
  for(const c of fitList){
    const h=c.offsetHeight; if(!h) continue;   // hidden
    const isResult=c.classList.contains('result');
    if(isResult&&!shortWide()){ c.style.transform=''; continue; }
    const s=Math.min(1,(c.closest('.ov').clientHeight-32)/h);   // 32 = the overlay's padding
    c.style.transform=s<1?`scale(${s})`:'';
  }
}
