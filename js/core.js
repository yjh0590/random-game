/* ================= 공통 ================= */
const $ = id => document.getElementById(id);
let playerName = "○○";
const NPC_NAMES = ["취한 콤이", "안 취한 콤이", "만취 콤이"];
function rndOf(a){ return a[Math.floor(Math.random()*a.length)]; }
/* 사용자 입력을 innerHTML에 넣을 때는 꼭 esc()를 거친다 */
function esc(s){ return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function doodleSVG(){
  return `<svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg">
    <path d="M45 28 Q42 12 60 8 Q80 5 86 18 Q90 30 78 36 Q62 42 50 36 Q45 33 45 28 Z"/>
    <path d="M46 42 Q30 50 26 72 Q22 92 32 96 Q38 98 42 92 Q40 104 48 112 Q54 118 58 110 Q60 104 59 96 Q62 104 66 112 Q72 120 78 112 Q82 105 78 94 Q84 100 90 94 Q98 86 92 66 Q86 48 72 42 Q58 37 46 42 Z"/>
  </svg>`;
}
function buildSeats(containerId){
  const names = [playerName, ...NPC_NAMES];
  const table = $(containerId);
  /* 원탁 + 술상 데코 (내 시점 테이블!) */
  table.innerHTML = `<div class="pov-deco"><span>🍶</span><span>🥃</span><span>🍺</span><span>🥃</span><span>🍶</span></div>`;
  return names.map((name, idx) => {
    const seat = document.createElement("div");
    seat.className = `seat pos${idx}` + (idx===0 ? " me" : "");
    seat.innerHTML = `<div class="bubble"></div><div class="doodle">${doodleSVG()}</div>
      <div class="pname">${name}${idx===0?" (나)":""}</div>`;
    table.appendChild(seat);
    /* 게임에 들어가면 "나"는 페이드아웃 → 1인칭 시점 전환! (이름표는 남음) */
    if(idx === 0) setTimeout(() => { if(seat.isConnected) seat.classList.add("faded"); }, 900);
    return { name, isHuman: idx===0, el: seat,
      bubble: seat.querySelector(".bubble"), doodle: seat.querySelector(".doodle") };
  });
}
/* 걸렸을 때: 내 캐릭터라면 다시 페이드인 되면서 부들부들 + 화면 흔들림 */
function shakeSeat(p){
  p.el.classList.remove("faded");
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
function audio(){ if(!AC) AC = new (window.AudioContext||window.webkitAudioContext)(); return AC; }
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
  for(let i=0;i<4;i++){
    const d = document.createElement("div");
    d.className = "doodle bounce"; d.style.animationDelay = (i*0.12)+"s";
    d.innerHTML = doodleSVG(); crowd.appendChild(d);
  }
  const lines = [`${playerName}이(가)~`, `좋아하는~`, `랜덤게임!`, `랜덤게임! 🎉`];
  const el = $("chant-text"); let i = 0;
  (function next(){
    if(i < lines.length){
      el.textContent = lines[i++];
      el.classList.remove("chant-pop"); void el.offsetWidth; el.classList.add("chant-pop");
      click(i%2 ? 'clap':'thumb');
      setTimeout(next, 800);
    } else setTimeout(() => showScreen("menu-screen"), 500);
  })();
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
let pendingGame = null, ruleStartable = true;
function openRules(key, startable=true){
  const g = gamesByKey[key];
  pendingGame = key; ruleStartable = startable;
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
    b.addEventListener("click", () => openRules(g.key, true));
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
