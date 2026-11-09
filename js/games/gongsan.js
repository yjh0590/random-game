registerGame(
  {key:"gongsan", emj:"✊", nm:"공산당", tg:"왕게임·복불복",
    intro:"공~산당 공산당 공~산당 공산당!",
    rules:["발언권을 가진 <b>수령</b>이 \"동무!\" 하며 마음대로 지시!",
      "수령이 되면 제한 시간 안에 동무를 지목하라우!",
      "지시 복불복: <b>\"바로 마시라우!\"</b>가 나한테 떨어지면 끝... 🍺",
      "그 외 지시는 발언권이 넘어가며 계속! 몇 라운드나 버틸까?"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 */ { start: startGongsan, stop: stopGongsan }
);

/* ================= 공산당 (왕게임·복불복) ================= */
const GS_ORDERS = [   // [멘트, 벌칙 여부]
  ["바로 마시라우!", true],
  ["원샷 하라우!", true],
  ["옆 동무와 러브샷 하라우~", false],
  ["재롱 부리라우!", false],
  ["애교 보이라우~", false],
  ["건배사 외치라우!", false],
  ["만세 삼창 하라우!", false],
  ["발언권 넘기갔어. 잘 하라우~", false],
];
let GS = null;
function startGongsan(){
  showScreen("gongsan-screen");
  GS = { seats: buildSeats("table-gs"), holder: 0, round: 0, over: false,
    limit: 4000, deadline: 0, raf: 0, timer: 0 };
  $("msg-gs").textContent = "";
  $("gs-targets").innerHTML = "";
  $("restart-gs-btn").classList.add("hidden");
  $("gs-center").innerHTML = "공~산당 공산당! 공~산당 공산당! ✊";
  GS.timer = setTimeout(nextGongsan, 1000);
  GS.raf = requestAnimationFrame(loopGongsan);
}
function stopGongsan(){ haltState(GS); GS = null; }
function nextGongsan(){
  if(!GS || GS.over) return;
  GS.round++;
  GS.seats.forEach((p,i) => p.el.classList.toggle("turn", i === GS.holder));
  const p = GS.seats[GS.holder];
  $("gs-targets").innerHTML = "";
  if(p.isHuman){
    GS.limit = Math.max(1500, 4000 - 120 * (GS.round - 1));
    GS.deadline = performance.now() + GS.limit;
    $("gs-center").innerHTML = `네가 <b>수령</b>이다! ✊ 지목하라우!`;
    $("msg-gs").textContent = "동무를 골라! (지시는 복불복이다...)";
    [1,2,3].forEach(i => {
      const b = document.createElement("button");
      b.textContent = `🫵 ${GS.seats[i].name} 동무!`;
      b.addEventListener("click", () => orderGongsan(0, i));
      $("gs-targets").appendChild(b);
    });
  } else {
    GS.deadline = 0;
    $("msg-gs").textContent = `${p.name} 수령이 노려본다...`;
    GS.timer = setTimeout(() => {
      if(!GS || GS.over) return;
      const target = rndOf([0,1,2,3].filter(i => i !== GS.holder && (i === 0 ? Math.random() < 0.6 : true)));
      orderGongsan(GS.holder, target);
    }, 900 + Math.random()*800);
  }
}
function orderGongsan(from, target){
  if(!GS || GS.over) return;
  GS.deadline = 0;
  $("gs-targets").innerHTML = "";
  const [ment, isPenalty] = rndOf(GS_ORDERS);
  const F = GS.seats[from], T = GS.seats[target];
  $("gs-center").innerHTML = `<b>${F.name}</b> 🫵 "<b>${T.name}</b> 동무! ${ment}"`;
  bubbleSay(F, "동무!", 900);
  click('word'); hop(F);
  GS.timer = setTimeout(() => {
    if(!GS || GS.over) return;
    if(isPenalty){
      if(T.isHuman) return failGongsan(`수령의 명령이다... "${ment}"`);
      bubbleSay(T, "크윽... 🍺", 1200);
      click('fail'); hop(T);
      $("msg-gs").textContent = `${T.name} 원샷! 게임은 계속된다...`;
      GS.holder = target;
      GS.timer = setTimeout(nextGongsan, 900);
    } else {
      bubbleSay(T, "알갔습네다!", 1000);
      click('word'); hop(T);
      GS.holder = target;
      GS.timer = setTimeout(nextGongsan, 700);
    }
  }, 900);
}
function loopGongsan(now){
  if(!GS || GS.over) return;
  const bar = $("bar-gs");
  if(GS.seats[GS.holder].isHuman && GS.deadline){
    const remain = Math.max(0, GS.deadline - now);
    const ratio = remain / GS.limit;
    bar.style.width = (ratio*100) + "%";
    bar.classList.toggle("low", ratio < 0.35);
    if(remain <= 0) return failGongsan("수령이 우물쭈물?! 반동분자다!");
  } else { bar.style.width = "100%"; bar.classList.remove("low"); }
  GS.raf = requestAnimationFrame(loopGongsan);
}
function failGongsan(why){
  if(!GS || GS.over) return;
  haltState(GS);
  $("gs-targets").innerHTML = "";
  showLose({ key: "gongsan", val: GS.round, loser: GS.seats[0], msgId: "msg-gs", restartId: "restart-gs-btn",
    why, drink: "마시라우~ 🍺" });
}
$("restart-gs-btn").addEventListener("click", () => { stopGongsan(); startGongsan(); });
