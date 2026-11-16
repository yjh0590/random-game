/* ================= 공통 ================= */
const $ = id => document.getElementById(id);
let playerName = "○○";
const NPC_NAMES = ["취한 콤이", "안 취한 콤이", "만취 콤이"];
function rndOf(a){ return a[Math.floor(Math.random()*a.length)]; }
/* 사용자 입력을 innerHTML에 넣을 때는 꼭 esc()를 거친다 */
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
/* 굵은 선 캐릭터 (상반신). face: sober/tipsy/wasted, look: -1 왼쪽 · 0 정면 · 1 오른쪽을 본다 */
const FACES = {
  sober:  `<circle class="ink" cx="58" cy="44" r="4.5"/><circle class="ink" cx="82" cy="44" r="4.5"/>
           <path d="M60 58 Q70 66 80 58"/>`,
  tipsy:  `<ellipse class="blush" cx="50" cy="57" rx="8" ry="5"/><ellipse class="blush" cx="90" cy="57" rx="8" ry="5"/>
           <path d="M52 46 Q58 39 64 46"/><path d="M76 46 Q82 39 88 46"/>
           <path d="M60 61 Q65 56 70 61 Q75 66 80 61"/>`,
  wasted: `<ellipse class="blush" cx="49" cy="57" rx="10" ry="6"/><ellipse class="blush" cx="91" cy="57" rx="10" ry="6"/>
           <path d="M53 38 L63 48 M63 38 L53 48"/><path d="M77 38 L87 48 M87 38 L77 48"/>
           <path class="ink" d="M63 59 Q70 72 77 59 Q70 55 63 59 Z"/>`,
};
function doodleSVG(face = "sober", look = 0){
  return `<svg viewBox="0 0 140 150" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(${look*5} 70 150)">
      <path class="fillp" d="M26 152 Q24 104 48 90 Q70 80 92 90 Q116 104 114 152"/>
      <path class="fillp" d="M38 46 Q36 14 70 12 Q104 12 103 44 Q102 76 70 77 Q39 77 38 46 Z"/>
      <g transform="translate(${look*8} 0)">${FACES[face]}</g>
    </g>
  </svg>`;
}
/* 1인칭 시점의 "내 손" (술상 끝에 올려둔 두 손) */
function handsSVG(){
  return `<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
    <path class="fillp" d="M28 84 Q30 42 52 30 Q74 20 88 36 Q98 50 94 84"/>
    <path class="fillp" d="M88 42 Q102 34 107 45 Q109 56 94 59"/>
    <path class="fillp" d="M212 84 Q210 42 188 30 Q166 20 152 36 Q142 50 146 84"/>
    <path class="fillp" d="M152 42 Q138 34 133 45 Q131 56 146 59"/>
  </svg>`;
}
/* 자리: 0 = 나(손만 보임), 1 = 왼쪽, 2 = 맞은편, 3 = 오른쪽. 옆자리 콤이는 나를 쳐다본다 */
const SEAT_LOOK = [
  null,
  { face: "tipsy",  look:  1 },
  { face: "sober",  look:  0 },
  { face: "wasted", look: -1 },
];
function buildSeats(containerId){
  const names = [playerName, ...NPC_NAMES];
  const table = $(containerId);
  /* 내 앞의 술상 */
  table.innerHTML = `<div class="pov-deco"><span>🍶</span><span>🥃</span><span class="gap"></span><span>🥃</span><span>🍶</span></div>`;
  return names.map((name, idx) => {
    const seat = document.createElement("div");
    const look = SEAT_LOOK[idx];
    seat.className = `seat pos${idx}` + (idx===0 ? " me" : ` face-${look.face}`);
    seat.innerHTML = `<div class="bubble"></div>
      <div class="doodle">${idx===0 ? handsSVG() + `<span class="my-glass">🍺</span>` : doodleSVG(look.face, look.look)}</div>
      <div class="pname">${name}${idx===0?" (나)":""}</div>`;
    table.appendChild(seat);
    return { name, isHuman: idx===0, el: seat,
      bubble: seat.querySelector(".bubble"), doodle: seat.querySelector(".doodle") };
  });
}
/* 걸렸을 때: 부들부들. 나라면 손이 떨리고 화면도 흔들린다 */
function shakeSeat(p){
  p.doodle.classList.remove("shake"); void p.doodle.offsetWidth; p.doodle.classList.add("shake");
  if(p.isHuman){
    const sc = p.el.closest(".screen");
    if(sc){ sc.classList.remove("shaking"); void sc.offsetWidth; sc.classList.add("shaking"); }
  }
}
function bubbleSay(p, text, ms=900){
  p.bubble.textContent = text; p.bubble.classList.add("show");
  clearTimeout(p._bt); p._bt = setTimeout(() => p.bubble.classList.remove("show"), ms);
}
function hop(p){ p.doodle.classList.remove("beat-hop"); void p.doodle.offsetWidth; p.doodle.classList.add("beat-hop"); }
/* class="screen"인 화면 중 id 하나만 보이게. 화면을 추가해도 목록을 고칠 필요 없음 */
function showScreen(id){ document.querySelectorAll(".screen").forEach(s => s.classList.toggle("hidden", s.id !== id)); }
/* 등록된 모든 엔진을 멈춘다 (같은 엔진을 쓰는 게임이 여럿이어도 한 번씩) */
function stopAll(){ new Set(Object.values(ENGINE_OF)).forEach(e => e.stop()); }

