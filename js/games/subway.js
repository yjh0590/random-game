registerGame(
  {key:"subway", emj:"🚇", nm:"지하철", tg:"지식",
    intro:"지하철~ 지하철! 몇호선~ 몇호선! 덜컹덜컹 아 밀지 마세요~",
    rules:["정해진 호선에 <b>실제로 있는 역</b>을 돌아가며 외쳐!",
      "없는 역, 이미 나온 역, 시간 초과 = 벌칙!",
      "노선: 서울 2호선 / 인천 1호선 (인천대입구역 있음 ㅎㅎ)",
      "제한 시간이 <b>점점 짧아져!</b> ⚡"],
    recLabel: v => `역 ${v}개`},
  /* 엔진 */ { start: startSubway, stop: stopSubway }
);

/* ---- 화면: 지하철 ---- */
addScreen(/*html*/ `
<div id="subway-screen" class="screen hidden">
  <button class="btn-small back-corner" data-menu>← 메뉴</button>
  <div style="font-size:28px;font-weight:700;">🚇 지하철 게임</div>
  <div id="sub-line-pick" class="btn-row">
    <div class="sub" style="width:100%;">지하철~ 지하철! 몇호선~ 몇호선! 노선을 골라!</div>
    <button class="btn-green" data-line="line2">서울 2호선</button>
    <button class="btn-sky" data-line="incheon1">인천 1호선</button>
  </div>
  <div id="sub-play" class="hidden" style="display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;">
    <div id="sub-line-name" class="sub"></div>
    <div class="timer-wrap"><div id="bar-sub" class="timer-bar"></div></div>
    <div id="table-sub" class="seat-table"></div>
    <div id="msg-sub" class="msg"></div>
    <div>
      <input id="sub-input" placeholder="역 이름!" autocomplete="off">
      <button id="sub-say" class="btn-sky">외치기!</button>
    </div>
    <div id="sub-used"></div>
    <button id="restart-sub-btn" class="hidden btn-green">다시 하기</button>
  </div>
</div>
`);

