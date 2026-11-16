/* Electron 진입점 — 게임(index.html)을 자체 창으로 띄운다.
   개발 실행: npm start   /   exe 빌드: npm run dist (→ dist/에 portable exe) */
const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path"), fs = require("fs"), os = require("os");
const { execFile } = require("child_process");

function createWindow(){
  const win = new BrowserWindow({
    width: 900, height: 1000, minWidth: 380, minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#fff8ec",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true,
      preload: path.join(__dirname, "preload.js") },
  });
  win.loadFile(path.join(__dirname, "index.html"));

  /* 게임 밖으로 나가는 이동·새 창은 막고, 외부 링크는 기본 브라우저로 */
  win.webContents.setWindowOpenHandler(({ url }) => {
    if(/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if(!url.startsWith("file:")) e.preventDefault();
  });
}

/* ---- 구호 목소리 (Windows 내장 한국어 TTS) ----
   문장 하나를 음높이 5단계로 녹음해 돌려준다 → 화면 쪽에서 겹쳐 틀면 여러 명이 외치는 소리가 된다.
   Windows가 아니거나 한국어 음성이 없으면 null (화면 쪽이 알아서 대체) */
const PITCHES = ["x-low", "low", "medium", "high", "x-high"];
const ttsCache = new Map();   // 문장 → [wav 5개]. "랜덤 게임"처럼 매번 같은 문장은 한 번만 만든다
const PS_SCRIPT = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$job = Get-Content -Raw -Encoding UTF8 $env:RG_TTS_JOB | ConvertFrom-Json
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'ko-KR' } | Select-Object -First 1
if(-not $v){ exit 3 }
$s.SelectVoice($v.VoiceInfo.Name)
foreach($it in $job){
  $s.SetOutputToWaveFile($it.out)
  $s.SpeakSsml("<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='ko-KR'><prosody pitch='" + $it.pitch + "' rate='fast'>" + $it.text + "</prosody></speak>")
  $s.SetOutputToNull()
}`;
const xmlEsc = s => s.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" }[c]));

function synthesize(texts){
  return new Promise(resolve => {
    if(process.platform !== "win32") return resolve(null);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rg-tts-"));
    const job = [];
    texts.forEach((text, i) => PITCHES.forEach((pitch, j) =>
      job.push({ text: xmlEsc(text), pitch, out: path.join(dir, `${i}_${j}.wav`) })));
    const jobFile = path.join(dir, "job.json");
    fs.writeFileSync(jobFile, JSON.stringify(job), "utf8");
    const encoded = Buffer.from(PS_SCRIPT, "utf16le").toString("base64");
    execFile("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encoded],
      { env: { ...process.env, RG_TTS_JOB: jobFile }, timeout: 8000, windowsHide: true },
      err => {
        let out = null;
        if(!err){
          try{ out = texts.map((_, i) => PITCHES.map((_, j) => fs.readFileSync(path.join(dir, `${i}_${j}.wav`)))); }
          catch(e){ out = null; }
        }
        fs.rmSync(dir, { recursive: true, force: true });
        resolve(out);
      });
  });
}

ipcMain.handle("chant-voices", async (_e, texts) => {
  /* 화면에서 오는 값은 믿지 않는다: 짧은 문자열 몇 개만, 글자도 한글·영숫자·문장부호만 */
  if(!Array.isArray(texts) || texts.length > 8) return null;
  texts = texts.map(t => String(t).replace(/[^가-힣ㄱ-ㅎa-zA-Z0-9 ~!?.,]/g, "").slice(0, 30));
  const todo = [...new Set(texts.filter(t => t && !ttsCache.has(t)))];
  if(todo.length){
    const wavs = await synthesize(todo);
    if(!wavs) return null;
    todo.forEach((t, i) => ttsCache.set(t, wavs[i]));
  }
  return texts.map(t => ttsCache.get(t) || null);
});

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
