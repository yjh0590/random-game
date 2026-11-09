/* ---- 화면: 리듬 (딸기/과일/리버스/고래 공용) ---- */
addScreen(/*html*/ `
<div id="rhythm-screen" class="screen hidden">
  <button class="btn-small back-corner" data-menu>← 메뉴</button>
  <div id="r-title"></div>
  <div id="r-round">&nbsp;</div>
  <div id="lyric">&nbsp;</div>
  <div id="beat-row"></div>
  <div style="height:14px;"></div>
  <div id="table-r" class="seat-table"></div>
  <div id="r-msg" class="msg"></div>
  <button id="tap-btn" disabled>외쳐!</button>
  <div class="btn-row">
    <button id="r-restart" class="hidden btn-green">다시 하기</button>
  </div>
</div>
`);

/* ================= 리듬 엔진 (4↔8박자 전환) ================= */
/* 리듬 게임은 js/games/에서 registerRhythmGame(설정, 리듬설정)으로 등록한다.
   리듬설정: { title, bpm, tap, word(i), pat(n), intro[16] } */
const RGAMES = {};
const RHYTHM_ENGINE = { start: k => startRhythm(k), stop: () => stopRhythm() };
function registerRhythmGame(meta, cfg){ RGAMES[meta.key] = cfg; registerGame(meta, RHYTHM_ENGINE); }
const BODY = ["🦵","👏","👍","👍"];
/* 1~4개: 4박자에서 ④박부터 역순 / 5~8개: 8박자 확장(앞4박 꽉 + ⑧박부터 역순) */
function patStd(n){
  if(n <= 4){ const a = Array(4).fill(0); for(let b=4-n;b<4;b++) a[b]=1; return a; }
  const a = Array(8).fill(0);
  for(let b=0;b<4;b++) a[b]=1;
  for(let b=8-(n-4);b<8;b++) a[b]=1;
  return a;
}
function nSeq(k){ const i = k % 14; return i < 8 ? i+1 : 15-i; }   // 1→8→1 왕복

