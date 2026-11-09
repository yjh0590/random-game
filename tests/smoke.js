/* 스모크 테스트 (브라우저 쪽) — tests/run.js가 index.html에 끼워 넣어 실행한다.
   모든 게임을 하나씩 시작 → 6초(가상 시간) 진행 → 그 화면의 "← 메뉴" 버튼 클릭.
   중간에 난 JS 오류와 이상 동작을 모아 <pre id="SMOKE">에 적는다. */
(() => {
  const errs = [];
  let cur = "load";
  window.addEventListener("error", e => {
    errs.push(`${cur}: ${e.message} @${(e.filename || "").split("/").pop()}:${e.lineno}`);
  });
  const visibleScreen = () => [...document.querySelectorAll(".screen")].find(s => !s.classList.contains("hidden"));

  window.addEventListener("load", () => {
    try{ $("name-input").value = "테<b>스트"; enter(); }catch(e){ errs.push("enter: " + e.message); }
    const keys = GAMES.map(g => g.key);
    let i = 0;
    setTimeout(function next(){
      if(i > 0){
        const sc = visibleScreen();
        const back = sc && sc.querySelector("[data-menu]");
        if(!back) errs.push(`${cur}: 메뉴 버튼 없음 (보이는 화면: ${sc && sc.id})`);
        else {
          back.click();
          if($("menu-screen").classList.contains("hidden")) errs.push(`${cur}: 메뉴로 안 돌아감`);
        }
      }
      if(i >= keys.length) return report(keys.length);
      cur = keys[i++];
      try{
        launchGame(cur);
        const sc = visibleScreen();
        if(!sc || sc.id === "menu-screen") errs.push(`${cur}: 게임 화면이 안 열림`);
        const linePick = sc && sc.querySelector("[data-line]");   // 지하철: 노선 고르기
        if(linePick) linePick.click();
      }catch(e){ errs.push(`${cur} 시작: ${e.message}`); }
      setTimeout(next, 6000);
    }, 4000);
  });

  function report(n){
    if(/[<>]/.test(playerName)) errs.push(`이름에 태그 문자가 남음: ${playerName}`);
    const out = document.createElement("pre");
    out.id = "SMOKE";
    out.textContent = [`GAMES=${n} SCREENS=${document.querySelectorAll(".screen").length}`,
      `ERRORS=${errs.length}`, ...errs].join("\n");
    document.body.appendChild(out);
  }
})();
