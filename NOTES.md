# Dead Spots · 專案筆記

要繼續開發時先讀這份。這裡記的是**現況、原因、還沒做的事**；每次改了什麼記在 [`CHANGELOG.md`](CHANGELOG.md)。

最後更新：2026-10-05（v0.1.1）

---

## 一句話

給自己用的吉他指型練習工具：記錄指型、標出盲區，用級數而不是音名來練，再用擲骰子抽出風格相符的和弦進行，逼自己用不熟的指型去彈。

## 在哪裡

| | |
|---|---|
| 線上 | https://billyliao.github.io/dead-spots/ （GitHub Pages，從 `main` 自動部署） |
| Repo | https://github.com/BillyLiao/dead-spots （public） |
| 本機 | `~/Projects/dead-spots/` |
| Claude 版 | https://claude.ai/artifact/8PdtsLwRPzkCUK8FJj97PM （資料存在 claude.ai 帳號；不會自動跟著 repo 更新，見下方「Claude 版怎麼同步」） |

---

## 工作流程（git flow）

```
main      ── 只放已發佈版本，每個 merge 都打 tag，push 就會部署到線上
develop   ── 日常開發的整合分支
feature/* ── 從 develop 開，做完 merge 回 develop
release/* ── 從 develop 開，改 CHANGELOG 的版本號 → merge 到 main（打 tag）＋ merge 回 develop
hotfix/*  ── 線上 bug：從 main 開 → merge 到 main（打 tag）＋ merge 回 develop
```

- merge 一律用 `--no-ff`，保留分支歷史。
- 版本號：新功能升 minor（0.**2**.0），bug fix 和小調整升 patch（0.1.**2**）。
- 每個 feature / hotfix 都要在 CHANGELOG 的 `[Unreleased]` 底下記一行。
- 機器上沒有安裝 `git-flow` 工具，用一般 git 指令操作。要裝的話：`brew install git-flow-avh`。

**只有 merge 到 main 才會上線。** develop 上的東西線上看不到。要先看效果，直接用瀏覽器開本機的 `index.html`。

---

## 架構

純靜態網頁，**只有一個檔案 `index.html`**（HTML + CSS + JS），沒有 build、沒有框架、沒有後端。

`<script>` 用註解分成以下區塊（搜尋 `/* ====` 就能跳過去）：

| 區塊 | 內容 |
|---|---|
| `music core` | 調弦（`OPEN`）、拼音（`spell`）、級數計算（`rels` / `degLabel` / `fam`）、和弦性質判斷（`QTABLE` / `detectQ`）、轉位、指型平移（`placements`） |
| `builtin shapes` | 內建 40 個指型 `BUILTIN_RAW` |
| `progressions` | 33 種和弦進行 `PROGS`、風格 BPM `STYLE_BPM`、調性權重、羅馬數字解析、性質替代表 `COMPAT` |
| `state & storage` | 狀態 `S` / `ui`、localStorage、Claude db 同步 |
| `shape helpers` | 盲區判斷、優先權 `prio`、指型標題 |
| `diagram` | 和弦圖 SVG 產生器 |
| `dice` | 擲骰子邏輯、挑指型 `pickVoicing`、畫面、節拍器 |
| `drill` | 盲區練習：出題權重、出題、評分 |
| `library` | 指型庫畫面、備份 / 匯入 |
| `editor` | 新增 / 編輯指型的指板編輯器 |
| `wiring` | 所有事件處理（一個全域 click / change / input / keydown） |

畫面是「改 state → 整個分頁重畫」的模式（`renderAll` / `renderDice` / `renderDrill` / `renderLib`），沒有虛擬 DOM。

### 資料模型

**指型**（`S.chords` 裡的自訂指型，內建的在 `BUILTIN`）：
```js
{
  id: 'c-xxxx',            // 內建的是 'b-...'
  name: '',                // 可空
  frets: [-1,3,2,0,3,3],   // 6弦→1弦；-1 悶音、0 空弦、>0 格數（存的是錄下來的絕對格位）
  root: 1,                 // 根音在哪條弦（index，0 = 6弦）
  fixedQ: '',              // 手動指定的性質，空字串 = 自動判斷
  notes: '', blind: true, src: 'custom', created: 1791...
}
```
- 內建指型的盲區標記存在 `S.flags[id] = {blind:true}`（內建資料本身不能改）。
- 練習紀錄存在 `S.stats[id] = {n, miss, last}`。

**localStorage keys**：
- `chordnb.data.v1`：`{chords, flags, stats}`
- `chordnb.ui.v1`：分頁、風格篩選、鎖定、練習設定（偏好用，掉了也沒關係）

改資料結構時要升版本號（`v2`）並寫 migration，不然舊資料會讀壞。

### 幾個關鍵規則

