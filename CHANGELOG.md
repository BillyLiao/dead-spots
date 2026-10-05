# Changelog

格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本號用 [SemVer](https://semver.org/lang/zh-TW/)。
新的改動先寫在 `[Unreleased]`，發 release 時再改成版本號和日期。

分類：**Added** 新功能 · **Changed** 調整 · **Fixed** 修 bug · **Removed** 拿掉

## [Unreleased]

## [0.1.1] - 2026-10-05

### Added
- `CHANGELOG.md`（這份）與 `NOTES.md`（專案現況、架構、待辦）。
- 開始走 git flow：`main` 只放已發佈版本，日常開發在 `develop`。

## [0.1.0] - 2026-10-05

第一個公開版本，上線在 GitHub Pages。

### Added
- **指型庫**
  - 在 6 弦 × 6 格的指板上點格子記錄指型，可切換空弦 / 悶音，可上下移動格位。
  - 「設根音」：根音可以在任何一條弦，不一定是最低音，所以轉位也記得下來。
  - 不顯示絕對音名，自動算出每個音的級數，判斷和弦性質和轉位。可手動覆寫性質。
  - 自訂指型預設標成盲區；任何指型都可以加入 / 移出盲區。
  - 內建 40 個指型：封閉和弦、高三弦 / 中三弦的三和弦轉位、shell、maj7 / m7 / 7 / m9 / maj9 / sus / add9 / m6 / m7♭5 / m(maj7) / power chord、shoegaze 常用的開放弦和弦。
  - 練 3 次以上、卡住率 ≥ 50% 的非盲區指型，會顯示「建議加入盲區」。
  - 用 JSON 備份與匯入。
- **擲骰子**
  - 33 種和弦進行，各有權重，橫跨 indie / dream pop / trip hop / post-punk / shoegaze，每種附調式和一句說明。
  - 調性依吉他好彈程度加權，BPM 依風格決定（中間值機率最高）。
  - 可以單獨鎖住調性、速度、進行再重擲。
  - 每個和弦從指型庫挑一個指型放到正確格位，優先順序：盲區 > 自訂 > 內建，位置盡量靠近前一個和弦。可以單一和弦換指型。
  - 節拍器（Web Audio），會標出現在輪到哪個和弦，每個和弦 1 / 2 / 4 小節或自動。
- **盲區練習**
  - 題型：名字 → 指型、指型 → 級數、混合。
  - 「隨機根音」：把可移動的指型移到隨機調，順便練指板位置。
  - 自評「順 / 卡住」，抽題權重依卡住比例調整；最近出過的題目暫時降權。
  - 鍵盤快捷鍵：Space 翻牌、1 順、2 卡住、B 切換盲區。
- **視覺**：影印 Zine 風格（紙色、墨黑、紅、灰、網點底紋）。音級用形狀區分：1 實心黑、3 紅、5 空心、7 灰、延伸音虛線。
- **Icon**：「斷掉的延音」，包含 `favicon.svg` 和 `apple-touch-icon.png`。
- **儲存**：存在瀏覽器的 localStorage，並請瀏覽器保留資料（`navigator.storage.persist()`）。

### 上線前的 prototype（沒有版本號）
- 先在 Claude artifact 上做出灰藍練習簿風格的版本（資料存在 claude.ai 帳號）。
- 後來改成 Zine 風格、改名 Dead Spots，才搬到 GitHub。

[Unreleased]: https://github.com/BillyLiao/dead-spots/compare/v0.1.1...develop
[0.1.1]: https://github.com/BillyLiao/dead-spots/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/BillyLiao/dead-spots/releases/tag/v0.1.0
