/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"apart", emj:"🏢", nm:"아파트", tg:"복불복 리빌",
    intro:"아~파트 아파트, 아~파트 아파트!",
    rules:["술래가 외친 <b>층수</b>만큼 손을 하나씩 뺀다!",
      "[손 빼기 시작!]을 누르면 순서대로 손이 빠져나가.",
      "층수에 걸린 손의 주인이 벌칙!",
      "라운드마다 층수가 랜덤으로 바뀐다."],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🏢 아파트", start(GX){ apartRound(GX); } }
);

/* ---- 아파트 ---- */
function apartRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const floor = 8 + Math.floor(Math.random()*13);
  $("gx-center").innerHTML = `술래: "<b>${floor}층!</b>" 손을 겹쳐 쌓았다...`;
  $("gx-controls").innerHTML = "";
  $("msg-gx").textContent = "손을 하나씩 뺀다...";
  gxBtn("✋ 손 빼기 시작!", () => {
    $("gx-controls").innerHTML = "";
    let count = 0;
    const startIdx = Math.floor(Math.random()*4);
    const tick = () => {
      if(!GX||GX.over) return;
      count++;
      const idx = (startIdx + count - 1) % 4;
      GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===idx));
      if(count >= floor){
        const loser = GX.seats[idx];
        if(loser.isHuman) return gxFail(`${floor}층에 걸렸다!`, GX.round-1);
        $("msg-gx").innerHTML = `<b>${loser.name}</b> 손이 걸렸다! 원샷~ 🍺`;
        click('fail'); shakeSeat(loser);
        gxSafeNext(()=>apartRound(GX), 1000);
        return;
      }
      GX.timer = setTimeout(tick, Math.max(70, 260 - count*4));
    };
    tick();
  });
}

})();