/* ---- 오디오 ---- */
let AC = null;
/* 클릭 전에 만들어지면(소리 미리 준비할 때) 멈춘 상태라서, 부를 때마다 깨운다 */
function audio(){
  if(!AC) AC = new (window.AudioContext||window.webkitAudioContext)();
  if(AC.state === "suspended") AC.resume();
  return AC;
}
function click(type){
  try{
    const ctx = audio();
    const o = ctx.createOscillator(), g = ctx.createGain();
    const conf = { knee:[150,'sine',.09], clap:[650,'triangle',.06],
      thumb:[980,'triangle',.05], word:[1300,'square',.05], fail:[90,'sawtooth',.35] }[type];
    o.frequency.value = conf[0]; o.type = conf[1];
    g.gain.setValueAtTime(type==='word'?0.12:0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + conf[2]);
    o.connect(g).connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + conf[2]);
  }catch(e){}
}

/* ---- 랭킹 (localStorage에 저장, 실패하면 메모리만) ---- */
const REC_KEY = "random-game-rec";
const REC = (() => { try{ return JSON.parse(localStorage.getItem(REC_KEY)) || {}; }catch(e){ return {}; } })();   // { key: { val, label } }
function saveRec(key, val, labelFn){
  if(!REC[key] || val > REC[key].val){
    REC[key] = { val, label: labelFn(val) };
    try{ localStorage.setItem(REC_KEY, JSON.stringify(REC)); }catch(e){}
  }
}

/* ---- 엔진 공통 ---- */
/* 판 상태 정리: over 표시 → 루프·타이머 취소. 이미 예약된 콜백은 over를 보고 멈춘다 */
function haltState(S){
  if(!S) return;
  S.over = true;
  cancelAnimationFrame(S.raf); clearTimeout(S.timer);
  if(S.timers) S.timers.forEach(clearTimeout);
}
/* 걸렸을 때 공통 처리: 효과음·흔들기·기록 저장·"마셔~" 메시지·재시작 버튼
   html을 주면 기본 메시지 대신 그걸 쓰고, extra는 기록 줄 뒤에 붙는다 */
function showLose({ key, val, loser, msgId, restartId, why = "", html, drink = "마셔~ 마셔~ 🍺", extra = "" }){
  click('fail'); shakeSeat(loser);
  const g = gamesByKey[key];
  saveRec(key, val, g.recLabel);
  const head = html !== undefined ? html : `${why} <b class="drink">${loser.name}</b> ${drink}`;
  $(msgId).innerHTML = `${head}
    <span class="record-line">이번 판: ${g.recLabel(val)}${extra} · 최고 기록 ${REC[key].label}</span>`;
  $(restartId).classList.remove("hidden");
}

