// ---------- sound (synthesized with Web Audio, no files) ----------
const SFX=(()=>{
  let ac=null, master=null, noiseBuf=null, on=settings.sound!=='off', drone=null;
  let pend=[], askT=0, played=0, live=[];   // live: one-shot sound nodes still playing (not the drone)
  const track=n=>{ live.push(n); n.onended=()=>{ const i=live.indexOf(n); if(i>=0) live.splice(i,1); }; };   // sounds asked for while the audio is still waking up, and when we first asked
  function build(){
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return null;
    ac=new C(); master=ac.createGain(); master.gain.value=on?0.55:0; master.connect(ac.destination);
    noiseBuf=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
    const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
    drone=null; return ac;
  }
  // Any state other than 'running' (suspended, or iOS 'interrupted' after a phone lock) gets resumed.
  function ensure(){
    if(!ac||ac.state==='closed'){ if(!build()) return null; }
    if(ac.state!=='running'){
      if(!askT) askT=performance.now();
      try{ const p=ac.resume(); if(p&&p.then) p.then(()=>{ if(ac.state==='running'){ askT=0; flush(); } }).catch(()=>{}); }catch(e){}
    } else askT=0;
    return ac;
  }
  function flush(){ const now=performance.now(), q=pend; pend=[]; for(const [t,fn] of q) if(now-t<150) fn(); }
  function later(fn){ pend.push([performance.now(),fn]); if(pend.length>24) pend.shift(); }   // play when awake; drop if >150 ms late
  function tone(type,f0,f1,dur,vol,delay=0){
    if(!on||!ensure()) return;
    if(ac.state!=='running'){ later(()=>tone(type,f0,f1,dur,vol,delay)); return; }
    played++;
    const t=ac.currentTime+delay, o=ac.createOscillator(), g=ac.createGain();
    o.type=type; o.frequency.setValueAtTime(f0,t); if(f1!==f0) o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.02); track(o);
  }
  function noise(dur,vol,ftype,f0,f1,q=1,delay=0){
    if(!on||!ensure()) return;
    if(ac.state!=='running'){ later(()=>noise(dur,vol,ftype,f0,f1,q,delay)); return; }
    const t=ac.currentTime+delay, src=ac.createBufferSource(), f=ac.createBiquadFilter(), g=ac.createGain();
    src.buffer=noiseBuf; f.type=ftype; f.Q.value=q; f.frequency.setValueAtTime(f0,t); if(f1!==f0) f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(f); f.connect(g); g.connect(master); src.start(t,Math.random()*0.5); src.stop(t+dur+0.02); track(src);
  }
  const PENTA=[0,2,4,7,9,12,14,16,19,21,24];
  return {
    // Called on every tap/key (a user gesture, which iOS needs to restart audio). If an earlier resume never
    // worked (or the context was closed), rebuild the audio from scratch inside this gesture.
    unlock(gesture=true){ if(!on) return;
      if(gesture&&ac&&ac.state!=='running'&&askT&&performance.now()-askT>400){ try{ac.close()}catch(e){} ac=null; askT=0; ensure(); if(running) this.droneStart(); return; }
      ensure(); },
    cutAll(){ pend=[]; const t=ac?ac.currentTime:0; for(const n of live){ try{ n.onended=null; n.stop(t); }catch(e){} } live=[]; },
    debug:{live:()=>live.length,state:()=>ac&&ac.state, suspend:()=>ac&&ac.suspend(), played:()=>played, pending:()=>pend.length},
    set(v){on=v; if(ac){master.gain.cancelScheduledValues(ac.currentTime);master.gain.setTargetAtTime(v?0.55:0,ac.currentTime,0.02)}
      if(!v) this.droneStop(); else if(running) this.droneStart(); },
    droneStart(){ if(!on||!ensure()||drone) return;
      const o=ac.createOscillator(), o2=ac.createOscillator(), f=ac.createBiquadFilter(), g=ac.createGain();
      o.type='sawtooth'; o.frequency.value=58; o2.type='sawtooth'; o2.frequency.value=58.7;
      f.type='lowpass'; f.frequency.value=260; g.gain.value=0.0001; g.gain.setTargetAtTime(0.035,ac.currentTime,0.3);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(master); o.start(); o2.start(); drone={o,o2,g}; },
    droneStop(){ if(!drone||!ac) return; const d=drone; drone=null;
      d.g.gain.setTargetAtTime(0.0001,ac.currentTime,0.25); d.o.stop(ac.currentTime+1.2); d.o2.stop(ac.currentTime+1.2); },
    drop(){ noise(0.35,0.10,'bandpass',900,2400,0.8) },
    chute(){ noise(0.16,0.32,'lowpass',2200,300,0.7); tone('sine',140,70,0.18,0.35) },
    pop(){ noise(0.12,0.4,'highpass',1800,600,0.8); tone('square',900,180,0.14,0.08); tone('triangle',520,200,0.22,0.12,0.03) },
    rate(r,streak){
      if(r==='perfect'){ const n=PENTA[Math.min(PENTA.length-1,Math.max(0,streak-1))], f=660*Math.pow(2,n/12);
        tone('triangle',f,f,0.22,0.22); tone('sine',f*2,f*2,0.16,0.08,0.02); }
      else if(r==='good') tone('triangle',520,520,0.14,0.13);
      else if(r==='early') tone('sine',330,300,0.12,0.10);
      else if(r==='late') tone('square',300,240,0.10,0.06);
    },
    land(heavy){ tone('sine',heavy?90:120,heavy?45:60,0.14,heavy?0.35:0.25); noise(0.08,0.08,'lowpass',600,200) },
    crash(){ tone('sine',150,45,0.3,0.45); noise(0.22,0.35,'lowpass',1400,140,1); tone('triangle',300,160,0.12,0.1,0.09);
      noise(0.35,0.12,'bandpass',700,300,1.5,0.32) },   // thud, bounce, canopy flump
    oof(){ tone('sine',95,45,0.2,0.4); noise(0.12,0.14,'lowpass',500,150); tone('triangle',420,260,0.22,0.12,0.04) },
    splat(){ noise(0.32,0.5,'lowpass',1800,120,1.2); tone('sine',180,38,0.35,0.5); tone('square',600,120,0.18,0.05,0.03) },
    clonk(){ tone('square',820,780,0.09,0.09); tone('triangle',1240,1180,0.14,0.08,0.01); noise(0.05,0.12,'highpass',3000,3000) },
    heart(){ tone('triangle',392,196,0.28,0.16); tone('sine',196,98,0.3,0.12,0.06) },
    zap(){ tone('square',1500,260,0.14,0.07); noise(0.1,0.22,'highpass',3500,1500,0.7) },
    boom(){ noise(0.7,0.55,'lowpass',1600,90,0.9); tone('sine',110,32,0.6,0.5); tone('triangle',220,60,0.3,0.15,0.02) },
    whistle(dur=1.4){ tone('sine',1500,260,dur,0.08); tone('sine',1505,262,dur,0.04,0.01) },
    sputter(){ for(let i=0;i<6;i++) noise(0.07,0.16,'bandpass',260,180,2,i*0.11) },
    wahwah(delay=0){ [[392,370],[370,349],[349,330]].forEach(([a,b],i)=>tone('triangle',a,b,0.3,0.12,delay+i*0.32)); tone('triangle',330,300,0.8,0.12,delay+0.96) },
    siren(){ for(let i=0;i<2;i++){ tone('sawtooth',620,880,0.16,0.045,i*0.32); tone('sawtooth',880,620,0.16,0.045,i*0.32+0.16) } },
    humans(){ tone('triangle',523,523,0.1,0.14); tone('triangle',784,784,0.18,0.14,0.09) },
    end(best){ const seq=best?[523,659,784,1047]:[523,659,784];
      seq.forEach((f,i)=>tone('triangle',f,f,best&&i===seq.length-1?0.4:0.16,0.16,i*0.1)); },
    // result screen (v6.7): the star chimes ARE the win jingle (C, E, G; no high octave on top)
    star(i){ const f=[523,659,784][Math.max(0,Math.min(2,i))]; tone('triangle',f,f,0.26,0.17); tone('sine',f*1.5,f*1.5,0.18,0.03,0.01); },
    // ALL PERFECT!: one warm chord in the middle register, instead of a climb to a shrill note
    chord(){ for(const [f,v] of [[262,0.10],[392,0.09],[523,0.09],[659,0.07]]){ tone('triangle',f,f,1.1,v); tone('sine',f*1.003,f*1.003,1.1,v*0.4,0.02); } },
    // a level is lost: short falling "wah-wah", nothing like the win sounds
    fail(){ [[311,294],[294,277],[277,233]].forEach(([a,b],i)=>tone('triangle',a,b,i===2?0.6:0.24,0.15,i*0.26)); tone('sine',117,98,0.6,0.12,0.52); },
    // world unlocked on the result screen
    worldOpen(){ [392,523,659,784].forEach((f,i)=>tone('triangle',f,f,i===3?0.5:0.14,0.13,i*0.09)); }
  };
})();
