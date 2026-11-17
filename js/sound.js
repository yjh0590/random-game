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
  const out = audio().createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
  for(let ch = 0; ch < buf.numberOfChannels; ch++){
    const x = buf.getChannelData(ch);
    out.getChannelData(ch).set(wsola(resample(x, ratio), x.length, buf.sampleRate));
  }
  return out;
}
/* ratio배 빠르게 재생한 소리 (음도 ratio배, 길이는 1/ratio배) */
function resample(x, ratio){
  const y = new Float32Array(Math.floor(x.length / ratio));
  for(let n = 0; n < y.length; n++){
    const p = n * ratio, i = Math.floor(p), f = p - i;
    y[n] = (x[i] || 0) * (1 - f) + (x[i + 1] || 0) * f;
  }
  return y;
}
/* WSOLA: 음높이는 그대로 두고 길이만 outLen으로 늘이거나 줄인다 */
function wsola(y, outLen, sr){
  const N = Math.round(sr * 0.05), H = N >> 1, tol = Math.round(sr * 0.012);
  const win = Float32Array.from({ length: N }, (_, k) => 0.5 - 0.5 * Math.cos(2 * Math.PI * k / N));
  const o = new Float32Array(outLen), norm = new Float32Array(outLen), step = y.length / outLen;
  let prev = 0;
  for(let pos = 0, k = 0; pos < outLen; pos += H, k++){
    const nominal = Math.round(pos * step);
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
    for(let j = 0; j < N && pos + j < outLen; j++){
      o[pos + j] += (y[best + j] || 0) * win[j];
      norm[pos + j] += win[j];
    }
    prev = best;
  }
  for(let i = 0; i < outLen; i++) if(norm[i] > 1e-3) o[i] /= norm[i];
  return o;
}

/* ---- TTS가 녹음 멜로디대로 부르기 (Electron에서만: Windows TTS 필요) ----
   녹음(sounds/chant.mp3)의 음절마다 [시작, 끝(초), 음(MIDI)]을 재 두었다.
   TTS로 음절을 하나씩 읽혀서 그 음 높이·길이에 맞춰 늘려 붙인다 → 녹음과 같은 가락을 TTS 목소리로.
   음은 녹음에서 잰 값을 반음 단위로 맞춘 것, 앞 4음절("수정이가" 자리)은 소리가 거칠어 잘 안 잡혀서 앞뒤에 맞춰 정함.
   글자는 소리 나는 대로 적는다 (좋→조)  — 다시 녹음하면 같이 고칠 것 */
const CHANT_NOTES = [
  ["아", 0.30, 0.48, 66], ["무", 0.48, 0.63, 66], ["개", 0.63, 0.83, 66], ["가", 0.83, 1.11, 64],
  ["조", 1.12, 1.45, 64], ["아", 1.45, 1.95, 64], ["하", 1.95, 2.13, 65], ["는", 2.13, 2.62, 63],
  ["랜", 2.70, 2.86, 67], ["덤", 2.86, 3.03, 66], ["게", 3.03, 3.10, 62], ["임", 3.10, 3.17, 62],
  ["랜", 3.43, 3.53, 66], ["덤", 3.53, 3.73, 66], ["게", 3.73, 3.98, 62], ["임", 3.98, 4.26, 66],
  ["무", 4.31, 4.55, 67], ["슨", 4.55, 4.66, 67], ["게", 4.66, 4.73, 64], ["임", 4.73, 4.82, 66],
  ["게", 5.10, 5.36, 63], ["임", 5.36, 5.50, 61], ["스", 5.50, 5.88, 65], ["타", 5.88, 6.15, 67], ["트", 6.15, 6.30, 69],
];
const SING_SHIFT = -12;   // 남자애들 목소리: 녹음보다 한 옥타브 아래
/* 3명이 같이 부르는 느낌: [음 살짝 어긋남(배율), 늦게 들어오기(초), 좌우, 크기] — 완벽히 같으면 한 명처럼 들림 */
const SING_VOICES = [[1.000, 0.000, 0, 0.7], [0.988, 0.012, -0.45, 0.55], [1.012, 0.007, 0.45, 0.5]];
let sungRec;              // undefined = 아직 안 만듦, 그 외 Promise<버퍼 3겹 | null>
function loadSung(){
  if(sungRec === undefined) sungRec = (async () => {
    if(!window.native || !window.native.singSyllables) return null;
    try{
      const names = [...new Set(CHANT_NOTES.map(n => n[0]))];
      const raw = await Promise.race([window.native.singSyllables(names), new Promise(r => setTimeout(() => r(null), 12000))]);
      if(!raw) return null;
      const ctx = audio(), syl = {};
      await Promise.all(raw.map(async (u8, i) => {
        const b = await ctx.decodeAudioData(u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength));
        const [from, len] = speechSpan(b), sr = b.sampleRate;
        const d = b.getChannelData(0).slice(Math.round(from * sr), Math.round((from + len) * sr));
        let e = 0; for(const v of d) e += v * v;
        const g = 0.12 / Math.max(1e-4, Math.sqrt(e / d.length));   // 음절마다 크기를 맞춘다
        for(let k = 0; k < d.length; k++) d[k] *= g;
        syl[names[i]] = { d, track: f0Track(d, sr) };
      }));
      /* 음높이가 하나도 안 잡힌 음절(ㅌ처럼 바람 소리가 큰 것)은 다른 음절들의 보통 음높이를 쓴다 */
      const all = Object.values(syl).flatMap(v => v.track.filter(Boolean)).sort((a, b) => a - b);
      const typical = all[all.length >> 1] || 130;
      for(const v of Object.values(syl)) fillTrack(v.track, typical);
      return SING_VOICES.map(([detune, delay]) => renderSung(syl, detune, delay));
    }catch(e){ return null; }
  })();
  return sungRec;
}
/* 10ms마다 음높이(Hz)를 잰다 (YIN 방식), 못 잰 칸은 0
   TTS는 한 음절 안에서도 음이 오르내리므로 칸마다 따로 맞춰야 음이 평평하게 고정된다 */
