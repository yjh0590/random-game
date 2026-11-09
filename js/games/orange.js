/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"orange", emj:"🍊", nm:"오렌지", tg:"리액션 릴레이",
    intro:"오렌지~ 오렌지~ 오렌지~ 오~",
    rules:["오렌지를 <b>점점 크게</b> 외치며 다음 사람에게 패스!",
      "내 차례엔 시간 안에 리액션 버튼을 눌러야 해.",
      "라운드가 갈수록 시간이 <b>점점 짧아져!</b> ⚡",
      "타이밍 놓치면 벌칙!"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🍊 오렌지", start(GX){ GX.data.passer=0; orangeRound(GX); } }
);

/* ---- 오렌지 ---- */
function orangeRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const bangs = "!".repeat(Math.min(8, GX.round));
  const from = GX.data.passer;
  const target = gxPickTarget(from);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===from));
  if(from === 0){
    $("gx-center").innerHTML = `네 차례! 오렌지를 더 크게 키워서 외쳐라!`;
    $("gx-controls").innerHTML="";
    gxBtn(`🍊 오렌지${bangs}`, () => {
      bubbleSay(GX.seats[0], "오렌지"+bangs, 900); click('word'); hop(GX.seats[0]);
      GX.data.passer = target; gxClearTimer(); $("gx-controls").innerHTML="";
      gxSafeNext(()=>orangeRound(GX), 500);
    });
    gxSetTimer(Math.max(700, 2600-90*GX.round), () => gxFail("리액션이 늦었다!", GX.round-1));
  } else {
    $("gx-center").innerHTML = `<b>${GX.seats[from].name}</b>: "오렌지${bangs}"`;
    bubbleSay(GX.seats[from], "오렌지"+bangs, 900); click('word'); hop(GX.seats[from]);
    GX.data.passer = target;
    gxSafeNext(()=>orangeRound(GX), Math.max(400, 900-30*GX.round));
  }
}

})();
