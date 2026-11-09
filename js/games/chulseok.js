/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"chulseok", emj:"📖", nm:"출석부", tg:"눈속임",
    intro:"출석부 출석부 출석부 출석부!",
    rules:["술래가 <b>이름</b>을 부르지만 손가락은 <b>다른 사람</b>을 가리켜!",
      "<b>이름이 불린 사람</b>만 대답해야 해. 손가락에 속지 마!",
      "이름 안 불렸는데 대답하거나, 불렸는데 못 하면 벌칙!",
      "시간이 <b>점점 짧아져!</b> ⚡"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"📖 출석부", start(GX){ chulseokRound(GX); } }
);

/* ---- 출석부 ---- */
function chulseokRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const caller = rndOf([0,1,2,3]);
  const calledName = gxPickTarget(caller);
  const pointedAt = gxPickTarget(caller);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===caller));
  $("gx-center").innerHTML = `<b>${GX.seats[caller].name}</b>: (손가락은 <b>${GX.seats[pointedAt].name}</b> 쪽!) "<b>${GX.seats[calledName].name}</b>!"`;
  bubbleSay(GX.seats[caller], GX.seats[calledName].name+"!", 1100); click('word'); hop(GX.seats[caller]);
  $("gx-controls").innerHTML="";
  const meCalled = calledName===0;
  if(meCalled){
    $("msg-gx").textContent = "네 이름이 불렸다! (손가락 방향 말고 이름을 봐!) [네!]";
    gxBtn("🙋 네!", () => { bubbleSay(GX.seats[0],"네!",900); click('word'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML=""; gxSafeNext(()=>chulseokRound(GX), 600); });
    gxSetTimer(Math.max(1000, 2600-70*GX.round), () => gxFail("이름 불렸는데 대답을 못 했다!", GX.round-1));
  } else {
    $("msg-gx").textContent = "이름이 안 불렸다... (손가락에 속지 마라) 가만히!";
    const trapUntil = performance.now() + 1300;
    gxBtn("🙋 네!", () => { if(performance.now()<trapUntil) gxFail("네 이름 아닌데 대답했다!", GX.round-1); });
    gxSafeNext(() => { $("gx-controls").innerHTML=""; chulseokRound(GX); }, 1400);
  }
}

})();
