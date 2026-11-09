/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"mecanderv", emj:"🤖", nm:"메칸더 V", tg:"동작 매칭",
    intro:"메칸더~ V! 메칸더~ V!",
    rules:["세 동작 중 하나: <b>메(X)</b> / <b>칸더(어깨)</b> / <b>V(앞으로)</b>",
      "선창자가 외친 동작과 <b>같은 동작</b>을 하면 탈락!",
      "선창자와 <b>다른 동작</b>을 시간 안에 골라야 해.",
      "시간이 <b>점점 짧아져!</b> ⚡"],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"🤖 메칸더 V", start(GX){ mecanderRound(GX); } }
);

/* ---- 메칸더 V ---- */
const MECANDER = [{k:"me",label:"메 (X자)",emj:"✖️"},{k:"kander",label:"칸더 (어깨)",emj:"🙆"},{k:"v",label:"V (앞으로)",emj:"✌️"}];
function mecanderRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const caller = rndOf([1,2,3]);
  const g = rndOf(MECANDER);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===caller));
  $("gx-center").innerHTML = `<b>${GX.seats[caller].name}</b>: "${g.label}!" ${g.emj}`;
  bubbleSay(GX.seats[caller], g.label, 1000); click('word'); hop(GX.seats[caller]);
  $("gx-controls").innerHTML="";
  $("msg-gx").textContent = "같은 동작을 하면 마신다! 다른 동작을 골라라!";
  MECANDER.forEach(opt => gxBtn(`${opt.emj} ${opt.label}`, () => {
    gxClearTimer(); $("gx-controls").innerHTML="";
    if(opt.k === g.k) return gxFail(`${g.label}! 캐스터한테 걸렸다!`, GX.round-1);
    click('word');
    gxSafeNext(()=>mecanderRound(GX), 600);
  }, "chip"));
  gxSetTimer(Math.max(900, 2400-70*GX.round), () => gxFail("동작을 못 골랐다!", GX.round-1));
}

})();
