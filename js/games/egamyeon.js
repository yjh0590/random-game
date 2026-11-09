/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"egamyeon", emj:"🛒", nm:"~에 가면", tg:"기억력",
    intro:"시장에 가면! 시장에 가면!",
    rules:["장소에 있을 법한 물건을 <b>하나씩 누적</b>해서 말해!",
      "내 차례엔 <b>지금까지 나온 것들을 순서대로</b> 눌러야 해.",
      "순서가 틀리면 탈락! 다 맞히면 새 항목 하나 추가.",
      "목록이 길어질수록 어려워진다 🧠"],
    recLabel: v => `항목 ${v}개`},
  /* 엔진 설정 */ { title:"🛒 ~에 가면", start(GX){ GX.data.list=[]; egamyeonRound(GX); } }
);

/* ---- ~에 가면 ---- */
const EGAMYEON_THEME = { place:"시장", items:["사과","배","수박","참외","딸기","고구마","감자","양파","당근","오이","호박","무","배추","마늘"] };
function egamyeonRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const cur = (GX.round-1) % 4;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===cur));
  if(cur===0){
    if(!GX.data.list.length){
      const add = rndOf(EGAMYEON_THEME.items);
      GX.data.list.push(add);
      $("gx-center").innerHTML = `<b>${EGAMYEON_THEME.place}에 가면!</b>`;
      $("gx-controls").innerHTML="";
      bubbleSay(GX.seats[0], add+"!", 900); click('word'); hop(GX.seats[0]);
      gxSafeNext(()=>egamyeonRound(GX), 700);
      return;
    }
    $("gx-center").innerHTML = `<b>${EGAMYEON_THEME.place}에 가면!</b> 지금까지 나온 걸 순서대로 눌러!`;
    $("gx-controls").innerHTML="";
    const shuffled = [...GX.data.list].sort(()=>Math.random()-0.5);
    let expectIdx = 0;
    shuffled.forEach(item => {
      const b = gxBtn(item, () => {
        if(item !== GX.data.list[expectIdx]) return gxFail(`순서가 틀렸다! ("${item}")`, GX.data.list.length);
        b.disabled = true; expectIdx++;
        if(expectIdx >= GX.data.list.length){
          const pool = EGAMYEON_THEME.items.filter(w=>!GX.data.list.includes(w));
          const add = rndOf(pool.length?pool:EGAMYEON_THEME.items);
          GX.data.list.push(add);
          bubbleSay(GX.seats[0], add+"!", 900); click('word'); hop(GX.seats[0]);
          gxClearTimer();
          gxSafeNext(()=>egamyeonRound(GX), 700);
        }
      }, "chip");
    });
    gxSetTimer(Math.max(2500, 6000-GX.data.list.length*200), () => gxFail("기억이 안 난다!", GX.data.list.length));
  } else {
    const pool = EGAMYEON_THEME.items.filter(w=>!GX.data.list.includes(w));
    const add = rndOf(pool.length?pool:EGAMYEON_THEME.items);
    GX.data.list.push(add);
    $("gx-center").innerHTML = `<b>${GX.seats[cur].name}</b>: ${GX.data.list.join(", ")}...!`;
    bubbleSay(GX.seats[cur], add+"!", 900); click('word'); hop(GX.seats[cur]);
    gxSafeNext(()=>egamyeonRound(GX), 900);
  }
}

})();
