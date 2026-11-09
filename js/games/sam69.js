/* 이 파일의 함수·변수는 이 게임 안에서만 보인다 (다른 게임과 이름이 겹쳐도 안전) */
(() => {

registerGxGame(
  {key:"sam69", emj:"🔢", nm:"369게임", tg:"숫자·박수",
    intro:"369~ 369! 369~ 369!",
    rules:["1부터 순서대로 숫자를 하나씩 말해!",
      "숫자에 <b>3, 6, 9</b>가 들어간 자릿수만큼 <b>박수</b>로 대신해!",
      "말해야 할 때 박수 치거나, 박수 쳐야 할 때 말하면 탈락!",
      "속도가 <b>점점 빨라져!</b> ⚡"],
    recLabel: v => `숫자 ${v}까지`},
  /* 엔진 설정 */ { title:"🔢 369게임", start(GX){ GX.data.n=0; GX.data.turn=0; sam69Round(GX); } }
);
registerGxGame(
  {key:"ultra69", emj:"🌀", nm:"울트라 369게임", tg:"음절·박수·헬",
    intro:"369 369! 울트라 369!",
    rules:["숫자를 <b>하나 둘 셋...</b> 한 음절씩 끊어서 돌아가며 말해!",
      "3, 6, 9가 들어간 숫자의 음절은 <b>박수</b>로 대신!",
      "예: 여섯 → \"여\"도 짝, \"섯\"도 짝!",
      "속도가 <b>점점 빨라져!</b> ⚡ 뇌 정지 주의 🧠💥"],
    recLabel: v => `음절 ${v}개`},
  /* 엔진 설정 */ { title:"🌀 울트라 369게임", start(GX){ GX.data.idx=0; GX.data.turn=0; ultra69Round(GX); } }
);

/* ---- 369게임 · 울트라 369게임 ---- */
function digitsRestricted(n){ return String(n).split("").filter(d=>"369".includes(d)).length; }
const KOREAN_NUM = [
  {n:1,syl:["하","나"]},{n:2,syl:["둘"]},{n:3,syl:["셋"]},{n:4,syl:["넷"]},
  {n:5,syl:["다","섯"]},{n:6,syl:["여","섯"]},{n:7,syl:["일","곱"]},
  {n:8,syl:["여","덟"]},{n:9,syl:["아","홉"]},{n:10,syl:["열"]}
];
const ULTRA69_FLAT = [];
KOREAN_NUM.forEach(({n,syl}) => syl.forEach(s => ULTRA69_FLAT.push({text:s, clap: digitsRestricted(n)>0})));

function sam69Round(GX){
  if(!GX||GX.over) return;
  GX.data.n++;
  const n = GX.data.n;
  const need = digitsRestricted(n);
  const cur = GX.data.turn;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===cur));
  if(cur===0){
    $("gx-center").innerHTML = need ? `숫자 <b>${n}</b>! 짝을 <b>${need}번</b> 쳐라! (말하면 안 됨)` : `숫자 <b>${n}</b>! 그대로 말해라!`;
    $("gx-controls").innerHTML="";
    GX.data.claps = 0;
    if(need===0){
      gxBtn(`${n} 말하기!`, () => { click('word'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML=""; GX.data.turn=(cur+1)%4; gxSafeNext(()=>sam69Round(GX),400); });
    } else {
      const b = gxBtn(`짝! (0/${need})`, () => {
        GX.data.claps++; click('clap'); hop(GX.seats[0]);
        b.textContent = `짝! (${GX.data.claps}/${need})`;
        if(GX.data.claps>=need){ gxClearTimer(); $("gx-controls").innerHTML=""; GX.data.turn=(cur+1)%4; gxSafeNext(()=>sam69Round(GX),400); }
      });
    }
    gxSetTimer(Math.max(1000, 3000-40*n), () => gxFail(`${n}에서 막혔다!`, n-1));
  } else {
    $("gx-center").innerHTML = need ? `<b>${GX.seats[cur].name}</b>: ${"짝".repeat(need)}!` : `<b>${GX.seats[cur].name}</b>: ${n}!`;
    click(need? 'clap':'word'); hop(GX.seats[cur]);
    GX.data.turn=(cur+1)%4;
    gxSafeNext(()=>sam69Round(GX), Math.max(300, 600-n*6));
  }
}
function ultra69Round(GX){
  if(!GX||GX.over) return;
  const unit = ULTRA69_FLAT[GX.data.idx % ULTRA69_FLAT.length];
  GX.data.idx++;
  const cur = GX.data.turn;
  GX.seats.forEach((p,i)=>p.el.classList.toggle("turn", i===cur));
  if(cur===0){
    $("gx-center").innerHTML = unit.clap ? `이 음절은 <b>짝!</b>` : `음절: "<b>${unit.text}</b>"`;
    $("gx-controls").innerHTML="";
    if(unit.clap){
      gxBtn("짝!", () => { click('clap'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML=""; GX.data.turn=(cur+1)%4; gxSafeNext(()=>ultra69Round(GX),350); });
    } else {
      gxBtn(`"${unit.text}!"`, () => { click('word'); hop(GX.seats[0]); gxClearTimer(); $("gx-controls").innerHTML=""; GX.data.turn=(cur+1)%4; gxSafeNext(()=>ultra69Round(GX),350); });
    }
    gxSetTimer(Math.max(800, 2400-30*GX.data.idx), () => gxFail("음절을 놓쳤다!", GX.data.idx-1));
  } else {
    $("gx-center").innerHTML = `<b>${GX.seats[cur].name}</b>: ${unit.clap ? "짝!" : unit.text+"!"}`;
    click(unit.clap?'clap':'word'); hop(GX.seats[cur]);
    GX.data.turn=(cur+1)%4;
    gxSafeNext(()=>ultra69Round(GX), Math.max(280, 550-GX.data.idx*4));
  }
}

})();
