/* 스모크 테스트 실행기
   사용법: node tests/run.js
   Chrome 또는 Edge가 필요하다. 못 찾으면 CHROME=브라우저경로 로 지정.
   index.html에 tests/smoke.js를 끼운 임시 페이지를 headless로 열고, 결과를 출력한다. (실패 시 exit 1) */
const fs = require("fs"), path = require("path"), os = require("os");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const ROOT = path.resolve(__dirname, "..");
const CANDIDATES = [
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean);
const browser = CANDIDATES.find(p => fs.existsSync(p));
if(!browser){ console.error("Chrome/Edge를 못 찾음. CHROME=경로 로 지정해줘."); process.exit(2); }

const base = pathToFileURL(ROOT).href + "/";
const page = fs.readFileSync(path.join(ROOT, "index.html"), "utf8")
  .replace("<head>", `<head><base href="${base}"><script src="tests/smoke.js"></script>`);
const tmp = path.join(os.tmpdir(), `random-game-smoke-${process.pid}.html`);
fs.writeFileSync(tmp, page);

console.log("스모크 테스트 실행 중... (30초쯤 걸림)");
let dom;
try{
  dom = execFileSync(browser, ["--headless=new", "--disable-gpu", "--no-first-run",
    "--allow-file-access-from-files", "--virtual-time-budget=200000",
    "--dump-dom", pathToFileURL(tmp).href], { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"] });
} finally {
  fs.rmSync(tmp, { force: true });
}

const m = dom.match(/<pre id="SMOKE">([\s\S]*?)<\/pre>/);
if(!m){ console.error("결과를 못 받음 — 페이지가 로드 중에 멈췄을 수 있음"); process.exit(1); }
const text = m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
console.log(text);
const ok = /ERRORS=0\b/.test(text);
console.log(ok ? "✅ 통과" : "❌ 실패");
process.exit(ok ? 0 : 1);