let R = null;
function startRhythm(gameKey){
  showScreen("rhythm-screen");
  const cfg = RGAMES[gameKey];
  $("r-title").textContent = cfg.title;
  $("tap-btn").textContent = cfg.tap;
  $("r-restart").classList.add("hidden");
  $("r-msg").textContent = "";
  R = { key: gameKey, cfg,
    baseIv: 60000 / cfg.bpm, iv: 60000 / cfg.bpm, speed: 1,
    seats: buildSeats("table-r"), startSeat: 0,
    gb: -4, nextT: 0, countIn: 4,
    introBeats: 16, turnIdx: -1, turnStartGb: 16, curBeats: 4,
    events: [], failed: false, raf: 0 };
  buildBeatRow(8);
  $("r-round").innerHTML = "준비~ 🥁";
  $("lyric").innerHTML = "&nbsp;";
  $("tap-btn").disabled = false;
  R.nextT = performance.now() + 600;
  R.raf = requestAnimationFrame(rLoop);
}
function stopRhythm(){ haltState(R); R = null; }
function buildBeatRow(beats){
  const row = $("beat-row"); row.innerHTML = "";
  for(let b=0;b<beats;b++){
    const d = document.createElement("div");
    d.className = "beat-dot";
    d.innerHTML = `${b+1}<span class="body-icon">${BODY[b%4]}</span>`;
    row.appendChild(d);
  }
}
function rLoop(now){
  if(!R) return;
  while(!R.failed && now >= R.nextT){
    const st = R.nextT;
    fireBeat(R.gb, st);
    if(!R || R.failed) return;
    R.gb++;
    R.nextT = st + R.iv;
  }
  if(!R.failed && R.curTurn && R.curTurn.isHuman){
    for(const ev of R.events){
      if(!ev.done && !ev.missed && now > ev.t + R.iv*0.55){
        ev.missed = true; markDot(ev.beat, "oops");
        return failRhythm(R.seats[0], "박자를 놓쳤어!");
      }
    }
  }
  R.raf = requestAnimationFrame(rLoop);
}
function fireBeat(gb, st){
  if(gb < 0){
    click(gb % 2 === 0 ? 'knee' : 'clap');
    $("lyric").textContent = ["쿵","짝","따","따"][(gb + R.countIn) % 4] || "";
    return;
  }
  /* 인트로 */
  if(gb < R.introBeats){
    const local = gb % 8;
    click(local % 4 === 0 ? 'knee' : local % 4 === 1 ? 'clap' : 'thumb');
    pulseDot(local);
    $("r-round").innerHTML = "다 같이~ 🎵";
    $("lyric").textContent = R.cfg.intro[gb] === "·" ? "" : R.cfg.intro[gb];
    R.seats.forEach(hop);
    return;
  }
  /* 턴: 가변 길이 (4 또는 8박자) */
  if(gb >= R.turnStartGb + R.curBeats || R.turnIdx < 0){
    setupTurn(R.turnIdx + 1, st, gb);
  }
  const local = gb - R.turnStartGb;
  click(local % 4 === 0 ? 'knee' : local % 4 === 1 ? 'clap' : 'thumb');
  pulseDot(local);
  const evs = R.events.filter(e => e.beat === local);
  if(R.curTurn && !R.curTurn.isHuman){
    for(const ev of evs){
      bubbleSay(R.curTurn, ev.words.join(""), R.iv*0.9);
      click('word'); if(ev.need===2) setTimeout(()=>click('word'), R.iv*0.28);
      markDot(ev.beat, "hit");
      ev.done = true;
    }
    if(evs.length) hop(R.curTurn);
  }
}
function setupTurn(turnIdx, st, gb){
  R.turnIdx = turnIdx;
  R.turnStartGb = gb;
  R.speed = Math.min(2.0, 1 + 0.06 * turnIdx);   // 턴당 6% 가속, 최대 2배
  R.iv = R.baseIv / R.speed;
  const n = nSeq(turnIdx);
  const pat = R.cfg.pat(n);
  if(pat.length !== R.curBeats){ R.curBeats = pat.length; buildBeatRow(R.curBeats); }
  const seatIdx = (R.startSeat + turnIdx) % R.seats.length;
  R.curTurn = R.seats[seatIdx];
  R.seats.forEach((s,i) => s.el.classList.toggle("turn", i === seatIdx));
  let wi = 0;
  R.events = [];
  pat.forEach((need, b) => {
    if(need > 0){
      const words = [];
      for(let c=0;c<need;c++) words.push(R.cfg.word(wi++));
      R.events.push({ beat:b, need, got:0, words, done:false, missed:false, t: st + b * R.iv });
    }
  });
  const spd = R.speed > 1.02 ? ` <span class="who">⚡x${R.speed.toFixed(2)}</span>` : "";
  $("r-round").innerHTML = `${n}개!${spd} <span class="who">— ${R.curTurn.name}${R.curTurn.isHuman?" (너!)":""}</span>`;
  $("lyric").innerHTML = "&nbsp;";
  document.querySelectorAll(".beat-dot").forEach((d,b) => {
    d.classList.remove("req","req2","hit","oops");
    const ev = R.events.find(e => e.beat === b);
    if(ev) d.classList.add(ev.need === 2 ? "req2" : "req");
  });
}
function pulseDot(local){
  document.querySelectorAll(".beat-dot").forEach((d,b) => d.classList.toggle("now", b === local));
}
function markDot(beat, cls){
  const d = document.querySelectorAll(".beat-dot")[beat];
  if(d) d.classList.add(cls);
}
function playerTap(){
  if(!R || R.failed) return;
  if(!R.curTurn) return;
  if(!R.curTurn.isHuman){
    click('fail');
    bubbleSay(R.seats[0], "앗...!", 1500);
    return failRhythm(R.seats[0], "",
      `남의 차례에 손이 나갔다! <b class="drink">병x샷 병x샷 병x샷은 두잔~</b> 🍺🍺`);
  }
  const now = performance.now();
  let best = null, bestDist = Infinity;
  for(const ev of R.events){
    if(ev.done || ev.missed) continue;
    const d = Math.abs(now - ev.t);
    if(d < bestDist){ bestDist = d; best = ev; }
  }
  if(!best || bestDist > R.iv * 0.5){
    click('fail');
    return failRhythm(R.seats[0], "박자에 없는 외침! 🫢");
  }
  best.got++;
  const word = best.words[Math.min(best.got, best.words.length) - 1];
  bubbleSay(R.seats[0], best.words.slice(0, best.got).join(""), R.iv*0.9);
  click('word');
  $("lyric").textContent = word;
  hop(R.seats[0]);
  if(best.got >= best.need){ best.done = true; markDot(best.beat, "hit"); }
}
$("tap-btn").addEventListener("pointerdown", e => { e.preventDefault(); playerTap(); });
document.addEventListener("keydown", e => {
  if((e.code === "Space" || e.code === "Enter") && R && !$("rhythm-screen").classList.contains("hidden")){
    e.preventDefault(); playerTap();
  }
});
function failRhythm(p, why, customHtml){
  if(!R || R.failed) return;
  R.failed = true;
  cancelAnimationFrame(R.raf);
  $("tap-btn").disabled = true;
  showLose({ key: R.key, val: Math.max(0, R.turnIdx), loser: p, msgId: "r-msg", restartId: "r-restart",
    why, html: customHtml, extra: ` · 최고 ⚡x${R.speed.toFixed(2)}` });
}
$("r-restart").addEventListener("click", () => { const k = R ? R.key : null; stopRhythm(); if(k) startRhythm(k); });
