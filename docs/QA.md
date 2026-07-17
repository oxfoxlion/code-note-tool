# 手動 QA Checklist

這份 checklist 用於 Phase 14 最終驗證。請先確認本機 `.env.local` 已設定 `NEXT_PUBLIC_API_BASE_URL`，然後啟動開發伺服器：

```bash
npm run dev
```

## 1. 未登入流程

- [ ] 開啟 `/`。
- [ ] 預期結果：頁面顯示正在前往登入頁，並導向 `/login`。
- [ ] 重新整理 `/login`。
- [ ] 預期結果：登入頁仍可正常顯示，不會閃回工作區。

## 2. 登入流程

- [ ] 使用後端已建立的測試帳號登入。
- [ ] 若帳號需要 2FA，輸入六位數 token。
- [ ] 預期結果：登入成功後導向 `/`，並載入工作區。
- [ ] 登出。
- [ ] 預期結果：session 被清除，回到登入狀態。

## 3. Workspace 載入

- [ ] 登入後確認 notebook list 有載入。
- [ ] 點選不同 notebook。
- [ ] 預期結果：左側 tree、文章、程式碼與 output 會切換到對應內容。
- [ ] 若 notebook 沒有 chapter 或 lesson，確認 empty state 文字清楚且沒有破版。

## 4. Sidebar 與排序

- [ ] 在桌面寬度開啟工作區。
- [ ] 展開與收合左側 sidebar。
- [ ] 預期結果：sidebar 寬度足夠閱讀內容，主工作區不會被文字重疊。
- [ ] 展開與收合 chapter。
- [ ] 拖曳 chapter 調整順序。
- [ ] 拖曳同一個 chapter 內的 lesson 調整順序。
- [ ] 重新整理頁面。
- [ ] 預期結果：排序結果仍保留。

## 5. Notebook / Chapter / Lesson CRUD

- [ ] 新增 notebook。
- [ ] 重新命名 notebook，並修改 description。
- [ ] 新增 chapter。
- [ ] 重新命名 chapter。
- [ ] 新增 lesson。
- [ ] 重新命名 lesson。
- [ ] 刪除 lesson、chapter、notebook。
- [ ] 預期結果：destructive action 會先顯示 confirmation；成功後列表與選取狀態正確更新。
- [ ] 輸入空白或不合法名稱。
- [ ] 預期結果：後端 validation message 會顯示在對應表單附近。

## 6. Markdown 編輯與預覽

- [ ] 選取一個 lesson。
- [ ] 在 Markdown editor 輸入標題、清單、程式碼區塊。
- [ ] 等待 autosave 狀態變成已儲存。
- [ ] 切換 preview。
- [ ] 預期結果：preview 顯示剛剛輸入的內容，不再顯示「這個 lesson 還沒有 Markdown 內容」。
- [ ] 重新整理頁面。
- [ ] 預期結果：Markdown 內容與 preview 仍保留。

## 7. JavaScript 編輯與執行

- [ ] 在 JavaScript editor 輸入：

```js
console.log("hello");
console.warn("warning");
console.error("error");
```

- [ ] 點擊 Run。
- [ ] 預期結果：output 依序顯示 log、warn、error。
- [ ] 等待 autosave 狀態變成已儲存。
- [ ] 重新整理頁面。
- [ ] 預期結果：程式碼仍保留。

## 8. Runner Stop / Timeout / Clear Output

- [ ] 執行長時間 timer 程式。
- [ ] 點擊 Stop。
- [ ] 預期結果：執行停止，output 保留已輸出的內容。
- [ ] 執行無窮迴圈。
- [ ] 預期結果：約 10 秒後 timeout，頁面仍可操作。
- [ ] 點擊 Clear Output。
- [ ] 預期結果：output 清空並持久化，重新整理後仍為清空狀態。
- [ ] 確認正常完成的程式不會額外輸出 `Finished.`。

## 9. 窄螢幕版面

- [ ] 使用瀏覽器 responsive mode 切到手機寬度。
- [ ] 驗證文章、程式碼、output tabs 可以切換。
- [ ] 開啟 sidebar / tree 操作。
- [ ] 預期結果：沒有文字重疊、按鈕溢出或重要內容被截斷。

## 10. 已知延後項目

- ANSI terminal control sequences 目前只會當成文字輸出，不會重繪同一個畫面。
- E2E 測試目前只有 Playwright config，尚未新增 spec；CI 只跑 `npm run lint`、`npm run test`、`npm run build`。
- 排序的 keyboard accessibility pass 尚未完成。