/* ================= 지하철 ================= */
const SUBWAY_LINES = {
  line2: { name:"서울 2호선 🟢", stations:[
    "시청","을지로입구","을지로3가","을지로4가","동대문역사문화공원","신당","상왕십리","왕십리","한양대","뚝섬","성수","건대입구","구의","강변","잠실나루","잠실","잠실새내","종합운동장","삼성","선릉","역삼","강남","교대","서초","방배","사당","낙성대","서울대입구","봉천","신림","신대방","구로디지털단지","대림","신도림","문래","영등포구청","당산","합정","홍대입구","신촌","이대","아현","충정로",
    "용답","신답","용두","신설동","도림천","양천구청","신정네거리","까치산"] },
  incheon1: { name:"인천 1호선 🔵", stations:[
    "계양","귤현","박촌","임학","계산","경인교대입구","작전","갈산","부평구청","부평시장","부평","동수","부평삼거리","간석오거리","인천시청","예술회관","인천터미널","문학경기장","선학","신연수","원인재","동춘","동막","캠퍼스타운","테크노파크","지식정보단지","인천대입구","센트럴파크","국제업무지구","송도달빛축제공원"] }
};
let SB = null;
function normStation(s){ return s.replace(/\s/g,"").replace(/역$/,""); }
function startSubway(){
  showScreen("subway-screen");
  $("sub-line-pick").classList.remove("hidden");
  $("sub-play").classList.add("hidden");
  SB = null;
}
document.querySelectorAll("#sub-line-pick [data-line]").forEach(b => {
  b.addEventListener("click", () => beginSubway(b.dataset.line));
});
function beginSubway(lineKey){
  const line = SUBWAY_LINES[lineKey];
  $("sub-line-pick").classList.add("hidden");
  $("sub-play").classList.remove("hidden");
  $("sub-line-name").textContent = line.name + " — 덜컹덜컹 출발!";
  SB = { lineKey, line, used: new Set(), usedList: [],
    seats: buildSeats("table-sub"), turn: 0, over: false, turnCount: 0,
    limit: 6000, deadline: 0, raf: 0 };
  $("msg-sub").textContent = ""; $("sub-used").innerHTML = "";
  $("sub-input").value = "";
  $("restart-sub-btn").classList.add("hidden");
  nextSubway();
  SB.raf = requestAnimationFrame(loopSubway);
}
function stopSubway(){ haltState(SB); SB = null; }
function nextSubway(){
  SB.turnCount++;
  SB.seats.forEach((p,i) => p.el.classList.toggle("turn", i === SB.turn));
  const p = SB.seats[SB.turn];
  if(p.isHuman){
    SB.limit = Math.max(2500, 6000 - 150 * (SB.turnCount - 1));
    SB.deadline = performance.now() + SB.limit;
    $("msg-sub").textContent = "네 차례! 역 이름을 외쳐!";
    $("sub-input").disabled = false; $("sub-say").disabled = false;
    $("sub-input").focus();
  } else {
    SB.deadline = 0;
    $("sub-input").disabled = true; $("sub-say").disabled = true;
    $("msg-sub").textContent = `${p.name} 생각 중...`;
    const sb = SB;   // 이 판의 상태 — 재시작으로 SB가 바뀌면 예약된 동작은 버린다
    setTimeout(() => {
      if(SB !== sb || SB.over) return;
      const remain = SB.line.stations.filter(s => !SB.used.has(normStation(s)));
      if(!remain.length) return endSubwayAllUsed();
      const pick = rndOf(remain);
      useStation(pick);
      bubbleSay(p, pick + "!", 1000);
      click('word'); hop(p);
      SB.turn = (SB.turn + 1) % SB.seats.length;
      setTimeout(() => { if(SB === sb && !SB.over) nextSubway(); }, 200);
    }, 700 + Math.random()*700);
  }
}
/* 노선의 역이 다 나오면 (NPC가 고를 역이 없음) 무승부로 끝낸다 */
function endSubwayAllUsed(){
  SB.over = true;
  cancelAnimationFrame(SB.raf);
  $("sub-input").disabled = true; $("sub-say").disabled = true;
  saveRec("subway", SB.usedList.length, gamesByKey.subway.recLabel);
  $("msg-sub").innerHTML = `🎉 노선의 역이 전부 나왔다! 다 같이 짠~ 🍻
    <span class="record-line">이번 판: 역 ${SB.usedList.length}개 · 최고 기록 ${REC.subway.label}</span>`;
  $("restart-sub-btn").classList.remove("hidden");
}
function useStation(name){
  SB.used.add(normStation(name));
  SB.usedList.push(name);
  const recent = SB.usedList.slice(-12);
  $("sub-used").innerHTML = "나온 역: " + recent.map((s,i) => i === recent.length-1 ? `<b>${s}</b>` : s).join(" → ");
}
function playerSubway(){
  if(!SB || SB.over) return;
  const p = SB.seats[SB.turn];
  if(!p.isHuman) return;
  const raw = $("sub-input").value.trim();
  if(!raw) return;
  const norm = normStation(raw);
  const valid = SB.line.stations.some(s => normStation(s) === norm);
  if(!valid) return failSubway(p, `"${esc(raw)}"...? 그 노선에 그런 역 없다!`);
  if(SB.used.has(norm)) return failSubway(p, `"${esc(raw)}"는 이미 나온 역이다!`);
  const official = SB.line.stations.find(s => normStation(s) === norm);
  useStation(official);
  bubbleSay(p, official + "!", 1000);
  click('word'); hop(p);
  $("sub-input").value = "";
  $("sub-input").disabled = true; $("sub-say").disabled = true;
  SB.turn = (SB.turn + 1) % SB.seats.length;
  const sb = SB;
  setTimeout(() => { if(SB === sb && !SB.over) nextSubway(); }, 200);
}
$("sub-say").addEventListener("click", playerSubway);
$("sub-input").addEventListener("keydown", e => { if(e.key === "Enter") playerSubway(); });
function loopSubway(now){
  if(!SB || SB.over) return;
  const p = SB.seats[SB.turn];
  const bar = $("bar-sub");
  if(p.isHuman && SB.deadline){
    const remain = Math.max(0, SB.deadline - now);
    const ratio = remain / SB.limit;
    bar.style.width = (ratio*100) + "%";
    bar.classList.toggle("low", ratio < 0.35);
    if(remain <= 0) return failSubway(p, "시간 초과!");
  } else { bar.style.width = "100%"; bar.classList.remove("low"); }
  SB.raf = requestAnimationFrame(loopSubway);
}
function failSubway(p, why){
  if(!SB || SB.over) return;
  haltState(SB);
  $("sub-input").disabled = true; $("sub-say").disabled = true;
  showLose({ key: "subway", val: SB.usedList.length, loser: p, msgId: "msg-sub", restartId: "restart-sub-btn", why });
}
$("restart-sub-btn").addEventListener("click", () => {
  const k = SB ? SB.lineKey : "line2";
  stopSubway();
  showScreen("subway-screen");
  $("sub-line-pick").classList.add("hidden");
  $("sub-play").classList.remove("hidden");
  beginSubway(k);
});
