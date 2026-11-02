// Chute Rhythm automated checks.
// Run:  npm test          (all checks, ~1-3 min)
//       npm test -- quick (skips the 50-level perfect run)
// Uses Playwright with a fake clock, so the game runs much faster than real time.
// The game exposes a read-only test hook: window.__chute (state, current, tap, ground, playLevel, sfx).
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const URL = pathToFileURL(path.join(ROOT, 'index.html')).href;
const QUICK = process.argv.includes('quick');
const SEEN = ['radar', 'steam', 'lift', 'clouds', 'faulty'];   // skip feature intro cards during tests

// Perfect bot: taps the current diver when it is in the lower half of its green band.
// missIdx: human-diver indexes to tap EARLY on purpose (costs a life). tapAll: tap every diver early (radar test).
const BOT = `window.__bot=(missIdx,mode)=>{ missIdx=missIdx||[]; if(window.__bi) clearInterval(window.__bi);
  window.__bi=setInterval(()=>{ const S=__chute.state(); if(!S) return; const d=__chute.current(); if(!d||d.state!=='fall') return;
    if(mode==='none') return;
    if(mode==='early'){ if(S.t-d.tDrop>0.45) __chute.tap(); return; }
    const h=__chute.ground(d)-d.y, hi=S.divers.filter(x=>!x.dummy).indexOf(d);
    if(missIdx.includes(hi)){ if(h<d.dmin+0.2&&h>d.dmin+0.12) __chute.tap(); return; }
    if(h<=d.dmin+d.band*0.5&&h>=d.dmin) __chute.tap(); },4); }; 0;`;

let failures = 0, passes = 0;
const ok = (cond, name, extra = '') => { if (cond) { passes++; console.log('  ✓ ' + name); } else { failures++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); } };

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});

async function open(prog) {
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.clock.install();
  await page.addInitScript(p => { if (!sessionStorage.getItem('t')) { sessionStorage.setItem('t', '1'); localStorage.setItem('chuteRhythm.v5.progress', p); } },
    JSON.stringify(Object.assign({ best: [], trained: true, seen: SEEN }, prog)));
  await page.goto(URL);
  await page.clock.runFor(800);
  await page.evaluate(BOT);
  return { page, errors };
}
const endShown = page => page.evaluate(() => !document.getElementById('endOv').hidden);
async function playUntilEnd(page, n, bot = '[]', mode = '') {
  await page.evaluate(`__bot(${bot},${JSON.stringify(mode)}); __chute.playLevel(${n})`);
  for (let i = 0; i < 120 && !(await endShown(page)); i++) await page.clock.runFor(1000);
  return endShown(page);
}
const progOf = page => page.evaluate(() => JSON.parse(localStorage.getItem('chuteRhythm.v5.progress')));
const tiles = page => page.evaluate(() => [...document.querySelectorAll('#strip .tile')].map(t => t.className.split(' ')[1]));
const vis = (page, id) => page.evaluate(i => { const e = document.getElementById(i); return !!e && !e.hidden; }, id);
const text = (page, id) => page.evaluate(i => document.getElementById(i).textContent, id);
const count = (arr, v) => arr.filter(x => x === v).length;

// ---------- 1. every level can be cleared all-perfect (bands never overlap) ----------
if (!QUICK) {
  console.log('All 50 levels, perfect bot:');
  const { page, errors } = await open({ stars: [], unlockAll: true });
  const bad = [];
  const total = await page.evaluate(() => document.querySelectorAll('.lv').length ? 50 : 50);
  for (let n = 0; n < total; n++) {
    const done = await playUntilEnd(page, n);
    const t = await tiles(page);
    if (!done || count(t, 'perfect') !== t.length) bad.push(`${Math.floor(n / 10) + 1}-${n % 10 + 1} (${count(t, 'perfect')}/${t.length})`);
    await page.click('#lvBtn');
  }
  ok(bad.length === 0, 'all 50 levels cleared with every landing perfect', bad.join(', '));
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3).join(' | '));
  await page.close();
}

