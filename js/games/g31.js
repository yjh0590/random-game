registerGame(
  {key:"g31", emj:"🍦", nm:"베스킨라빈스 31", tg:"숫자 눈치",
    intro:"베스킨~ 라빈스~ 써티 원!",
    rules:["1부터 순서대로, 한 번에 <b>1~3개</b>씩 숫자를 외쳐!",
      "마지막 <b>\"31\"</b>을 부르는 사람이 벌칙!",
      "예시: A \"1,2,3\" → B \"4,5\" → C \"6\"...",
      "걸리면 마셔~ 🍺"],
    recLabel: v => `${v}승`},
  /* 엔진 */ { start: start31, stop: stop31 }
);

/* ---- 화면: 베스킨라빈스 31 ---- */
addScreen(/*html*/ `
<div id="game31-screen" class="screen hidden">
  <button class="btn-small back-corner" data-menu>← 메뉴</button>
  <div style="font-size:28px;font-weight:700;">🍦 베스킨라빈스 31</div>
  <div id="count-display">-</div>
  <div id="table31" class="seat-table"></div>
  <div id="msg31" class="msg"></div>
  <div id="controls31">
    <button data-n="1">1개 외치기</button>
    <button data-n="2">2개 외치기</button>
    <button data-n="3">3개 외치기</button>
  </div>
  <button id="restart31-btn" class="hidden btn-green">다시 하기</button>
</div>
`);

/* ================= 베스킨라빈스 31 ================= */
let seats31 = [], cur31 = 0, turn31 = 0, over31 = false, wins31 = 0, timer31 = 0;
/* 메뉴로 나가거나 재시작할 때 예약된 NPC 차례를 취소 (안 하면 다음 판에 NPC가 끼어듦) */
function stop31(){ clearTimeout(timer31); over31 = true; }
function start31(){
  showScreen("game31-screen");
  seats31 = buildSeats("table31");
  reset31(); loop31();
}
function reset31(){
  clearTimeout(timer31);
  cur31 = 0; turn31 = 0; over31 = false;
  $("count-display").textContent = "시~작!";
  $("count-display").classList.remove("danger");
  $("msg31").textContent = "";
  $("restart31-btn").classList.add("hidden");
  ctrl31(false);
  seats31.forEach(p => p.doodle.classList.remove("shake"));
  if(seats31[0]) seats31[0].el.classList.add("faded");   // 다시 내 시점으로!
}
function loop31(){
  seats31.forEach((p,i) => p.el.classList.toggle("turn", i===turn31));
  if(seats31[turn31].isHuman){
    $("msg31").textContent = "네 차례! 몇 개 외칠래?";
    ctrl31(true);
  } else {
    ctrl31(false);
    $("msg31").textContent = `${seats31[turn31].name} 생각 중...`;
    timer31 = setTimeout(() => { if(!over31 && seats31.length) npc31(); }, 900 + Math.random()*700);
  }
}
function ctrl31(on){
  document.querySelectorAll("#controls31 button").forEach(b => {
    const n = +b.dataset.n;
    b.disabled = !on || (cur31 + n > 31);
    b.style.opacity = b.disabled ? .4 : 1;
  });
}
document.querySelectorAll("#controls31 button").forEach(b => {
  b.addEventListener("click", () => {
    if(over31 || !seats31[turn31].isHuman) return;
    say31(+b.dataset.n);
  });
});
function npc31(){
  let opts = [1,2,3].filter(n => cur31 + n <= 31);
  const safe = opts.filter(n => cur31 + n !== 31);
  let pick;
  if(safe.length){
    const smart = safe.find(n => (cur31 + n) % 4 === 2);
    pick = (smart && Math.random() < 0.3) ? smart : rndOf(safe);
  } else pick = opts[0];
  say31(pick);
}
function say31(n){
  const p = seats31[turn31];
  const nums = []; for(let i=1;i<=n;i++) nums.push(cur31+i);
  cur31 += n;
  bubbleSay(p, nums.join(", ") + "!", 1100);
  click('word');
  const cd = $("count-display");
  cd.textContent = cur31;
  cd.classList.toggle("danger", cur31 >= 27);
  if(cur31 >= 31){ lose31(p); return; }
  turn31 = (turn31 + 1) % seats31.length;
  timer31 = setTimeout(() => { if(!over31) loop31(); }, 700);
}
function lose31(p){
  over31 = true; ctrl31(false); click('fail');
  shakeSeat(p);
  if(!p.isHuman){ wins31++; saveRec("g31", wins31, gamesByKey.g31.recLabel); }
  $("msg31").innerHTML = p.isHuman
    ? `앗, <b class="drink">${p.name}</b> 당첨! 마셔~ 마셔~ 🍺`
    : `<b class="drink">${p.name}</b> 당첨! 원샷~ 🍺 <span class="record-line">이번 세션 ${wins31}승!</span>`;
  $("restart31-btn").classList.remove("hidden");
}
$("restart31-btn").addEventListener("click", () => { reset31(); loop31(); });
