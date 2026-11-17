/* 화면(index.html)에 열어주는 기능은 이것뿐: 구호 목소리 만들기 (main.js의 "chant-voices", "sing-syllables") */
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("native", {
  chantVoices: texts => ipcRenderer.invoke("chant-voices", texts),
  singSyllables: syls => ipcRenderer.invoke("sing-syllables", syls),
});
