/* Electron 진입점 — 게임(index.html)을 자체 창으로 띄운다.
   개발 실행: npm start   /   exe 빌드: npm run dist (→ dist/에 portable exe) */
const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

function createWindow(){
  const win = new BrowserWindow({
    width: 900, height: 1000, minWidth: 380, minHeight: 600,
    autoHideMenuBar: true,
    backgroundColor: "#fff8ec",
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
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

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
