/* ---- 화면: 범용 게임 화면 (GX 엔진 공용) ---- */
addScreen(/*html*/ `
<div id="generic-screen" class="screen hidden">
  <button class="btn-small back-corner" data-menu>← 메뉴</button>
  <div id="gx-title" style="font-size:28px;font-weight:700;"></div>
  <div id="gx-center" class="big-center"></div>
  <div class="timer-wrap"><div id="bar-gx" class="timer-bar"></div></div>
  <div id="table-gx" class="seat-table"></div>
  <div id="msg-gx" class="msg"></div>
  <div id="gx-controls" class="btn-row"></div>
  <div id="gx-input-row" class="hidden">
    <input id="gx-input" placeholder="입력!" autocomplete="off">
    <button id="gx-say" class="btn-sky">외치기!</button>
  </div>
  <button id="restart-gx-btn" class="hidden btn-green">다시 하기</button>
</div>
`);

/* ================= 범용 엔진 (GXGAMES 19개 공용, GX) ================= */
/* 범용 게임은 js/games/에서 registerGxGame(설정, { title, start(GX) })로 등록한다. */
const GXGAMES = {};
const GX_ENGINE = { start: k => startGeneric(k), stop: () => stopGeneric() };
function registerGxGame(meta, cfg){ GXGAMES[meta.key] = cfg; registerGame(meta, GX_ENGINE); }
function seatNeighbors(i){ return [(i+3)%4, (i+1)%4]; }
function gxPickTarget(exclude){
  const pool = [0,1,2,3].filter(i => i !== exclude);
  if(exclude !== 0 && Math.random() < 0.45) return 0;
  return rndOf(pool);
}
let GX = null;
function startGeneric(key){
  showScreen("generic-screen");
  const cfg = GXGAMES[key];
  GX = { key, cfg, seats: buildSeats("table-gx"), over:false, round:0,
    raf:0, timer:0, deadline:0, limit:0, onTimeout:null, data:{} };
  $("gx-title").textContent = cfg.title;
  $("gx-center").innerHTML = "";
  $("msg-gx").textContent = "";
  $("gx-controls").innerHTML = "";
  $("gx-input-row").classList.add("hidden");
  $("restart-gx-btn").classList.add("hidden");
  GX.raf = requestAnimationFrame(gxLoop);
  GX.timer = setTimeout(() => cfg.start(GX), 900);
}
/* haltState가 over=true를 먼저 찍는다: 라운드 함수들은 GX를 인자로 붙잡고 있어서, 전역 GX만 null로 만들면 남은 타이머가 옛 판을 계속 돌린다 */
function stopGeneric(){ haltState(GX); GX = null; }
function gxLoop(now){
  if(!GX || GX.over) return;
  const bar = $("bar-gx");
  if(GX.deadline){
    const remain = Math.max(0, GX.deadline - now);
    const ratio = remain / GX.limit;
    bar.style.width = (ratio*100)+"%";
    bar.classList.toggle("low", ratio < .35);
    if(remain <= 0){
      GX.deadline = 0;
      const fn = GX.onTimeout; GX.onTimeout = null;
      if(fn) fn();
      if(!GX || GX.over) return;
    }
  } else { bar.style.width="100%"; bar.classList.remove("low"); }
  GX.raf = requestAnimationFrame(gxLoop);
}
function gxSetTimer(ms, onTimeout){ GX.limit = ms; GX.deadline = performance.now() + ms; GX.onTimeout = onTimeout; }
function gxClearTimer(){ GX.deadline = 0; GX.onTimeout = null; }
function gxSafeNext(fn, delay=700){ const gx = GX; GX.timer = setTimeout(() => { if(GX === gx && !gx.over) fn(); }, delay); }
function gxBtn(label, onClick, cls=""){
  const b = document.createElement("button");
  b.textContent = label; if(cls) b.className = cls;
  b.addEventListener("click", onClick);
  $("gx-controls").appendChild(b);
  return b;
}
function gxFail(why, recVal){
  if(!GX || GX.over) return;
  haltState(GX);
  $("gx-controls").innerHTML = "";
  $("gx-input-row").classList.add("hidden");
  showLose({ key: GX.key, val: recVal, loser: GX.seats[0], msgId: "msg-gx", restartId: "restart-gx-btn", why });
}
$("restart-gx-btn").addEventListener("click", () => { const k = GX?GX.key:null; stopGeneric(); if(k) startGeneric(k); });
