/* ================= 소리: 합성 악기 + 입장 구호 =================
   외부 음원 없이 Web Audio로 직접 만든다. audio()는 core.js에 있다. */

/* 모든 소리는 bus()로 → 컴프레서로 묶어서 겹쳐도 찢어지지 않게 */
let BUS = null, NOISE = null;
function bus(){
  if(!BUS){
    const ctx = audio();
    BUS = ctx.createDynamicsCompressor();
    BUS.threshold.value = -14; BUS.ratio.value = 4;
    BUS.connect(ctx.destination);
  }
  return BUS;
}
function noiseBuf(){
  if(!NOISE){
    const ctx = audio();
    NOISE = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = NOISE.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
  }
  return NOISE;
}
/* 잡음 한 방: type/freq 필터를 거쳐 dur초 동안 줄어든다 */
function noiseHit(t, dur, type, freq, gain, q = 1){
  const ctx = audio();
  const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = noiseBuf();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(bus());
  src.start(t, Math.random()*0.5); src.stop(t + dur + 0.02);
}
function sKick(t, gain = 0.9){
  const ctx = audio();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  o.connect(g).connect(bus());
  o.start(t); o.stop(t + 0.3);
}
/* 박수: 여러 손이 살짝 어긋나게 → "짝!" */
function sClap(t, gain = 0.55){
  [0, 0.011, 0.022].forEach(d => noiseHit(t + d, 0.03, "bandpass", 1400, gain, 0.8));
  noiseHit(t + 0.03, 0.16, "bandpass", 1200, gain*0.6, 0.6);
}
function sHat(t, gain = 0.12){ noiseHit(t, 0.045, "highpass", 7000, gain); }
function sSnare(t, gain = 0.35){ noiseHit(t, 0.11, "bandpass", 1900, gain, 0.7); }
/* 밝은 음 하나 (삼각파 + 살짝 사각파 = 장난감 신스 느낌) */
function sTone(t, freq, dur, gain = 0.12){
  const ctx = audio();
  [["triangle", 1], ["square", 0.25]].forEach(([type, mix]) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain * mix, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(bus());
    o.start(t); o.stop(t + dur + 0.02);
  });
}
/* 팡파레: 도-미-솔-도 올라가는 장조 화음 + 우르르 박수 (잡음 함성은 으스스해서 안 씀) */
function sCheer(t){
  [523, 659, 784, 1047].forEach((f, i) => sTone(t + i*0.06, f, 0.5, 0.1));
  [523, 659, 784, 1047].forEach(f => sTone(t + 0.26, f, 0.9, 0.07));
  for(let i=0;i<16;i++) sClap(t + Math.random()*0.9, 0.12 + Math.random()*0.18);
}

/* ---- 입장 구호: "○○이가 좋아하는~ 랜덤 게임~ 랜덤 게임~ 무슨 게임? 게임 스타트!" ----
   목소리는 Electron(main.js)이 음높이 5단계로 녹음해 준다 → 7겹으로 겹쳐서 여러 명이 외치는 느낌.
   브라우저로 열었을 때는 그게 없으니 기본 TTS 한 목소리로 대신한다. */
const CHANT_BPM = 138;
function josaIga(name){   // 받침 있으면 "이가", 없으면 "가"
  const c = name.charCodeAt(name.length - 1);
  if(c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? "이가" : "가";
  return "이가";
}
async function loadChantVoices(texts){
  if(!window.native || !window.native.chantVoices) return null;
  try{
    const raw = await Promise.race([
      window.native.chantVoices(texts),
      new Promise(r => setTimeout(() => r(null), 3500)),   // 너무 오래 걸리면 목소리 없이 간다
    ]);
    if(!raw) return null;
    const ctx = audio();
    return await Promise.all(raw.map(layers => layers && Promise.all(layers.map(u8 =>
      ctx.decodeAudioData(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength))))));
  }catch(e){ return null; }
}
/* 사람 5명: [음높이 단계, 빠르기, 늦게 들어오기(초), 좌우 위치, 크기]
   밝게: 보통~높은 음 위주, 빠르기·타이밍 차이는 아주 조금만 (많이 어긋나면 메아리처럼 으스스해짐) */
