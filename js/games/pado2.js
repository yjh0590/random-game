registerGxGame(
  {key:"pado2", emj:"🏄", nm:"파도게임 (단체)", tg:"복불복·왕게임",
    intro:"파도가 친다~ 짝짝짝짝!",
    rules:["리더가 <b>파도의 방향과 양</b>을 정해서 지시!",
      "그 방향 순서대로 다같이 술잔을 비운다.",
      "내가 리더면 시간 안에 지시를 내려야 해.",
      "리더는 매 라운드 랜덤으로 바뀐다."],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🏄 파도게임 (단체)", start(GX){ pado2Round(GX); } }
);

/* ---- 27. 파도게임 (단체 잔 비우기) ---- */
function pado2Round(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const leader = rndOf([0,1,2,3]);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===leader));
  $("gx-controls").innerHTML="";
  if(leader===0){
    $("gx-center").innerHTML = "네가 리더다! 파도를 지시하라!";
    gxBtn("🌊 왼쪽으로 반 잔!", () => resolvePado2(GX, "왼쪽으로 반 잔", 0));
    gxBtn("🌊 오른쪽으로 한 잔!", () => resolvePado2(GX, "오른쪽으로 한 잔", 0));
    gxSetTimer(Math.max(1000,2800-80*GX.round), () => gxFail("지시를 못 내렸다!", GX.round-1));
  } else {
    const o = rndOf(["왼쪽으로 반 잔","오른쪽으로 한 잔","전체 원샷 파도"]);
    gxSafeNext(() => resolvePado2(GX, o, leader), 900);
  }
}
function resolvePado2(GX, order, leader){
  gxClearTimer(); $("gx-controls").innerHTML="";
  $("gx-center").innerHTML = `<b>${GX.seats[leader].name}</b>: "${order} 파도!" 🌊`;
  bubbleSay(GX.seats[leader], "파도!", 900); click('word'); hop(GX.seats[leader]);
  $("msg-gx").textContent = "다같이 파도 이행 중...";
  gxSafeNext(()=>pado2Round(GX), 1000);
}
