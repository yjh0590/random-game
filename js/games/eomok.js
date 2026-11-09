registerGame(
  {key:"eomok", emj:"🐟", nm:"어목조동", tg:"지식·순발력",
    intro:"어! 목! 조! 동! 어목조동 어목조동!",
    rules:["[이름]+[범주]로 지목이 날아온다! 어(물고기)·목(나무)·조(새)·동(동물)",
      "<b>내가 지목당하면</b> 제한 시간 안에 맞는 단어 칩을 골라!",
      "고른 다음엔 자동으로 다음 사람을 지목해.",
      "이미 나온 단어·다른 범주 단어 = 탈락! 시간도 <b>점점 짧아져</b> ⚡"],
    recLabel: v => `단어 ${v}개`},
  /* 엔진 */ { start: startEomok, stop: stopEomok }
);

/* ---- 화면: 어목조동 ---- */
addScreen(/*html*/ `
<div id="eomok-screen" class="screen hidden">
  <button class="btn-small back-corner" data-menu>← 메뉴</button>
  <div style="font-size:28px;font-weight:700;">🐟 어목조동</div>
  <div id="em-center" class="big-center">어! 목! 조! 동!</div>
  <div class="timer-wrap"><div id="bar-em" class="timer-bar"></div></div>
  <div id="table-em" class="seat-table"></div>
  <div id="msg-em" class="msg"></div>
  <div id="em-chips" class="btn-row"></div>
  <div id="em-used" class="sub" style="max-width:min(520px,92vw);"></div>
  <button id="restart-em-btn" class="hidden btn-green">다시 하기</button>
</div>
`);

