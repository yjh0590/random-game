registerGxGame(
  {key:"deathgame", emj:"💀", nm:"더 게임 오브 데쓰", tg:"손가락 체인",
    intro:"신이 난다~ 재미난다~ 더 게임 오브 데쓰!",
    rules:["다들 몰래 다른 사람을 손가락으로 가리켜!",
      "술래가 숫자를 외치면 손가락을 <b>그 숫자만큼</b> 따라간다!",
      "마지막에 걸린 사람이 벌칙!",
      "내가 술래면 숫자를 직접 골라."],
    recLabel: v => `${v}라운드 생존`},
  /* 엔진 설정 */ { title:"💀 더 게임 오브 데쓰", start(GX){ deathRound(GX); } }
);

/* ---- 26. 더 게임 오브 데쓰 ---- */
function deathRound(GX){
  if(!GX||GX.over) return;
  GX.round++;
  const pointers = [0,1,2,3].map(i => { const pool=[0,1,2,3].filter(x=>x!==i); return rndOf(pool); });
  const host = rndOf([0,1,2,3]);
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===host));
  $("gx-controls").innerHTML="";
  if(host===0){
    $("gx-center").innerHTML = "네가 술래다! 숫자를 외쳐라!";
    [3,5,7,9].forEach(n => gxBtn(`${n}!`, () => deathResolve(GX, pointers, host, n)));
    gxSetTimer(3200, () => gxFail("숫자를 못 골랐다!", GX.round-1));
  } else {
    const n = rndOf([3,5,7,9]);
    gxSafeNext(() => deathResolve(GX, pointers, host, n), 700);
  }
}
function deathResolve(GX, pointers, host, n){
  gxClearTimer(); $("gx-controls").innerHTML="";
  let cur = host;
  const path = [cur];
  for(let k=0;k<n;k++){ cur = pointers[cur]; path.push(cur); }
  $("gx-center").innerHTML = `<b>${GX.seats[host].name}</b>: "${n}!" 손가락을 따라간다...`;
  let step=0;
  const tick = () => {
    if(!GX||GX.over) return;
    GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===path[step]));
    if(step >= path.length-1){
      const loser = GX.seats[path[path.length-1]];
      if(loser.isHuman) return gxFail(`숫자 ${n}에 걸렸다!`, GX.round-1);
      $("msg-gx").innerHTML = `<b>${loser.name}</b> 걸렸다! 원샷~ 🍺`;
      click('fail'); shakeSeat(loser);
      gxSafeNext(()=>deathRound(GX), 1000);
      return;
    }
    step++;
    GX.timer = setTimeout(tick, 260);
  };
  tick();
}