const CROWD = [[1, 1.00, 0.000, 0, 1], [2, 1.02, 0.010, -0.45, 0.9], [3, 1.00, 0.018, 0.45, 0.8],
               [2, 0.99, 0.006, 0.2, 0.7], [0, 1.00, 0.014, -0.2, 0.45]];
/* TTS 녹음은 앞뒤에 무음이 붙어 있다 → 실제 말소리 구간 [시작, 길이](초)만 쓴다 */
const SPEECH = new WeakMap();
function speechSpan(buf){
  if(!SPEECH.has(buf)){
    const d = buf.getChannelData(0);
    let a = 0, z = d.length - 1;
    while(a < z && Math.abs(d[a]) < 0.025) a++;
    while(z > a && Math.abs(d[z]) < 0.025) z--;
    SPEECH.set(buf, [a / buf.sampleRate, Math.max(0.05, (z - a) / buf.sampleRate + 0.04)]);
  }
  return SPEECH.get(buf);
}
function crowdSay(layers, t, slotSec, gain = 0.5){
  const ctx = audio();
  const fit = Math.max(1, speechSpan(layers[2])[1] / (slotSec * 0.9));   // 자리보다 길면 다 같이 빨리
  CROWD.forEach(([lv, rate, delay, pan, vol]) => {
    const src = ctx.createBufferSource(), g = ctx.createGain(), p = ctx.createStereoPanner();
    const [from, len] = speechSpan(layers[lv]);
    src.buffer = layers[lv];
    src.playbackRate.value = rate * fit;
    g.gain.value = gain * vol;
    p.pan.value = pan;
    src.connect(g).connect(p).connect(bus());
    src.start(t + delay, from, len);
  });
}
function speakFallback(text){
  try{
    if(!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR"; u.rate = 1.4; u.pitch = 1.2;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){}
}
/* ---- 직접 녹음한 구호 (sounds/chant.mp3) ----
   있으면 이걸 틀고, 못 읽으면(브라우저로 직접 연 경우 등) 아래 TTS 구호로 대신한다 */
const CHANT_REC = {
  file: "sounds/chant.mp3",
  /* 아래 시각(초)은 녹음의 소리 크기를 재서 찾은 값 — 다시 녹음하면 같이 고칠 것 */
  lines: [0.28, 2.70, 3.42, 4.30, 5.10],   // 화면 글자 5줄이 바뀌는 시각
  nameCut: [0.28, 1.12],                   // 녹음 속 "수정이가" 구간 → nameSay(TTS)로 바꿔 끼운다
  nameSay: "아무개가",
};
/* 남자애들 셋이 같이 외치는 느낌: 음을 내린 3겹 [음높이 배율, 늦게 들어오기(초), 좌우, 크기]
   1 = 원래 목소리, 0.75 ≈ 반음 5개 아래 */
const CHANT_VOICES = [[0.75, 0.000, 0, 0.6], [0.70, 0.014, -0.4, 0.5], [0.80, 0.008, 0.4, 0.45]];
let chantRec;               // undefined = 아직 안 읽음, null = 없음, 그 외 Promise<버퍼 3겹>
function loadRecording(){
  if(chantRec === undefined) chantRec = (async () => {
    try{
      const r = await fetch(CHANT_REC.file);
      if(!r.ok) return null;
      const buf = await spliceName(await audio().decodeAudioData(await r.arrayBuffer()));
      return CHANT_VOICES.map(([p]) => pitchShift(buf, p));
    }catch(e){ return null; }
  })();
  return chantRec;
}
/* 녹음 속 이름 구간을 지우고 TTS로 만든 nameSay를 그 자리에 넣는다 (TTS가 없으면 녹음 그대로) */
async function spliceName(buf){
  const v = await loadChantVoices([CHANT_REC.nameSay]);
  const say = v && v[0] && v[0][2];
  if(!say) return buf;
  const sr = buf.sampleRate, out = audio().createBuffer(buf.numberOfChannels, buf.length, sr);
  const a = Math.round(CHANT_REC.nameCut[0] * sr), b = Math.round(CHANT_REC.nameCut[1] * sr);
  const fade = Math.round(sr * 0.03);
  const [from, len] = speechSpan(say);
  const sd = say.getChannelData(0), s0 = Math.round(from * say.sampleRate);
  const rate = Math.max(1, len / ((b - a) / sr)) * say.sampleRate / sr;   // 자리보다 길면 살짝 빨리
  const n = Math.min(b - a, Math.floor((len * say.sampleRate) / rate));
  const rms = (d, i0, i1) => { let e = 0; for(let i=i0;i<i1;i++) e += d[i]*d[i]; return Math.sqrt(e / Math.max(1, i1 - i0)); };
  for(let ch = 0; ch < buf.numberOfChannels; ch++){
    const x = buf.getChannelData(ch), o = out.getChannelData(ch);
    o.set(x);
    const gain = rms(x, a, b) / Math.max(1e-4, rms(sd, s0, s0 + Math.round(len * say.sampleRate)));
    for(let i = a - fade; i < b + fade; i++){   // 원래 이름: 부드럽게 줄였다가 다시 키움
      if(i < 0 || i >= o.length) continue;
      o[i] = x[i] * (i < a ? (a - i) / fade : i >= b ? (i - b) / fade : 0);
    }
    for(let k = 0; k < n; k++){                // 새 이름 (앞뒤 10ms 페이드)
      const p = s0 + k * rate, j = Math.floor(p), f = p - j;
      const env = Math.min(1, k / (sr * 0.01), (n - k) / (sr * 0.01));
      o[a + k] += ((sd[j] || 0) * (1 - f) + (sd[j + 1] || 0) * f) * gain * env;
    }
  }
  return out;
}
/* 빠르기는 그대로 두고 음높이만 바꾼다
   ① 천천히 재생한 것처럼 늘려서 음을 내리고 ② WSOLA로 원래 길이로 되돌린다
   (조각을 이어 붙일 때 파형이 가장 잘 맞는 자리를 찾아 붙여서 덜컹거림을 줄인다) */
function pitchShift(buf, ratio){
  if(ratio === 1) return buf;
  const sr = buf.sampleRate;
  const out = audio().createBuffer(buf.numberOfChannels, buf.length, sr);
  const N = Math.round(sr * 0.05), H = N >> 1, tol = Math.round(sr * 0.012);
  const win = Float32Array.from({ length: N }, (_, k) => 0.5 - 0.5 * Math.cos(2 * Math.PI * k / N));
  for(let ch = 0; ch < buf.numberOfChannels; ch++){
    const x = buf.getChannelData(ch);
    const y = new Float32Array(Math.floor(x.length / ratio));       // ① 늘리기 = 음 내리기
    for(let n = 0; n < y.length; n++){
      const p = n * ratio, i = Math.floor(p), f = p - i;
      y[n] = (x[i] || 0) * (1 - f) + (x[i + 1] || 0) * f;
    }
    const o = out.getChannelData(ch), norm = new Float32Array(o.length);
    let prev = 0;
    for(let pos = 0, k = 0; pos < o.length; pos += H, k++){            // ② 원래 길이로
      const nominal = Math.round(pos / ratio);
      let best = nominal;
      if(k > 0){
        const ref = prev + H; let bestC = -Infinity;
        for(let d = -tol; d <= tol; d += 2){
          const s = nominal + d;
          if(s < 0 || s + N >= y.length) continue;
          let c = 0;
          for(let j = 0; j < N; j += 4) c += (y[ref + j] || 0) * y[s + j];
          if(c > bestC){ bestC = c; best = s; }
        }
      }
      for(let j = 0; j < N && pos + j < o.length; j++){
        o[pos + j] += (y[best + j] || 0) * win[j];
        norm[pos + j] += win[j];
      }
      prev = best;
    }
    for(let i = 0; i < o.length; i++) if(norm[i] > 1e-3) o[i] /= norm[i];
  }
  return out;
}
const atTime = (sec, fn) => setTimeout(fn, Math.max(0, (sec - audio().currentTime) * 1000));
/* 녹음 재생: 3겹을 겹쳐 틀고, 화면 글자는 CHANT_REC.lines 시각에 넘긴다, 끝나면 팡파레 */
function playRecording(layers, shownLines, onLine, onDone){
  const ctx = audio(), t0 = ctx.currentTime + 0.1;
  layers.forEach((buf, i) => {
    const [, delay, pan, vol] = CHANT_VOICES[i];
    const src = ctx.createBufferSource(), g = ctx.createGain(), p = ctx.createStereoPanner();
    src.buffer = buf; g.gain.value = vol; p.pan.value = pan;
    src.connect(g).connect(p).connect(bus());
    src.start(t0 + delay);
  });
  shownLines.forEach((shown, i) => atTime(t0 + CHANT_REC.lines[i], () => onLine(shown)));
  const [from, len] = speechSpan(layers[0]);
  const end = t0 + from + len;
  sCheer(end + 0.05);
  atTime(end + 1.3, onDone);
}
/* 앱이 켜지면 미리 준비해 둔다 (입장 버튼 누를 때 기다리지 않게) */
window.addEventListener("load", () => loadRecording());

/* onLine(글자) 는 구호가 바뀔 때마다, onDone() 은 끝나면 불린다 */
async function playChant(name, onLine, onDone){
  const ctx = audio();
  const beat = 60 / CHANT_BPM;
  /* 목소리를 기다리는 동안 두구두구 */
  onLine("두구두구... 🥁");
  let rollT = ctx.currentTime + 0.05, rolling = true;
  (function roll(){
    if(!rolling) return;
    while(rollT < ctx.currentTime + 0.3){ sSnare(rollT, 0.06 + Math.random()*0.04); rollT += 0.065; }
    setTimeout(roll, 120);
  })();

  const name1 = `${name}${josaIga(name)} 좋아하는`;
  const LINES = [   // [목소리 문장, 화면 글자, 시작 박, 길이(박)]
    [name1,        `${name1}~`,       0, 4],
    ["랜덤 게임",   "랜덤 게임~",       4, 2],
    ["랜덤 게임",   "랜덤 게임~",       6, 2],
    ["무슨 게임",   "무슨 게임? 🤔",    8, 2],
    ["게임 스타트", "게임 스타트! 🎉", 10, 2],
  ];
  const rec = await loadRecording();
  if(rec){   // 녹음은 이름이 nameSay로 고정이라 화면 첫 줄도 그에 맞춘다
    rolling = false;
    const shown = LINES.map(l => l[1]);
    shown[0] = `${CHANT_REC.nameSay} 좋아하는~`;
    return playRecording(rec, shown, onLine, onDone);
  }
  const texts = [...new Set(LINES.map(l => l[0]))];
  const decoded = await loadChantVoices(texts);
  rolling = false;
  const voiceOf = text => decoded && decoded[texts.indexOf(text)];

  const t0 = Math.max(ctx.currentTime, rollT) + 0.1;
  const at = b => t0 + b * beat;
  const later = atTime;
  /* 반주: 다 같이 매 박 손뼉 + 쿵(1·3박) + 하이햇, 마지막 마디는 박수 몰아치기 */
  for(let b=0;b<12;b++){
    if(b % 2 === 0) sKick(at(b), 0.7);
    sClap(at(b), b % 2 ? 0.5 : 0.35);
    sHat(at(b + 0.5), 0.06);
    if(b >= 8) sClap(at(b + 0.5), 0.25);
  }
  sKick(at(12), 1); sCheer(at(12));
  LINES.forEach(([text, shown, b, len], i) => {
    const layers = voiceOf(text);
    if(layers) crowdSay(layers, at(b), len * beat, i === LINES.length - 1 ? 0.65 : 0.5);
    later(at(b), () => { onLine(shown); if(!layers) speakFallback(text); });
  });
  later(at(15), onDone);
}