/* ================= 어목조동 ([이름]+[범주] 지목) ================= */
const EOMOK_BANK = {
  "어": { emj:"🐟", full:"어(물고기)", words:["고등어","연어","참치","광어","멸치","갈치","꽁치","붕어","잉어","상어","가자미","송어","대구","명태","조기"] },
  "목": { emj:"🌳", full:"목(나무)", words:["소나무","대나무","단풍나무","은행나무","벚나무","참나무","버드나무","자작나무","밤나무","감나무","전나무","느티나무","향나무","떡갈나무"] },
  "조": { emj:"🐦", full:"조(새)", words:["참새","독수리","비둘기","까치","까마귀","제비","부엉이","올빼미","매","갈매기","앵무새","두루미","백조","꿩","딱따구리"] },
  "동": { emj:"🦁", full:"동(동물)", words:["호랑이","사자","코끼리","기린","토끼","여우","곰","늑대","다람쥐","고양이","강아지","판다","하마","코뿔소","원숭이"] }
};
let EM = null;
function startEomok(){
  showScreen("eomok-screen");
  EM = { seats: buildSeats("table-em"), used: new Set(), usedList: [],
    round: 0, over: false, deadline: 0, limit: 1, raf: 0, timer: 0, cur: null, holder: rndOf([1,2,3]) };
  $("msg-em").textContent = ""; $("em-used").textContent = "";
  $("em-chips").innerHTML = "";
  $("restart-em-btn").classList.add("hidden");
  $("em-center").innerHTML = "어! 목! 조! 동! 👏 어목조동 어목조동!";
  EM.timer = setTimeout(nextEomok, 1100);
  EM.raf = requestAnimationFrame(loopEomok);
}
function stopEomok(){ haltState(EM); EM = null; }
function emRemain(cat){
  const r = EOMOK_BANK[cat].words.filter(w => !EM.used.has(w));
  if(r.length === 0){ EOMOK_BANK[cat].words.forEach(w => EM.used.delete(w)); return EOMOK_BANK[cat].words.slice(); }
  return r;
}
function nextEomok(){
  if(!EM || EM.over) return;
  EM.round++;
  const caller = EM.holder;
  const cat = rndOf(["어","목","조","동"]);
  let target = rndOf([0,1,2,3].filter(i => i !== caller));
  if(caller !== 0 && Math.random() < 0.45) target = 0;
  EM.holder = (target === 0) ? rndOf([1,2,3]) : target;
  EM.seats.forEach((p,i) => p.el.classList.toggle("turn", i === caller));
  const B = EOMOK_BANK[cat];
  $("em-center").innerHTML = `<b>${EM.seats[caller].name}</b>: "<b>${EM.seats[target].name}</b>! ${B.full} ${B.emj}!"`;
  click('word'); hop(EM.seats[caller]);
  $("em-chips").innerHTML = "";
  if(target === 0){
    EM.limit = Math.max(1200, 3000 - 70 * EM.round);
    EM.deadline = performance.now() + EM.limit;
    EM.cur = { cat };
    $("msg-em").textContent = `(쿵 짝!) ${B.full}에 맞는 단어를 골라!`;
    const correct = rndOf(emRemain(cat));
    const traps = [];
    const otherCats = ["어","목","조","동"].filter(c => c !== cat);
    while(traps.length < 3){
      let w;
      if(EM.usedList.length && Math.random() < 0.4) w = rndOf(EM.usedList);
      else w = rndOf(EOMOK_BANK[rndOf(otherCats)].words);
      if(w !== correct && !traps.includes(w)) traps.push(w);
    }
    [correct, ...traps].sort(() => Math.random() - 0.5).forEach(w => {
      const b = document.createElement("button");
      b.className = "chip"; b.textContent = w;
      b.addEventListener("click", () => pickEomok(w));
      $("em-chips").appendChild(b);
    });
  } else {
    EM.cur = null; EM.deadline = 0;
    $("msg-em").textContent = "...";
    EM.timer = setTimeout(() => {
      if(!EM || EM.over) return;
      const w = rndOf(emRemain(cat));
      EM.used.add(w); EM.usedList.push(w);
      bubbleSay(EM.seats[target], w + "!", 900);
      click('word'); hop(EM.seats[target]);
      updateEmUsed();
      EM.timer = setTimeout(nextEomok, 650);
    }, 550);
  }
}
function pickEomok(w){
  if(!EM || EM.over || !EM.cur) return;
  const cat = EM.cur.cat;
  if(EM.used.has(w)) return failEomok(`"${w}"...는 이미 나온 단어다!`);
  const actual = Object.keys(EOMOK_BANK).find(c => EOMOK_BANK[c].words.includes(w));
  if(actual !== cat) return failEomok(`"${w}"는 ${EOMOK_BANK[actual].full}이잖아!`);
  EM.used.add(w); EM.usedList.push(w);
  bubbleSay(EM.seats[0], w + "!", 900);
  click('word'); hop(EM.seats[0]);
  updateEmUsed();
  EM.cur = null; EM.deadline = 0;
  $("em-chips").innerHTML = "";
  $("msg-em").textContent = "좋아! 다음 사람 지목~";
  EM.timer = setTimeout(nextEomok, 550);
}
function updateEmUsed(){
  $("em-used").innerHTML = "나온 단어: " + EM.usedList.slice(-10).join(", ");
}
function loopEomok(now){
  if(!EM || EM.over) return;
  const bar = $("bar-em");
  if(EM.cur && EM.deadline){
    const remain = Math.max(0, EM.deadline - now);
    const ratio = remain / EM.limit;
    bar.style.width = (ratio*100) + "%";
    bar.classList.toggle("low", ratio < 0.35);
    if(remain <= 0) return failEomok("시간 초과!");
  } else { bar.style.width = "100%"; bar.classList.remove("low"); }
  EM.raf = requestAnimationFrame(loopEomok);
}
function failEomok(why){
  if(!EM || EM.over) return;
  haltState(EM);
  $("em-chips").innerHTML = "";
  showLose({ key: "eomok", val: EM.usedList.length, loser: EM.seats[0], msgId: "msg-em", restartId: "restart-em-btn", why });
}
$("restart-em-btn").addEventListener("click", () => { stopEomok(); startEomok(); });