console.log('Result screen and rules:');
// ---------- 2. fail by not tapping: exactly 3 lives shown, rest grey ----------
{
  const { page, errors } = await open({ stars: [3, 3] });
  await playUntilEnd(page, 2, '[]', 'none'); await page.clock.runFor(900);
  const t = await tiles(page);
  ok(count(t, 'miss') === 3 && count(t, 'none') === t.length - 3, 'fail strip shows exactly 3 💔, the rest grey', t.join(','));
  ok(await vis(page, 'rFail'), '"LEVEL FAILED" title shown');
  ok(!(await vis(page, 'nextBtn')), 'no Next button on a fail');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}
// ---------- 3. one miss: 2 stars, one 💔, coins + reward text ----------
{
  const { page, errors } = await open({ stars: [] });
  await playUntilEnd(page, 0, '[2]'); await page.clock.runFor(2500);
  const t = await tiles(page), p = await progOf(page);
  ok(p.stars[0] === 2, '1 miss → 2 stars saved', 'stars ' + p.stars[0]);
  ok(count(t, 'miss') === 1 && count(t, 'perfect') === t.length - 1, 'strip: one 💔, rest perfect chutes', t.join(','));
  ok(!(await vis(page, 'rFail')), 'no fail title on a pass');
  ok((await page.evaluate(() => document.getElementById('rTrack').textContent)).includes('Unlocks at Level 1-5'), 'reward track says "Unlocks at Level 1-5"');
  ok(await vis(page, 'nextBtn'), 'Next level button shown');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}
// ---------- 4. all perfect: ALL PERFECT! + few sounds; skipping early keeps progress ----------
{
  const { page, errors } = await open({ stars: [] });
  await playUntilEnd(page, 0);
  const before = await page.evaluate(() => __chute.sfx.played());
  await page.clock.runFor(4500);
  const tones = (await page.evaluate(() => __chute.sfx.played())) - before;
  ok(await page.evaluate(() => !!document.querySelector('.allperf')), 'ALL PERFECT! appears');
  ok(tones <= 14, 'result screen plays ≤ 14 tones (stars + one chord)', tones + ' tones');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}
{
  const { page } = await open({ stars: [] });
  await playUntilEnd(page, 0);
  await page.clock.runFor(250);
  const coins = (await progOf(page)).coins;
  await page.click('#nextBtn'); await page.clock.runFor(3000);
  ok(coins === 80, 'progress saved the moment the result opens (80 coins)', 'coins ' + coins);
  ok(!(await page.evaluate(() => !!document.querySelector('.allperf'))), 'leaving early cancels ALL PERFECT!');
  await page.close();
}
// ---------- 5. world end: this run opens World 2 → unlock animation, then World 2 ▶ ----------
{
  const { page, errors } = await open({ stars: [3, 3, 3, 3, 3, 3, 3, 1, 0, 0] });
  await playUntilEnd(page, 9); await page.clock.runFor(600);
  ok((await progOf(page)).stars[9] === 3, 'stars saved before the animation');
  ok(await vis(page, 'rWorld') && !(await vis(page, 'nextBtn')), 'world row shown locked first, button not yet');
  await page.keyboard.press('Space').catch(() => {});
  await page.clock.runFor(100);
  ok(await page.evaluate(() => __chute.state() && __chute.state().level === 10), 'Space during the unlock animation starts World 2');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}
{
  const { page } = await open({ stars: [3, 3, 3, 3, 3, 3, 3, 1, 0, 0] });
  await playUntilEnd(page, 9); await page.clock.runFor(5000);
  ok(await vis(page, 'nextBtn') && (await text(page, 'nextBtn')).includes('World 2'), '"World 2 ▶" appears after the animation');
  ok((await page.evaluate(() => document.getElementById('rWorld').textContent)).includes('Unlocked'), 'world row shows Unlocked!');
  await page.close();
}
// ---------- 6. world end at 20-24★: gate ad opens World 2 ----------
{
  const { page, errors } = await open({ stars: [3, 3, 3, 3, 3, 2, 1, 1, 1, 0] });
  await playUntilEnd(page, 9); await page.clock.runFor(2500);
  ok(await vis(page, 'rGate'), '"▶ Unlock now" offered at 23★');
  await page.click('#rGate'); await page.clock.runFor(3200);
  ok((await progOf(page)).gate[1] === 1, 'gate ad unlock saved');
  ok(await vis(page, 'nextBtn'), '"World 2 ▶" shown after the ad');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}
