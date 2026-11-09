/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"gongchil", emj:"🎯", nm:"공공칠빵 (+침묵)", tg:"007빵식",
    intro:"공~공칠빵! 공공칠빵!",
    rules:["한 글자씩(<b>공-공-칠-빵</b>) 지목하며 턴을 넘겨!",
      "<b>내가 지목당하면</b> 다음 글자를 눌러!",
      "마지막 \"빵!\"을 맞으면 <b>양옆 두 사람</b>이 [😱으악!]",
      "내가 반응조면 으악!, 아니면 <b>가만히!</b>"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🎯 공공칠빵", start(GX){ gongchilRound(GX); } }
);

/* ---- 공공칠빵 (+침묵) ---- */
const GONGCHIL_SYL = ["공","공","칠","빵"];
function gongchilRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  GX.data.step = 0;
  GX.data.holder = rndOf([0,1,2,3]);
  gongchilStep(GX);
}
function gongchilStep(GX){
  if(!GX||GX.over) return;
  const syl = GONGCHIL_SYL[GX.data.step];
  const from = GX.data.holder;
  const target = gxPickTarget(from);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===from));
  $("gx-center").innerHTML = `<b>${GX.seats[from].name}</b> 👉 <b>${GX.seats[target].name}</b> "<b>${syl}!</b>"`;
  bubbleSay(GX.seats[from], syl+"!", 700); click('word'); hop(GX.seats[from]);
  const isLast = GX.data.step === GONGCHIL_SYL.length - 1;
  GX.data.holder = target;
  if(isLast){
    gxSafeNext(() => gongchilReact(GX, target), 500);
  } else if(target === 0){
    $("gx-controls").innerHTML = "";
    gxBtn(`다음! "${GONGCHIL_SYL[GX.data.step+1]}!"`, () => {
      GX.data.step++; gxClearTimer(); $("gx-controls").innerHTML="";
      gxSafeNext(()=>gongchilStep(GX), 200);
    });
    gxSetTimer(Math.max(900, 2200 - 60*GX.round), () => gxFail("글자를 못 넘겼다!", GX.round-1));
  } else {
    GX.data.step++;
    gxSafeNext(() => gongchilStep(GX), Math.max(350, 800-40*GX.round));
  }
}
function gongchilReact(GX, target){
  const group = seatNeighbors(target);
  const meIn = group.includes(0);
  $("gx-center").innerHTML = `<b>빵!</b> (맞은 사람: <b>${GX.seats[target].name}</b>) 양옆이 반응할 차례!`;
  group.forEach((i,k)=>{ if(i!==0) setTimeout(()=>{ if(GX&&!GX.over){ bubbleSay(GX.seats[i],"으악!!",900); hop(GX.seats[i]); } }, 200+k*120); });
  $("gx-controls").innerHTML = "";
  if(meIn){
    $("msg-gx").textContent = "너도 반응조다! [😱 으악!]";
    gxBtn("😱 으악!", () => { bubbleSay(GX.seats[0],"으악!!",900); click('word'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML=""; gxSafeNext(()=>gongchilRound(GX), 700); }, "btn-berry");
    gxSetTimer(Math.max(900, 2000-70*GX.round), () => gxFail("으악이 늦었다!", GX.round-1));
  } else {
    $("msg-gx").textContent = "너는 반응조가 아니다... 가만히!";
    const trapUntil = performance.now() + 1300;
    gxBtn("😱 으악!", () => { if(performance.now() < trapUntil) gxFail("너는 반응조가 아닌데?!", GX.round-1); }, "btn-berry");
    gxSafeNext(() => { $("gx-controls").innerHTML=""; gongchilRound(GX); }, 1400);
  }
}

})();
