// ---------- fake rewarded ad (stands in for PokiSDK.rewardedBreak: reward only when it finishes) ----------
let adCb=null, adCancel=null, adTimer=0;
function watchAd(onDone,onCancel){
  const ov=$('adOv'), fill=$('adFill'); ov.hidden=false;
  fill.style.transition='none'; fill.style.width='0'; void fill.offsetWidth; fill.style.transition='width 15s linear'; fill.style.width='100%';
  adCb=onDone; adCancel=onCancel||null; clearTimeout(adTimer);
  adTimer=setTimeout(()=>{ ov.hidden=true; const cb=adCb; adCb=null; if(cb) cb(); },15000);
}
$('adClose').addEventListener('click',()=>{ clearTimeout(adTimer); adCb=null; $('adOv').hidden=true; const c=adCancel; adCancel=null; if(c) c(); });

// ---------- store ----------
const LISTS={chute:CHUTES,diver:DIVERS,plane:PLANES};
const KIND_NAME={chute:'chute',diver:'diver',plane:'plane'};
let shopCoinFx=0;   // bumps when the store's coin counter is set directly, which ends any count-up in progress
function refreshCoins(){ shopCoinFx++; $('coinN').textContent=prog.coins; $('shopCoins').textContent=prog.coins; }
function itemThumb(cv,kind,id){
  const g=cv.getContext('2d'), sc=cv.width/64, saved=ctx; ctx=g; g.setTransform(sc,0,0,sc,0,0); g.clearRect(0,0,64,64);
  if(kind==='plane') drawPlane(32,33,0.66,id);
  else if(kind==='chute') drawDiver({i:0,suit:'#ff5a36',state:'chute',chuteT:1,heavy:false,dummy:false,chuteStyle:id,diverStyle:'agent'},32,89,1.42,0);
  else drawDiver({i:0,suit:'#ff5a36',state:'landed',landT:9,rating:'perfect',outcome:'safe',heavy:false,dummy:false,diverStyle:id},32,58,1.6,0);
  g.setTransform(1,0,0,1,0,0); ctx=saved;
}
function shopCoinsArrive(from){   // the store is already drawn with the new total: wind it back, fly the coins in, count up
  const to=prog.coins, tot=$('shopCoins'), pill=tot.parentElement, tok=shopCoinFx, alive=()=>tok===shopCoinFx&&!$('shopOv').hidden;
  if(reduceMotion){ popEl(pill); SFX.coin(); return; }
  tot.textContent=from; flyCoins($('adCoins'),pill);
  setTimeout(()=>{ if(alive()) countUp(tot,from,to,FLY_TOTAL-FLY_MS,alive); },FLY_MS);
  setTimeout(()=>{ if(alive()){ tot.textContent=to; popEl(pill); SFX.coin(); } },FLY_TOTAL);
}
function itemTile(kind,id){ return $('shopGrid').querySelector(`[data-key="${kind}:${id}"]`); }
function celebrateItem(kind,id){   // same look as the reward track's unlock: rays, item pops, UNLOCKED! stamp, confetti
  const el=itemTile(kind,id), cv=el.querySelector('canvas'), wrap=document.createElement('div'), cols=['#ff5a36','#ffd23f','#2fd88a','#4dabf7','#e8417a','#ffffff'];
  wrap.className='tcan'; wrap.innerHTML='<div class="rays"></div>'; cv.parentNode.insertBefore(wrap,cv); wrap.appendChild(cv);
  el.classList.add('justgot');
  el.insertAdjacentHTML('beforeend','<div class="stamp">UNLOCKED!</div>'+(reduceMotion?'':Array.from({length:14},()=>`<i class="cf" style="background:${cols[Math.random()*cols.length|0]};--x:${(Math.random()*120-60).toFixed(0)}px;--y:${(-Math.random()*70-10).toFixed(0)}px;--r:${(Math.random()*720-360).toFixed(0)}deg"></i>`).join('')));
  SFX.end(true);
  setTimeout(()=>{ if(!el.isConnected) return; el.querySelectorAll('.rays,.stamp,.cf').forEach(x=>x.remove()); el.classList.remove('justgot'); },2200);
}
function adStepDone(kind,id){ const t=itemTile(kind,id), a=t.querySelector('.ibtn.ad'); popEl(a); t.querySelector('canvas').animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:320}); SFX.star(0); }
let shopTab='chute';
function renderShop(){
  refreshCoins();
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.tab===shopTab));
  const grid=$('shopGrid'); grid.innerHTML='';
  const kind=shopTab;
  for(const it of LISTS[kind]){
    const own=owns(kind,it.id), sel=prog.sel[kind]===it.id, price=(PRICE[kind]||{})[it.tier], need=AD_NEED[it.tier], key=kind+':'+it.id, have=prog.adp[key]||0;
    const el=document.createElement('div'); el.className='item'+(sel?' sel':''); el.dataset.key=key;
    el.innerHTML=`<canvas width="128" height="128"></canvas><div class="nm">${it.name}</div><div class="tr ${it.tier}">${it.tier==='default'?'Starter':it.tier}</div><div class="acts"></div>`;
    itemThumb(el.querySelector('canvas'),kind,it.id);
    const acts=el.querySelector('.acts');
    if(own){
      const b=document.createElement('button'); b.className='ibtn'+(sel?' using':''); b.textContent=sel?'✓ Using':'Use';
      if(!sel) b.onclick=()=>{ prog.sel[kind]=it.id; saveProg(); renderShop(); };
      acts.appendChild(b);
    } else {
      const b=document.createElement('button'); b.className='ibtn'+(prog.coins<price?' cant':''); b.innerHTML=`<i class="coin sm"></i>${price}`;
      b.onclick=()=>{
        if(prog.coins<price){ b.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'none'}],{duration:200}); return; }
        prog.coins-=price; grant(kind,it.id,true); renderShop(); celebrateItem(kind,it.id); };
      acts.appendChild(b);
      if(need){
        const a=document.createElement('button'); a.className='ibtn ad'; a.innerHTML=`${AD_ICO} ${have}/${need}`;
        a.onclick=()=>watchAd(()=>{ prog.adp[key]=(prog.adp[key]||0)+1; const got=prog.adp[key]>=need; if(got) grant(kind,it.id,true); saveProg(); renderShop(); if(got) celebrateItem(kind,it.id); else adStepDone(kind,it.id); });
        acts.appendChild(a);
      }
    }
    grid.appendChild(el);
  }
  updateAdCoinsBtn();
}
function updateAdCoinsBtn(){
  const left=Math.max(0,(prog.adCoinsT||0)+AD_COINS_CD-Date.now()), ab=$('adCoins');
  ab.disabled=left>0; ab.style.opacity=left>0?.5:1;
  ab.innerHTML=left>0?`${AD_ICO} +${AD_COINS} in ${Math.ceil(left/1000)}s`:`${AD_ICO} +${AD_COINS} <i class="coin sm"></i>`;
}
setInterval(()=>{ if(!$('shopOv').hidden) updateAdCoinsBtn(); },1000);
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{ shopTab=t.dataset.tab; renderShop(); }));
$('shopOpen').addEventListener('click',()=>{ $('levelsOv').hidden=true; $('shopOv').hidden=false; $('shopOv').querySelector('.shopcard').scrollTop=0; renderShop(); });
$('shopBack').addEventListener('click',()=>{ clearFlyCoins(); $('shopOv').hidden=true; showLevels(true); });
$('adCoins').addEventListener('click',()=>{ if($('adCoins').disabled) return;
  watchAd(()=>{ const from=prog.coins; prog.coins+=AD_COINS; prog.adCoinsT=Date.now(); saveProg(); renderShop(); shopCoinsArrive(from); }); });
$('addCoins').addEventListener('click',e=>{ prog.coins+=1000; saveProg(); refreshCoins(); e.currentTarget.blur(); });
