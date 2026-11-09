/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"hunmin", emj:"🔤", nm:"훈민정음", tg:"단어 순발력",
    intro:"훈~민정음 훈~민정음!",
    rules:["술래가 외친 <b>자음 두 개</b>로 시작하는 단어를 대라!",
      "칩 중에 맞는 단어를 <b>시간 안에</b> 골라야 해.",
      "이미 나온 단어, 틀린 자음 단어 = 탈락!",
      "시간이 <b>점점 짧아져!</b> ⚡"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🔤 훈민정음", start(GX){ GX.data.used=new Set(); hunminRound(GX); } }
);

/* ---- 훈민정음 ---- */
const HUNMIN_BANK = {
  "ㄱㅂ": ["가방","고비","구비"],
  "ㅂㅈ": ["바지","부자","보증"],
  "ㅅㄱ": ["사과","소고기","시금치"],
  "ㅁㅊ": ["미치광이","무침","마차"],
  "ㅇㅅ": ["의사","연습","우산"],
  "ㅎㅅ": ["학생","호수","화살"]
};
function hunminRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const combo = rndOf(Object.keys(HUNMIN_BANK));
  $("gx-center").innerHTML = `술래: "<b>${combo}</b>!" 엄지를 세웠다... 시작하는 단어를 외쳐라!`;
  $("gx-controls").innerHTML = "";
  const validPool = HUNMIN_BANK[combo].filter(w=>!GX.data.used.has(w));
  if(!validPool.length) return gxFail("이 자음으로 만들 단어가 바닥났다!", GX.round-1);
  const trapPool = Object.values(HUNMIN_BANK).flat().filter(w=>!HUNMIN_BANK[combo].includes(w) && !GX.data.used.has(w));
  const chips = [...validPool.slice(0,2), ...trapPool.sort(()=>Math.random()-0.5).slice(0,2)].sort(()=>Math.random()-0.5);
  chips.forEach(w=>{
    gxBtn(w, () => {
      if(GX.data.used.has(w)) return gxFail(`"${w}"...는 이미 나온 단어다!`, GX.round-1);
      if(!HUNMIN_BANK[combo].includes(w)) return gxFail(`"${w}"는 ${combo} 단어가 아니잖아!`, GX.round-1);
      GX.data.used.add(w);
      bubbleSay(GX.seats[0], w+"!", 900); click('word'); hop(GX.seats[0]);
      gxClearTimer(); $("gx-controls").innerHTML="";
      $("msg-gx").textContent = "손 잡았다! 다음 라운드~";
      gxSafeNext(()=>hunminRound(GX), 600);
    }, "chip");
  });
  gxSetTimer(Math.max(1200, 3200 - 90*GX.round), () => gxFail("너무 늦었다! 손 잡혔다!", GX.round-1));
}

})();