/* ================= ① 입장 → ② 구호 → ③ 메뉴 ================= */
$("start-btn").addEventListener("click", enter);
$("name-input").addEventListener("keydown", e => { if(e.key==="Enter") enter(); });
function enter(){
  audio();
  playerName = $("name-input").value.replace(/[<>&"']/g, "").trim() || "아무개";   // 이름은 여러 곳의 innerHTML에 들어가므로 HTML 특수문자 제거
  showScreen("chant-screen");
  const crowd = $("chant-crowd"); crowd.innerHTML = "";
  ["tipsy", "sober", "wasted", "sober"].forEach((face, i) => {
    const d = document.createElement("div");
    d.className = "doodle bounce";
    d.style.animationDuration = (60 / CHANT_BPM * 2) + "s";   // 구호 박자에 맞춰 들썩
    d.style.animationDelay = (i * 0.12) + "s";
    d.innerHTML = doodleSVG(face); crowd.appendChild(d);
  });
  const el = $("chant-text");
  playChant(playerName, text => {
    el.textContent = text;
    el.classList.remove("chant-pop"); void el.offsetWidth; el.classList.add("chant-pop");
  }, () => {
    if(!$("chant-screen").classList.contains("hidden")) showScreen("menu-screen");
  });
}
/* "← 메뉴" 버튼: 게임 화면은 나중에 addScreen으로 붙으므로 document에서 위임 처리 */
document.addEventListener("click", e => {
  if(!e.target.closest("[data-menu]")) return;
  stopAll(); showScreen("menu-screen"); $("slot-box").innerHTML = "&nbsp;";
});

/* ================= 게임 등록 =================
   각 게임 파일(js/games/*.js)이 registerGame(설정, 엔진)으로 자기를 등록한다.
   - 설정: key, emj, nm, tg, intro, rules, recLabel (메뉴·룰·랭킹에 쓰임)
   - 엔진: { start(key), stop() }
   GAMES 순서 = index.html에서 게임 파일을 불러오는 순서 = 메뉴에 보이는 순서 */
const GAMES = [], gamesByKey = {}, ENGINE_OF = {};
/* 게임·엔진 파일이 자기 화면 HTML을 붙인다. 파일 맨 위에서 불러야 아래 코드가 그 화면을 찾을 수 있다 */
function addScreen(html){ $("rule-modal").insertAdjacentHTML("beforebegin", html); }
function registerGame(meta, engine){
  if(gamesByKey[meta.key]) console.error(`[랜덤게임] 게임 key 중복: ${meta.key}`);
  GAMES.push(meta); gamesByKey[meta.key] = meta; ENGINE_OF[meta.key] = engine;
}

/* ================= 메뉴 동작 ================= */
let pendingGame = null;
function openRules(key){
  const g = gamesByKey[key];
  pendingGame = key;
  $("rule-title").innerHTML = `${g.emj} ${g.nm}`;
  $("rule-intro").textContent = `🎵 "${g.intro}"`;
  $("rule-list").innerHTML = g.rules.map(l => `<li>${l}</li>`).join("");
  $("rule-start").style.display = "inline-block";
  $("rule-modal").classList.remove("hidden");
}
$("rule-x").addEventListener("click", () => { $("rule-modal").classList.add("hidden"); pendingGame = null; });
$("rule-start").addEventListener("click", () => {
  $("rule-modal").classList.add("hidden");
  const k = pendingGame; pendingGame = null;
  if(k) launchGame(k);
});
function launchGame(k){
  stopAll();
  ENGINE_OF[k].start(k);
}
/* 랜덤게임 시작: 슬롯 연출 후 룰 모달 → 시작 */
$("menu-random").addEventListener("click", () => {
  const btn = $("menu-random");
  if(btn.disabled) return;
  btn.disabled = true;
  let step = 0, total = 12 + Math.floor(Math.random()*8), delay = 70;
  let i = Math.floor(Math.random()*GAMES.length);
  (function spin(){
    const g = GAMES[i % GAMES.length];
    $("slot-box").textContent = `${g.emj} ${g.nm}`;
    click('thumb');
    step++;
    if(step < total){ i++; delay *= 1.14; setTimeout(spin, delay); }
    else {
      click('word');
      $("slot-box").textContent = `👉 ${g.emj} ${g.nm}!`;
      setTimeout(() => { btn.disabled = false; openRules(g.key); }, 500);
    }
  })();
});
/* 게임 설명 목록 */
$("menu-explain").addEventListener("click", () => { renderExplain(); showScreen("explain-screen"); });
function renderExplain(){
  const list = $("explain-list"); list.innerHTML = "";
  GAMES.forEach(g => {
    const b = document.createElement("button");
    b.innerHTML = `<span>${g.emj} ${g.nm}</span><span class="tg">${g.tg}</span>`;
    b.addEventListener("click", () => openRules(g.key));
    list.appendChild(b);
  });
}
/* 게임 골라서 하기 = 설명 목록 재활용 */
$("menu-pick").addEventListener("click", () => { renderExplain(); showScreen("explain-screen"); });
/* 랭킹 */
$("menu-rank").addEventListener("click", () => {
  const t = $("rank-table");
  t.innerHTML = GAMES.map(g => {
    const r = REC[g.key];
    return `<tr><td>${g.emj} ${g.nm}</td><td>${r ? r.label : "—"}</td></tr>`;
  }).join("");
  showScreen("rank-screen");
});
