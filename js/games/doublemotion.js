registerGxGame(
  {key:"doublemotion", emj:"🔁", nm:"이중모션", tg:"동작·순발력",
    intro:"아이엠 그라운드! 이중모션!",
    rules:["내 차례엔 동작 <b>두 개를 연달아</b> 선택!",
      "고른 뒤 다음 사람을 지목해서 넘겨!",
      "시간 안에 못 고르면 벌칙!",
      "템포가 <b>점점 빨라져!</b> ⚡"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🔁 이중모션", start(GX){ GX.data.holder=0; dmRound(GX); } }
);

/* ---- 25. 이중모션 ---- */
const DM_GESTURES = ["🙆","🙅","🤟","😎"];
function dmRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const holder = GX.data.holder;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===holder));
  if(holder===0){
    $("gx-center").innerHTML = "네 차례! 동작 두 개를 연달아 선택!";
    $("gx-controls").innerHTML="";
    GX.data.picked=[];
    DM_GESTURES.forEach(g => gxBtn(g, () => {
      GX.data.picked.push(g); click('thumb'); hop(GX.seats[0]);
      if(GX.data.picked.length>=2){
        gxClearTimer(); $("gx-controls").innerHTML="";
        bubbleSay(GX.seats[0], GX.data.picked.join(""), 900);
        dmPickTarget(GX);
      }
    }));
    gxSetTimer(Math.max(900,2400-70*GX.round), () => gxFail("동작이 느렸다!", GX.round-1));
  } else {
    gxSafeNext(() => {
      bubbleSay(GX.seats[holder], rndOf(DM_GESTURES)+rndOf(DM_GESTURES), 900); hop(GX.seats[holder]); click('thumb');
      GX.data.holder = gxPickTarget(holder);
      gxSafeNext(()=>dmRound(GX), 500);
    }, 700);
  }
}
function dmPickTarget(GX){
  $("gx-center").innerHTML = "누구에게 넘길까?";
  [1,2,3].forEach(i => gxBtn(`👉 ${GX.seats[i].name}`, () => { GX.data.holder=i; gxSafeNext(()=>dmRound(GX), 400); }));
}