- **級數**：每條弦的音高（`OPEN[i] + fret`）減掉根音，取 mod 12。標籤會看上下文：沒有三音時 2 → `2`、5 → `4`；有 5 度時 6 → `♯11`；dim7 的 9 → `°7`。
- **性質判斷**：先拿掉 1 和完全五度，剩下的半音集合去查 `QTABLE`。這樣 shell（省略五度）也能判斷。查不到就顯示「未辨識」，可以手動指定。
- **可移動 vs 開放弦**：有空弦的指型不能平移，只能用在原本的調。
- **擲骰子挑指型**（`pickVoicing`）：權重 = `prio` ×（性質完全符合 ×3，否則依 `COMPAT` 順位遞減）÷ 離前一個和弦的距離。`prio`：盲區 6、自訂 3、內建 1。
- **練習出題**（`drillWeight`）：`prio × (1 + 2 × (卡住+1)/(次數+2))`，沒練過的再 ×1.3，最近 4 題大幅降權。
- **BPM**：`中心 ± 幅度 × (rand + rand − 1)`，三角分布，中間值機率最高。

---

## 設計決策與原因

| 決策 | 原因 |
|---|---|
| 不顯示絕對音名，只顯示級數 | 想練的是指型本身，而且同一個指型會用在很多調 |
| 影印 Zine 風格 | 四個方向（灰藍練習簿 / Wash / Zine / 效果器盤）裡選的，post-punk 的態度最強 |
| 音級用形狀 + 顏色區分 | Zine 只有一個彩色（紅），所以 1 / 3 / 5 / 7 / 延伸音用實心、紅、空心、灰、虛線來分，黑白也看得懂 |
| 名稱 Dead Spots | dead spot 原本是琴頸上延音特別短的音，拿來比喻盲區。撞名檢查過：Rootless（已有 iOS app）、Chord Dice（多個 GitHub repo）都撞名；Blind Fret 會被誤會成視障用的 app |
| Icon「斷掉的延音」 | 第一輪（和弦圖、骰子、霧、劃掉的格子）全部否決；第二輪定案，原則是要符合 dead spot 的意思＋ Zine 配色 |
| 先存 localStorage，不做登入 | 先求能用；跨裝置的需求還不確定 |
| 單一 HTML 檔 | 自己用的小工具，不想維護 build |

---

## 已知限制與還沒驗證的

- [ ] **Zine 版畫面還沒在瀏覽器實際看過**（上線時 Chrome 擴充功能沒連上，只做了 JS 語法檢查）。手機寬度、編輯器、節拍器聲音都要實測。
- [ ] localStorage 每台裝置、每個瀏覽器各自一份；Safari 超過 7 天沒開會清掉（加到主畫面可避免）。
- [ ] 「名字 → 指型」題目在兩個指型的根音弦、低音、最高音都一樣時，會分不出是哪一個（目前靠自訂名稱補）。
- [ ] 隨機根音是 12 個音平均抽，沒有偏向常用調。
- [ ] 匯入 JSON 只做了基本檢查（frets 長度、root 是整數）。
- [ ] 練習紀錄（`stats`）會一直變大，目前沒有清理機制。
- [ ] 指板編輯器一次只看 6 格，跨度更大的指型要上下移動。

## 待辦 / 想法（沒有排序）

- **跨裝置同步**：Firebase（Google 登入＋Firestore）。Supabase 免費版閒置一週會暫停，比較不適合。上線前要再查一次免費額度。
- **PWA**：加 `manifest.json` 和 service worker，可以離線用、像 app 一樣安裝。
- **和弦試聽**：用 Web Audio 彈出指型的聲音，聽轉位的差別。
- **自訂和弦進行**：除了擲骰子，也能存自己寫的進行（例如 EP 裡的歌）。
- **統計頁**：依性質、轉位、根音弦看卡住率，找出真正的盲區類型（例如「所有第二轉位都卡」）。可以拿來寫 Obsidian 的 `Guitar/能力評估.md`。
- **計時模式**：限時按出來，練換和弦的速度。
- **更多內建指型**：drop 2 / drop 3、更多 shoegaze 開放弦和弦。

---

## Claude 版怎麼同步

Claude 版是另一份檔案（只有頁面內容、沒有 `<head>`），而且資料走 claude.ai 的 db。repo 改完之後如果也要更新 Claude 版：

1. 把 `index.html` 的 `<title>` 到 `</body>` 之間的內容（`<head>` 裡的 `<title>`、`<link>`、`<style>`，加上 body 內容）抽出來。
2. 請 Claude 用 Artifact 工具 publish 到 `https://claude.ai/artifact/8PdtsLwRPzkCUK8FJj97PM`。

程式碼本來就兩邊都能跑：有 `window.claude` 就存 claude.ai，沒有就存 localStorage。
