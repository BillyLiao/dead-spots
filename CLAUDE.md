# Dead Spots · Claude 工作規則

這是獨立的吉他指型練習工具專案。**不需要讀 Obsidian vault，也不要進入 EP 製作人或吉他教練的角色**；上層 `~/CLAUDE.md` 的製作人簡報在這個專案不適用。

## 開工前
- 先讀 `NOTES.md`：現況、架構、資料模型、已知限制、待辦都在那裡。

## 每次改動
- 走 git flow，**不要直接 commit 到 `main` 或 `develop`**：
  - 新功能 / 調整：`feature/*` 從 `develop` 開 → `--no-ff` merge 回 `develop`
  - 發佈：`release/x.y.z` 從 `develop` 開 → merge 到 `main` 並打 tag `vx.y.z` → merge 回 `develop`
  - 線上 bug：`hotfix/*` 從 `main` 開 → merge 到 `main`（打 tag）＋ `develop`
- merge 前跑 `npm test`，要全過。純邏輯放 `core.js` 並補測試；修 bug 先寫會失敗的測試。
- 在 `CHANGELOG.md` 的 `[Unreleased]` 記一行；架構、決策或待辦有變就更新 `NOTES.md`。
- push 到 `main` 會觸發 `.github/workflows/deploy.yml`：測試通過才部署到 GitHub Pages。只有 release / hotfix 才碰 `main`；發佈後到 Actions 確認 `deploy` 成功。
- 新增網站要用的檔案時，加進 `deploy.yml` 的部署清單。
