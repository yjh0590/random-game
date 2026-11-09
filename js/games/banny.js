/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"banny", emj:"🐰", nm:"바니바니", tg:"체인 반응",
    intro:"바니바니 바니바니~",
    rules:["\"바니바니\"를 외치며 아무나 지목해서 넘겨!",
      "지목받은 사람의 <b>양옆</b>이 [🥕 당근당근!]",
      "내가 양옆이면 반응, 지목당하면 다시 내가 넘길 차례!",
      "반응 늦거나 잘못 반응하면 벌칙!"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🐰 바니바니", start(GX){ GX.data.passer=0; bannyRound(GX); } }
);

/* ---- 바니바니 ---- */
function bannyRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const from = GX.data.passer;
  if(from === 0){
    $("gx-center").innerHTML = `네 차례! "바니바니 바니바니~" 누구에게 넘길까?`;
    $("gx-controls").innerHTML = "";
    [1,2,3].forEach(i => gxBtn(`🐰 ${GX.seats[i].name}`, () => bannyPass(GX, 0, i)));
    gxSetTimer(Math.max(1200, 3000-80*GX.round), () => gxFail("너무 오래 고민했다!", GX.round-1));
  } else {
    gxSafeNext(() => bannyPass(GX, from, gxPickTarget(from)), 800);
  }
}
function bannyPass(GX, from, target){
  gxClearTimer(); $("gx-controls").innerHTML="";
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===from));
  $("gx-center").innerHTML = `<b>${GX.seats[from].name}</b> "바니바니 바니바니~" 👉 <b>${GX.seats[target].name}</b>!`;
  bubbleSay(GX.seats[from], "바니바니!", 900); click('word'); hop(GX.seats[from]);
  GX.data.passer = target;
  const neighbors = seatNeighbors(target);
  const meIn = neighbors.includes(0);
  gxSafeNext(() => {
    neighbors.forEach((i,k)=>{ if(i!==0) setTimeout(()=>{ if(GX&&!GX.over){ bubbleSay(GX.seats[i],"당근당근!",900); hop(GX.seats[i]); } }, k*120); });
    if(meIn){
      $("msg-gx").textContent = "네가 양옆이다! [🥕 당근당근!]";
      gxBtn("🥕 당근당근!", () => { bubbleSay(GX.seats[0],"당근당근!",900); click('word'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML=""; gxSafeNext(()=>bannyRound(GX), 500); });
      gxSetTimer(Math.max(800, 1800-50*GX.round), () => gxFail("당근당근을 놓쳤다!", GX.round-1));
    } else {
      $("msg-gx").textContent = "너는 양옆이 아니다... 가만히!";
      const trapUntil = performance.now()+1100;
      gxBtn("🥕 당근당근!", () => { if(performance.now()<trapUntil) gxFail("네 차례가 아닌데?!", GX.round-1); });
      gxSafeNext(() => { $("gx-controls").innerHTML=""; bannyRound(GX); }, 1200);
    }
  }, 500);
}

})();
