/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"record", emj:"🎵", nm:"레코드 게임", tg:"릴레이·지식",
    intro:"레코드~ 레코드~ 칙칙폭폭!",
    rules:["아무 노래 <b>제목</b>이나 대며 릴레이!",
      "이미 나온 제목은 다시 말하면 안 돼.",
      "시간 초과되면 벌칙!",
      "가사가 아니라 <b>제목만</b> 말하면 돼."],
    recLabel: v => `제목 ${v}개`},
  /* 엔진 설정 */ { title:"🎵 레코드 게임", start(GX){ GX.data.used=new Set(); GX.data.turn=0; recordRound(GX); } }
);

/* ---- 레코드 게임 ---- */
const RECORD_TITLES = ["다이너마이트","봄날","작은 것들을 위한 시","벚꽃 엔딩","좋은 날","여행","밤편지","아로하","고백","안녕"];
function recordRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const cur = GX.data.turn;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===cur));
  if(cur===0){
    $("gx-center").innerHTML = "노래 제목을 하나 대라! (중복 불가, 가사 말고 제목만!)";
    $("gx-input-row").classList.remove("hidden");
    $("gx-input").value = "";
    $("gx-input").focus();
    gxSetTimer(Math.max(2500, 6000-GX.round*150), () => { $("gx-input-row").classList.add("hidden"); gxFail("시간 초과!", GX.round-1); });
  } else {
    $("gx-input-row").classList.add("hidden");
    const pool = RECORD_TITLES.filter(t=>!GX.data.used.has(t));
    const t = rndOf(pool.length?pool:RECORD_TITLES);
    GX.data.used.add(t);
    $("gx-center").innerHTML = `<b>${GX.seats[cur].name}</b>: "${t}!"`;
    bubbleSay(GX.seats[cur], t, 1000); click('word'); hop(GX.seats[cur]);
    GX.data.turn=(cur+1)%4;
    gxSafeNext(()=>recordRound(GX), 800);
  }
}

$("gx-say").addEventListener("click", () => {
  if(!GX || GX.over || GX.key !== "record") return;
  const raw = $("gx-input").value.trim();
  if(!raw) return;
  if(GX.data.used.has(raw)) return gxFail(`"${esc(raw)}"는 이미 나왔다!`, GX.round-1);
  GX.data.used.add(raw);
  bubbleSay(GX.seats[0], raw, 1000); click('word'); hop(GX.seats[0]);
  $("gx-input").value=""; $("gx-input-row").classList.add("hidden");
  gxClearTimer();
  GX.data.turn=(GX.data.turn+1)%4;
  gxSafeNext(()=>recordRound(GX), 500);
});
$("gx-input").addEventListener("keydown", e => { if(e.key==="Enter") $("gx-say").click(); });

})();
