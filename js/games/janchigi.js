registerGxGame(
  {key:"janchigi", emj:"🍶", nm:"잔치기", tg:"방향 조작",
    intro:"잔치기 잔치기 짠짠짠!",
    rules:["잔을 치는 횟수로 신호를 줘: <b>1번</b>=진행 / <b>2번</b>=역방향 / <b>3번</b>=점프!",
      "내 차례엔 시간 안에 몇 번 칠지 골라야 해.",
      "시간이 <b>점점 짧아져!</b> ⚡",
      "타이밍 놓치면 벌칙!"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🍶 잔치기", speed:false, start(GX){ GX.data.idx=0; GX.data.dir=1; janchigiRound(GX); } }
);
registerGxGame(
  {key:"janchigi2", emj:"⚡", nm:"잔치기 (스피드)", tg:"방향 조작·헬",
    intro:"잔치기 잔치기 잔잔치기!",
    rules:["잔치기와 규칙은 같지만 <b>훨씬 빠르게</b> 진행돼!",
      "1번=진행 / 2번=역방향 / 3번=점프!",
      "반사신경 테스트 🔥",
      "타이밍 놓치면 벌칙!"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"⚡ 잔치기 (스피드)", speed:true, start(GX){ GX.data.idx=0; GX.data.dir=1; janchigiRound(GX); } }
);

/* ---- 17/30. 잔치기 (+ 스피드 변형) ---- */
function janchigiStep(GX, n){
  const len=4;
  if(n===2) GX.data.dir *= -1;
  const step = (n===3) ? 2 : 1;
  GX.data.idx = ((GX.data.idx + GX.data.dir*step) % len + len) % len;
}
function janchigiRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const cur = GX.data.idx;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===cur));
  const baseLimit = GX.cfg.speed ? 1600 : 3200;
  const decay = GX.cfg.speed ? 40 : 90;
  if(cur===0){
    $("gx-center").innerHTML = `네 차례! 잔을 몇 번 칠까?`;
    $("gx-controls").innerHTML="";
    gxBtn("탁 (진행)", () => { janchigiStep(GX,1); resolveJanchigi(GX); });
    gxBtn("탁탁 (역방향)", () => { janchigiStep(GX,2); resolveJanchigi(GX); });
    gxBtn("탁탁탁 (점프)", () => { janchigiStep(GX,3); resolveJanchigi(GX); });
    gxSetTimer(Math.max(900, baseLimit-decay*GX.round), () => gxFail("타이밍을 놓쳤다!", GX.round-1));
  } else {
    const n = rndOf([1,1,2,3]);
    $("gx-center").innerHTML = `<b>${GX.seats[cur].name}</b>: ${"탁".repeat(n)}!`;
    click('knee'); hop(GX.seats[cur]);
    gxSafeNext(() => { janchigiStep(GX,n); resolveJanchigi(GX); }, Math.max(300, 700-GX.round*15));
  }
}
function resolveJanchigi(GX){ gxClearTimer(); $("gx-controls").innerHTML=""; gxSafeNext(()=>janchigiRound(GX), 300); }
