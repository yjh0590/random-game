registerGame(
  {key:"hoppang", emj:"🥟", nm:"호빵찐빵", tg:"007빵식",
    intro:"호! 빵~ 찐~빵 대빵!",
    rules:["한 글자씩 지목하며 넘긴다: 호→빵 / 찐→빵 / 대→빵",
      "<b>내가 지목당하면</b> 다음 글자를 눌러!",
      "마지막 \"빵!\"을 맞으면 조합에 따라 반응: <b>호빵</b>=당사자만 [😱으악!] / <b>찐빵</b>=당사자 빼고 양옆 / <b>대빵</b>=당사자 빼고 전원!",
      "내가 반응조면 [😱으악!], 아니면 <b>가만히!</b> 점점 빨라져 ⚡"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 */ { start: startHoppang, stop: stopHoppang }
);

/* ================= 호빵찐빵 (007빵식 + 반응) ================= */
const HP_COMBOS = [ ["호빵", 2], ["찐빵", 4], ["대빵", 6] ];   // [이름, 체인 길이]
const HP_SYL = ["호","빵","찐","빵","대","빵"];
function hpNb(a,b){ const d=(a-b+4)%4; return d===1||d===3; }
let HP = null;
function startHoppang(){
  showScreen("hoppang-screen");
  HP = { seats: buildSeats("table-hp"), round: 0, over: false,
    phase: "idle", combo: null, step: 0, holder: 0, target: -1,
    limit: 2400, deadline: 0, raf: 0, timer: 0 };
  $("msg-hp").textContent = "";
  $("restart-hp-btn").classList.add("hidden");
  $("hp-center").innerHTML = "호! 빵~ 찐~빵 대빵! 🥟";
  HP.timer = setTimeout(nextHpRound, 1000);
  HP.raf = requestAnimationFrame(loopHoppang);
}
function stopHoppang(){ haltState(HP); HP = null; }
function nextHpRound(){
  if(!HP || HP.over) return;
  HP.round++;
  HP.combo = rndOf(HP_COMBOS);
  HP.step = 0;
  HP.phase = "chain";
  HP.holder = rndOf([1,2,3]);
  hpChainStep();
}
function hpChainStep(){
  if(!HP || HP.over) return;
  const [comboName, len] = HP.combo;
  const syl = HP_SYL[HP.step];
  const from = HP.holder;
  let target = rndOf([0,1,2,3].filter(i => i !== from));
  if(from !== 0 && Math.random() < 0.42) target = 0;
  HP.target = target;
  HP.seats.forEach((p,i) => p.el.classList.toggle("turn", i === from));
  $("hp-center").innerHTML = `<b>${HP.seats[from].name}</b> 👉 <b>${HP.seats[target].name}</b> "<b>${syl}!</b>"`;
  click('word'); hop(HP.seats[from]);
  const isLast = (HP.step === len - 1);
  if(target === 0 && !isLast){
    /* 내가 받았다 → 다음 글자를 눌러야 함 */
    HP.phase = "mySyl";
    HP.expectSyl = HP_SYL[HP.step + 1];
    HP.limit = Math.max(900, 2400 - 55 * (HP.round * 3 + HP.step));
    HP.deadline = performance.now() + HP.limit;
    $("msg-hp").textContent = `받았다! 다음 글자를 눌러!`;
  } else if(isLast){
    /* 마지막 "빵!" → 반응 단계 */
    HP.timer = setTimeout(() => hpReaction(target), 500);
  } else {
    /* NPC가 받아서 자동 진행 */
    HP.holder = target;
    HP.step++;
    HP.timer = setTimeout(hpChainStep, Math.max(350, 800 - 40*HP.round));
  }
}
function hpReaction(target){
  if(!HP || HP.over) return;
  const [comboName] = HP.combo;
  let group;   // 으악 해야 하는 사람들
  if(comboName === "호빵") group = [target];
  else if(comboName === "찐빵") group = [0,1,2,3].filter(i => i !== target && hpNb(i, target));
  else group = [0,1,2,3].filter(i => i !== target);
  const meIn = group.includes(0);
  HP.phase = "react";
  HP.reactNeed = meIn;
  $("hp-center").innerHTML = `조합은... <b>${comboName}</b>!! (빵 맞은 사람: <b>${HP.seats[target].name}</b>)`;
  $("msg-hp").textContent = meIn ? "너도 반응조다! [😱 으악!]" : "너는 아니다... 가만히!";
  group.forEach((i,k) => { if(i !== 0) setTimeout(() => { if(HP && !HP.over) { bubbleSay(HP.seats[i], "으악!!", 900); hop(HP.seats[i]); } }, 250 + k*100); });
  HP.limit = Math.max(900, 2200 - 90 * HP.round);
  HP.deadline = meIn ? performance.now() + HP.limit : 0;
  HP.trapUntil = meIn ? 0 : performance.now() + 1300;
  if(!meIn){
    HP.timer = setTimeout(() => { if(HP && !HP.over) hpRoundClear(); }, 1400);
  }
}
function hpRoundClear(){
  HP.phase = "idle"; HP.deadline = 0; HP.trapUntil = 0;
  $("msg-hp").textContent = "세이프! 다음 라운드~";
  HP.timer = setTimeout(nextHpRound, 700);
}
document.querySelectorAll("#hp-controls button").forEach(b => {
  b.addEventListener("click", () => {
    if(!HP || HP.over) return;
    const syl = b.dataset.syl;
    if(HP.phase === "mySyl"){
      if(syl === "으악") return failHoppang("지금은 으악이 아니라 글자를 넘길 차례다!");
      if(syl !== HP.expectSyl) return failHoppang(`"${HP.expectSyl}!"을 눌렀어야지!`);
      bubbleSay(HP.seats[0], syl + "!", 800);
      click('word'); hop(HP.seats[0]);
      HP.deadline = 0;
      HP.holder = 0; HP.step++;
      HP.phase = "chain";
      HP.timer = setTimeout(hpChainStep, 250);
    } else if(HP.phase === "react"){
      if(HP.reactNeed){
        if(syl !== "으악") return failHoppang("반응조는 [😱 으악!]을 눌러야지!");
        bubbleSay(HP.seats[0], "으악!!", 900);
        click('word'); hop(HP.seats[0]);
        HP.deadline = 0; HP.reactNeed = false;
        hpRoundClear();
      } else {
        if(performance.now() < HP.trapUntil)
          return failHoppang("너는 반응조가 아닌데?! 조용히 있으라고!");
      }
    }
    /* idle/chain 중 누른 건 관용 (무시) */
  });
});
function loopHoppang(now){
  if(!HP || HP.over) return;
  const bar = $("bar-hp");
  if(HP.deadline){
    const remain = Math.max(0, HP.deadline - now);
    const ratio = remain / HP.limit;
    bar.style.width = (ratio*100) + "%";
    bar.classList.toggle("low", ratio < 0.35);
    if(remain <= 0) return failHoppang(HP.phase === "react" ? "으악이 늦었다!" : "글자를 못 넘겼다!");
  } else { bar.style.width = "100%"; bar.classList.remove("low"); }
  HP.raf = requestAnimationFrame(loopHoppang);
}
function failHoppang(why){
  if(!HP || HP.over) return;
  haltState(HP);
  showLose({ key: "hoppang", val: HP.round - 1, loser: HP.seats[0], msgId: "msg-hp", restartId: "restart-hp-btn", why });
}
$("restart-hp-btn").addEventListener("click", () => { stopHoppang(); startHoppang(); });