const F0_HOP = 0.01;
function f0Track(d, sr){
  const W = Math.round(sr * 0.03), minL = Math.round(sr / 400), maxL = Math.round(sr / 80);
  const dn = new Float32Array(maxL + 1), hop = Math.round(sr * F0_HOP), track = [];
  for(let c = 0; c < d.length; c += hop){            // c = 칸의 가운데
    const s = c - (W >> 1);
    if(s < 0 || s + W + maxL >= d.length){ track.push(0); continue; }
    let cum = 0, f = 0;
    for(let t = 1; t <= maxL; t++){
      let e = 0;
      for(let j = 0; j < W; j += 2){ const v = d[s + j] - d[s + j + t]; e += v * v; }
      cum += e; dn[t] = e * t / (cum || 1);
    }
    for(let t = minL; t < maxL; t++) if(dn[t] < 0.25){
      while(t + 1 < maxL && dn[t + 1] < dn[t]) t++;
      f = sr / t; break;
    }
    track.push(f);
  }
  return track;
}
/* 잘못 잰 값(한 옥타브 위·아래로 튄 것)은 typical 근처로 되돌리고,
   못 잰 칸(0)은 가장 가까운 잰 값으로, 하나도 없으면 typical로 채운다 */
function fillTrack(track, typical){
  for(let i = 0; i < track.length; i++) if(track[i]){
    while(track[i] < typical * 0.7) track[i] *= 2;
    while(track[i] > typical * 1.45) track[i] /= 2;
  }
  const known = track.map((f, i) => f ? i : -1).filter(i => i >= 0);
  for(let i = 0; i < track.length; i++) if(!track[i]){
    let near = -1;
    for(const k of known) if(near < 0 || Math.abs(k - i) < Math.abs(near - i)) near = k;
    track[i] = near < 0 ? typical : track[near];
  }
}
/* 음 고정(오토튠): 칸마다 "원하는 음 ÷ 지금 음" 만큼 빠르게/느리게 읽는다 → 음이 want Hz로 평평해짐 (길이는 변함) */
function retune(d, sr, track, want){
  const hop = sr * F0_HOP, y = [];
  for(let p = 0; p < d.length - 1; ){
    const i = Math.floor(p), f = p - i;
    y.push(d[i] * (1 - f) + d[i + 1] * f);
    p += want / track[Math.min(track.length - 1, Math.round(p / hop))];
  }
  return Float32Array.from(y);
}
/* 음절들을 CHANT_NOTES대로 음·길이를 맞춰 한 줄로 이어 붙인 소리 */
function renderSung(syl, detune, delay){
  const ctx = audio(), sr = ctx.sampleRate;
  const total = Math.ceil((CHANT_NOTES[CHANT_NOTES.length - 1][2] + 0.3) * sr);
  const o = new Float32Array(total);
  for(const [s, a, z, midi] of CHANT_NOTES){
    const v = syl[s]; if(!v) continue;
    const want = 440 * Math.pow(2, (midi + SING_SHIFT - 69) / 12) * detune;
    const len = Math.round((z - a + 0.02) * sr);
    const w = wsola(retune(v.d, sr, v.track, want), len, sr);
    const at = Math.round((a + delay + (Math.random() - 0.5) * 0.012) * sr);   // 사람마다 박자가 조금씩 다르게
    const fi = sr * 0.006, fo = sr * 0.03;
    for(let k = 0; k < len; k++){
      const i = at + k;
      if(i >= 0 && i < total) o[i] += w[k] * Math.min(1, k / fi, (len - k) / fo);
    }
  }
  const buf = ctx.createBuffer(1, total, sr);
  buf.getChannelData(0).set(o);
  return buf;
}
const atTime = (sec, fn) => setTimeout(fn, Math.max(0, (sec - audio().currentTime) * 1000));
/* 녹음(또는 TTS로 부른 것) 재생: 3겹을 겹쳐 틀고, 화면 글자는 CHANT_REC.lines 시각에 넘긴다, 끝나면 팡파레
   voices = CHANT_VOICES 모양 [_, 늦게 들어오기, 좌우, 크기] */
function playRecording(layers, voices, shownLines, onLine, onDone){
  const ctx = audio(), t0 = ctx.currentTime + 0.1;
  layers.forEach((buf, i) => {
    const [, delay, pan, vol] = voices[i];
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
window.addEventListener("load", () => loadSung().then(s => s || loadRecording()));

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
  /* ① TTS가 녹음 가락대로 부른 것 → ② 녹음 그대로 → ③ TTS로 그냥 외치기 */
  const sung = await loadSung();
  const rec = sung || await loadRecording();
  if(rec){   // 둘 다 이름이 nameSay로 고정이라 화면 첫 줄도 그에 맞춘다
    rolling = false;
    const shown = LINES.map(l => l[1]);
    shown[0] = `${CHANT_REC.nameSay} 좋아하는~`;
    const voices = sung ? SING_VOICES.map(([, , pan, vol]) => [1, 0, pan, vol]) : CHANT_VOICES;   // 부른 것은 늦게 들어오기가 이미 들어가 있음
    return playRecording(rec, voices, shown, onLine, onDone);
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
