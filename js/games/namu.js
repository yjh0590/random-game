registerGxGame(
  {key:"namu", emj:"🌳", nm:"나무게임", tg:"체인 반응·헬",
    intro:"휘이 하아! 휘이 하아!",
    rules:["합장하고 내리치며 \"휘이 하아\"로 아무나 지목해서 넘겨!",
      "<b>지목받은 사람 + 양옆</b> 모두 같이 반응해서 진짜 대상이 헷갈려!",
      "내가 대상이면 다시 넘길 차례, 양옆이면 반응만!",
      "반응 늦거나 잘못하면 벌칙!"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🌳 나무게임", start(GX){ GX.data.passer=0; namuRound(GX); } }
);

/* ---- 19. 나무게임 ---- */
function namuRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const from = GX.data.passer;
  if(from===0){
    $("gx-center").innerHTML = `네 차례! (합장) "휘이 하아!" 누구에게 보낼까?`;
    $("gx-controls").innerHTML="";
    [1,2,3].forEach(i=>gxBtn(`🌳 ${GX.seats[i].name}`, ()=>namuPass(GX,0,i)));
    gxSetTimer(Math.max(1200,3000-80*GX.round), () => gxFail("너무 오래 고민했다!", GX.round-1));
  } else {
    gxSafeNext(() => namuPass(GX, from, gxPickTarget(from)), 800);
  }
}
function namuPass(GX, from, target){
  gxClearTimer(); $("gx-controls").innerHTML="";
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===from));
  $("gx-center").innerHTML = `<b>${GX.seats[from].name}</b> (내리치며) "휘이 하아!" 👉 <b>${GX.seats[target].name}</b> 쪽!`;
  bubbleSay(GX.seats[from], "휘이 하아!", 900); click('word'); hop(GX.seats[from]);
  const group = [target, ...seatNeighbors(target)].filter(i=>i!==from);
  const meIn = group.includes(0);
  const iAmTarget = target===0;
  gxSafeNext(() => {
    group.forEach((i,k)=>{ if(i!==0) setTimeout(()=>{ if(GX&&!GX.over){ bubbleSay(GX.seats[i],"휘이 하아!",900); hop(GX.seats[i]); } }, k*100); });
    if(meIn){
      $("msg-gx").textContent = "다 같이 반응! [🪓 휘이 하아!]";
      gxBtn("🪓 휘이 하아!", () => {
        bubbleSay(GX.seats[0],"휘이 하아!",900); click('word'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML="";
        GX.data.passer = iAmTarget ? 0 : target;
        gxSafeNext(()=>namuRound(GX), 500);
      });
      gxSetTimer(Math.max(800,1800-50*GX.round), () => gxFail("반응이 늦었다!", GX.round-1));
    } else {
      $("msg-gx").textContent = "너는 해당 없다... 가만히!";
      const trapUntil = performance.now()+1100;
      gxBtn("🪓 휘이 하아!", () => { if(performance.now()<trapUntil) gxFail("네 차례가 아닌데?!", GX.round-1); });
      GX.data.passer = target;
      gxSafeNext(() => { $("gx-controls").innerHTML=""; namuRound(GX); }, 1200);
    }
  }, 500);
}