// ---------- 7. world end below 20★: locked, no ad ----------
{
  const { page } = await open({ stars: [3, 3, 3, 2, 1, 1, 1, 1, 1, 0] });
  await playUntilEnd(page, 9); await page.clock.runFor(2500);
  ok(await vis(page, 'rWorld') && !(await vis(page, 'rGate')) && !(await vis(page, 'nextBtn')), 'locked row, no ad, no next button at 19★');
  await page.close();
}
// ---------- 8. caught by radar ----------
{
  const { page, errors } = await open({ stars: [3, 3, 3, 3] });
  await playUntilEnd(page, 4, '[]', 'early'); await page.clock.runFor(800);
  const t = await tiles(page);
  ok(await vis(page, 'rFail') && count(t, 'miss') === 1, 'caught → fail screen, the caught diver shows 💔', t.join(','));
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}
// ---------- 9. level grid: earned stars only ----------
{
  const { page } = await open({ stars: [3, 1, 2] });
  const smalls = await page.evaluate(() => [...document.querySelectorAll('.lv small')].slice(0, 4).map(s => s.textContent));
  ok(smalls[0] === '★★★' && smalls[1] === '★' && smalls[2] === '★★' && smalls[3] === '', 'grid shows earned stars only', JSON.stringify(smalls));
  await page.close();
}

// ---------- 10. training finish: graduation card with tiles and buttons ----------
{
  const trainBot = n => `(()=>{ let tapped=0; setInterval(()=>{ const S=__chute.state(); if(!S) return; const d=__chute.current(); if(!d||d.state!=='fall'||tapped>=${n}) return;
    const h=__chute.ground(d)-d.y; if(h<=d.dmin+d.band*0.95&&h>=d.dmin){ const a=d.opened; __chute.tap(); if(!a&&d.opened) tapped++; } },4); __chute.playTraining('level1'); })(); 0;`;
  const graduate = async n => {
    const { page, errors } = await open({ stars: [] });
    await page.evaluate(trainBot(n));
    for (let i = 0; i < 60 && !(await vis(page, 'gradOv')); i++) await page.clock.runFor(1000);
    await page.clock.runFor(500);
    return { page, errors };
  };
  const a = await graduate(6);
  ok(await vis(a.page, 'gradOv'), 'training finish opens the graduation card');
  ok(await a.page.evaluate(() => document.querySelectorAll('#gradStrip .tile.perfect svg').length) === 6, 'all perfect: 6 chute tiles on the card');
  ok((await text(a.page, 'gradStamp')) === 'READY!', 'all perfect: READY!');
  ok((await progOf(a.page)).coins === 100, '+100 starter coins saved');
  await a.page.click('#gradActs .btn'); await a.page.clock.runFor(300);
  ok(await vis(a.page, 'levelsOv'), 'Start goes to the level screen');
  ok(a.errors.length === 0, 'no page errors', a.errors.join(' | '));
  await a.page.close();
  const b = await graduate(1);
  const bt = await b.page.evaluate(() => [...document.querySelectorAll('#gradStrip .tile')].map(t => t.textContent));
  ok((await text(b.page, 'gradStamp')) === 'ALMOST!', '1 perfect: ALMOST!');
  ok(count(bt, '💔') === 5, '1 perfect: 5 💔 on the card', bt.join(','));
  ok(await b.page.evaluate(() => document.querySelectorAll('#gradActs .btn').length) === 2, '1 perfect: Practice again + Start');
  ok(b.errors.length === 0, 'no page errors', b.errors.join(' | '));
  await b.page.close();
}
// ---------- 11. sandbox result screen ----------
{
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = []; page.on('pageerror', e => errors.push(String(e)));
  await page.clock.install();
  await page.addInitScript(() => { localStorage.setItem('chuteRhythm.v3.settings', JSON.stringify({ mode: 'sandbox' })); localStorage.setItem('chuteRhythm.v5.progress', JSON.stringify({ stars: [], best: [], trained: true, seen: [] })); });
  await page.goto(URL); await page.clock.runFor(800);
  await page.click('#startBtn');
  for (let i = 0; i < 120 && !(await endShown(page)); i++) await page.clock.runFor(1000).catch(e => errors.push(String(e)));
  ok(await endShown(page), 'sandbox: result screen opens');
  ok(!(await page.evaluate(() => document.getElementById('strip').textContent.includes('undefined'))), 'sandbox: tiles have icons');
  ok(errors.length === 0, 'no page errors', errors.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n${passes} passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
