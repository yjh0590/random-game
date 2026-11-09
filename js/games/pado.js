/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"pado", emj:"🌊", nm:"파도게임", tg:"웃참",
    intro:"어디서... 파도소리 안 들리세요?",
    rules:["손과 입으로 파도를 만들며 <b>왼쪽 또는 오른쪽</b>으로 보내!",
      "내 차례엔 시간 안에 방향을 골라야 해.",
      "웃참... 인데 실은 <b>타이밍 싸움</b> 🤫",
      "시간이 <b>점점 짧아져!</b> ⚡"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🌊 파도게임", start(GX){ GX.data.idx=0; padoRound(GX); } }
);

/* ---- 파도게임 (웃참) ---- */
function padoRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const cur = GX.data.idx;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===cur));
  if(cur===0){
    $("gx-center").innerHTML = "어디서... 파도 소리가...? 웃참!";
    $("gx-controls").innerHTML="";
    gxBtn("🌊 왼쪽으로", () => { GX.data.idx=(cur+3)%4; resolvePado(GX); });
    gxBtn("🌊 오른쪽으로", () => { GX.data.idx=(cur+1)%4; resolvePado(GX); });
    gxSetTimer(Math.max(900, 2800-80*GX.round), () => gxFail("파도를 놓쳤다! 풉 웃참 실패!", GX.round-1));
  } else {
    const dir = Math.random()<0.5 ? 1 : 3;
    GX.data.idx = (cur+dir)%4;
    $("gx-center").innerHTML = `<b>${GX.seats[cur].name}</b>: "처얼썩~"`;
    bubbleSay(GX.seats[cur], "처얼썩~", 800); click('clap'); hop(GX.seats[cur]);
    gxSafeNext(()=>padoRound(GX), Math.max(350, 750-GX.round*15));
  }
}
function resolvePado(GX){ gxClearTimer(); $("gx-controls").innerHTML=""; gxSafeNext(()=>padoRound(GX), 300); }

})();
