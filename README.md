# 🍺 랜덤게임!

브라우저에서 바로 즐기는 술게임 모음. 나 + NPC 콤이 3명이 원탁에 둘러앉아 게임을 진행합니다.

## 실행

`index.html`을 브라우저로 열면 끝. 로컬 서버로 띄우려면:

```bash
python -m http.server 8766
# http://localhost:8766/
```

## exe 만들기 (Windows)

```bash
npm install
npm start          # 창으로 바로 실행해보기
npm run dist       # dist/RandomGame-1.0.0.exe 생성 (설치 없이 실행되는 portable)
```

Electron으로 감쌌습니다. 진입점은 `main.js`. VS Code 터미널처럼 `ELECTRON_RUN_AS_NODE=1`이 설정된 곳에서 실행하면 창이 안 뜨니, 탐색기에서 더블클릭하거나 그 변수를 지우고 실행하세요.

## 구조

```
index.html            공통 화면(입장·메뉴·설명·랭킹·룰) + 스크립트 불러오기 (게임 파일 순서 = 메뉴 순서)
css/style.css
js/core.js            공통: 자리 배치, 효과음, 랭킹, 메뉴, registerGame
js/engines/rhythm.js  리듬 엔진 (딸기·과일·리버스·고래)
js/engines/generic.js 범용 엔진 GX (훈민정음 등 19개)
js/games/*.js         게임 하나 = 파일 하나 (변형판은 원판과 같은 파일)
```

빌드 없이 더블클릭으로 열리게 하려고 ES 모듈 대신 일반 `<script>`를 순서대로 불러옵니다.

게임 전용 화면 HTML은 그 게임 파일 맨 위의 `addScreen(/*html*/ \`...\`)` 안에 있습니다. (`file://`에서는 별도 .html 파일을 불러올 수 없어서 JS 안에 둠. VS Code `es6-string-html` 확장을 쓰면 HTML 색 구분이 됩니다.)

### 게임 추가하기

1. `js/games/새게임.js`를 만들고 맨 위에서 등록한다.
   - 리듬 게임: `registerRhythmGame(설정, { title, bpm, tap, word, pat, intro })`
   - 범용 게임: `registerGxGame(설정, { title, start(GX) })` + 라운드 함수 작성
   - 새 전용 엔진: `registerGame(설정, { start, stop })` + 바로 아래에 `addScreen(/*html*/ \`화면\`)`
2. `index.html`에 `<script src="js/games/새게임.js"></script>`를 원하는 메뉴 위치에 넣는다.

설정은 `{ key, emj, nm, tg, intro, rules, recLabel }`입니다. 기존 게임 파일을 복사해서 시작하면 편해요.
게임 파일 전체는 `(() => { ... })();`로 감싸서, 함수 이름이 다른 게임과 겹쳐도 서로 덮어쓰지 않게 합니다.

## 테스트

```bash
node tests/run.js
```

Chrome(또는 Edge) headless로 모든 게임을 하나씩 시작해서 잠깐 돌리고 "← 메뉴"로 나오며 JS 오류를 잡습니다. 30초쯤 걸리고, 실패하면 어느 게임에서 무슨 오류가 났는지 출력합니다. 브라우저를 못 찾으면 `CHROME=경로 node tests/run.js`.

## 게임 목록 (29개)

베스킨라빈스 31, 딸기 게임, 딸기당근수박참외메론, 딸기당근 리버스, 고래 게임, 어목조동, 공산당, 호빵찐빵, 슛돌이, 지하철, 훈민정음, 아파트, 공공칠빵, 바니바니, 오렌지, 출석부, 잔치기, 잔치기(스피드), 파도게임, 나무게임, 369게임, 울트라 369게임, 메칸더 V, ~에 가면, 홍삼게임, 이중모션, 더 게임 오브 데쓰, 파도게임(단체), 레코드 게임

## 주의

성인용 게임입니다. 음주는 자율적으로, 강요는 금지! 🙅
