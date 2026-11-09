/* 고래: 5개부터 8박자 + 한 박에 "고래고래" 2개씩 (⑧박부터 뒤에서 역순 배치) */
function patWhale(n){
  if(n <= 4){ const a = Array(4).fill(0); for(let b=4-n;b<4;b++) a[b]=1; return a; }
  const a = Array(8).fill(0);
  const pairs = Math.floor(n/2), odd = n%2;
  let b = 8;
  for(let k=0;k<pairs;k++){ a[--b] = 2; }
  if(odd) a[--b] = 1;
  return a;
}
registerRhythmGame(
  {key:"whale", emj:"🐋", nm:"고래 게임", tg:"리듬·더블",
    intro:"고오래~ 고래 고래 으쌰 으쌰 으쌰 으쌰!",
    rules:["4박자 모션에서 <b>고래</b>를 개수만큼! (④박부터 거꾸로)",
      "5개부터는 <b>8박자로 확장</b> + 한 박자에 <b>\"고래고래\" 2개씩</b> 쪼개서 빠르게!",
      "분홍 칸 = 고래고래(2연타), 노란 칸 = 고래(1번)",
      "턴마다 <b>점점 빨라져!</b> ⚡ 놓치면 마셔~ 🍺"],
    recLabel: v => `${v}턴 생존`},
  /* 리듬 설정 */
  { title:"🐋 고래 게임", bpm:92, tap:"고래!",
    word: i => "고래", pat: patWhale,
    intro:["고오래~","고래","고래","으쌰","으쌰","으쌰","으쌰","·",
           "고오래~","고래","고래","으쌰","으쌰","으쌰","으쌰","·"] }
);
