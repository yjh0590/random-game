/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGame(
  {key:"shoot", emj:"⚽", nm:"슛돌이", tg:"눈치 기립",
    intro:"🎵 날아라~ 슛돌이~ (혼자 왔어요→넷이 왔어요)",
    rules:["노래에 맞춰 \"혼자 왔어요\"→\"둘이\"→\"셋이\"→\"넷이 왔어요\" 인원수만큼 <b>일어나야</b> 해!",
      "콤이들이 눈치보며 일어난다... 숫자를 세서 <b>내가 일어나야 맞으면</b> [🙋 일어나기!]",
      "이미 인원이 찼는데 일어나면 탈락! 모자란데 앉아있어도 탈락!",
      "제한 시간이 <b>점점 짧아져!</b> ⚡"],
    recLabel: v => `${v}소절 생존`},
  /* 엔진 */ { start: startShoot, stop: stopShoot }
);

/* ---- 화면: 슛돌이 (눈치 기립) ---- */
addScreen(/*html*/ `
<div id="shoot-screen" class="screen hidden">
  <button class="btn-small back-corner" data-menu>← 메뉴</button>
  <div style="font-size:28px;font-weight:700;">⚽ 슛돌이</div>
  <div id="st-center" class="big-center">🎵 날아라~ 슛돌이~</div>
  <div class="timer-wrap"><div id="bar-st" class="timer-bar"></div></div>
  <div id="table-st" class="seat-table"></div>
  <div id="msg-st" class="msg"></div>
  <button id="st-stand" class="btn-berry" style="font-size:26px;padding:12px 36px;">🙋 일어나기!</button>
  <button id="restart-st-btn" class="hidden btn-green">다시 하기</button>
</div>
`);

/* ================= 슛돌이 (눈치 기립) ================= */
const ST_SONG = ["혼자 왔어요~","둘이 왔어요~","셋이 왔어요~","넷이 왔어요~"];
let ST = null;
function startShoot(){
  showScreen("shoot-screen");
  ST = { seats: buildSeats("table-st"), phase: 0, verse: 0, over: false,
    npcStand: [], meStand: false, need: 1,
    limit: 4000, deadline: 0, raf: 0, timer: 0, timers: [] };
  $("msg-st").textContent = "";
  $("restart-st-btn").classList.add("hidden");
  $("st-center").innerHTML = "🎵 날아라~ 슛돌이~ ⚽";
  ST.timer = setTimeout(nextVerse, 1100);
  ST.raf = requestAnimationFrame(loopShoot);
}
function stopShoot(){ haltState(ST); ST = null; }
function nextVerse(){
  if(!ST || ST.over) return;
  ST.verse++;
  ST.need = ((ST.verse - 1) % 4) + 1;   // 1→2→3→4 반복
  ST.meStand = false;
  ST.seats.forEach(s => s.el.classList.remove("stand","turn"));
  $("st-center").innerHTML = `🎵 "<b>${ST_SONG[ST.need - 1]}</b>" (${ST.need}명 일어나야 해!)`;
  $("msg-st").textContent = "눈치를 봐라... 몇 명이 일어나나?";
  ST.limit = Math.max(1800, 4000 - 110 * (ST.verse - 1));   // 점점 짧아진다!
  ST.deadline = performance.now() + ST.limit;
  /* NPC 기립 계획: (need-1)명 또는 need명이 일어남 → 내 판단이 승부처 */
  const w = (ST.need === 4) ? 3 : (Math.random() < 0.5 ? ST.need - 1 : Math.min(3, ST.need));
  const ups = [];
  const pool = [1,2,3].sort(() => Math.random() - 0.5);
  for(let k=0;k<w;k++) ups.push(pool[k]);
  ST.npcStand = ups;
  ST.timers = ups.map((i,k) => setTimeout(() => {
    if(!ST || ST.over) return;
    ST.seats[i].el.classList.add("stand");
    bubbleSay(ST.seats[i], "🙋", 800);
    click('thumb');
  }, 350 + Math.random()*ST.limit*0.45 + k*180));
  /* 마감 판정 */
  ST.timer = setTimeout(judgeShoot, ST.limit);
}
function judgeShoot(){
  if(!ST || ST.over) return;
  const total = ST.npcStand.length + (ST.meStand ? 1 : 0);
  if(total === ST.need){
    $("msg-st").textContent = `딱 ${ST.need}명! 세이프~ 🎉`;
    click('word');
    ST.deadline = 0;
    ST.timer = setTimeout(nextVerse, 900);
  } else if(ST.meStand){
    failShoot(`${total}명이 일어났다... ${ST.need}명이어야 하는데! 네가 오버했다!`);
  } else {
    failShoot(`${total}명뿐... 네가 일어났어야지!`);
  }
}
$("st-stand").addEventListener("pointerdown", e => {
  e.preventDefault();
  if(!ST || ST.over || ST.meStand || !ST.deadline) return;
  ST.meStand = true;
  ST.seats[0].el.classList.add("stand");
  bubbleSay(ST.seats[0], "🙋 왔어요!", 800);
  click('clap');
});
function loopShoot(now){
  if(!ST || ST.over) return;
  const bar = $("bar-st");
  if(ST.deadline){
    const remain = Math.max(0, ST.deadline - now);
    const ratio = remain / ST.limit;
    bar.style.width = (ratio*100) + "%";
    bar.classList.toggle("low", ratio < 0.35);
  } else { bar.style.width = "100%"; bar.classList.remove("low"); }
  ST.raf = requestAnimationFrame(loopShoot);
}
function failShoot(why){
  if(!ST || ST.over) return;
  haltState(ST);
  showLose({ key: "shoot", val: ST.verse - 1, loser: ST.seats[0], msgId: "msg-st", restartId: "restart-st-btn", why });
}
$("restart-st-btn").addEventListener("click", () => { stopShoot(); startShoot(); });

})();
