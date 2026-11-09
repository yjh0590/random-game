registerGxGame(
  {key:"hongsam", emj:"🍑", nm:"홍삼게임", tg:"동시 지목",
    intro:"아~ 싸 홍삼! 에브리바디 홍삼!",
    rules:["리더가 두 명을 지목: \"너, 너!\"",
      "지목받은 두 사람이 <b>동시에</b> 다른 사람을 지목!",
      "두 지목이 <b>한 사람에게 겹치면</b> 그 사람이 다음 리더!",
      "내가 지목받으면 시간 안에 골라야 해."],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🍑 홍삼게임", start(GX){ GX.data.leader=0; hongsamRound(GX); } }
);

/* ---- 24. 홍삼게임 ---- */
function hongsamRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const leader = GX.data.leader;
  const pool = [0,1,2,3].filter(i=>i!==leader);
  const picks = pool.sort(()=>Math.random()-0.5).slice(0,2);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===leader));
  $("gx-center").innerHTML = `<b>${GX.seats[leader].name}</b>: "너, 너!" 👉 <b>${picks.map(i=>GX.seats[i].name).join(", ")}</b>`;
  bubbleSay(GX.seats[leader], "너, 너!", 1000); click('word'); hop(GX.seats[leader]);
  $("gx-controls").innerHTML="";
  const humanPicks = picks.includes(0);
  gxSafeNext(() => {
    if(humanPicks){
      $("msg-gx").textContent = "너도 지목받았다! 누굴 가리킬래?";
      [1,2,3].forEach(i => gxBtn(`👉 ${GX.seats[i].name}`, () => hongsamResolve(GX, picks)));
      gxSetTimer(Math.max(1000,2600-60*GX.round), () => gxFail("못 골랐다!", GX.round-1));
    } else {
      hongsamResolve(GX, picks);
    }
  }, 700);
}
function hongsamResolve(GX, picks){
  gxClearTimer(); $("gx-controls").innerHTML="";
  const choices = {};
  picks.forEach(i => { choices[i] = gxPickTarget(i); });
  const targets = picks.map(i=>choices[i]);
  const converge = targets[0] === targets[1] ? targets[0] : null;
  $("gx-center").innerHTML = picks.map(i=>`${GX.seats[i].name}→${GX.seats[choices[i]].name}`).join(" / ");
  if(converge !== null){
    $("msg-gx").innerHTML = `<b>${GX.seats[converge].name}</b> 아~ 싸 홍삼! 🎉 다음 리더!`;
    GX.data.leader = converge;
  } else {
    $("msg-gx").textContent = "안 겹쳤다... 다시!";
  }
  gxSafeNext(()=>hongsamRound(GX), 1100);
}
