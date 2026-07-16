# Code Notebook 前端 Todo

## Phase 0：確認輸入資訊

- [x] 確認本機開發使用的後端 API origin：handoff 範例為 `http://backend.instantcheeseshao.com`，變數名稱為 `NEXT_PUBLIC_API_BASE_URL`。
- [x] 確認 API base URL 格式：只填 origin，不包含 `/code_notebook`，也不能有 trailing slash。
- [x] 確認 auth/session 基本契約：後端使用 HTTP-only `app_session` cookie，前端 request 必須使用 `credentials: "include"`。
- [x] 確認 `401` 基本處理：清除前端 user state 並導向 `/login`。
- [x] 確認 `/login` 由前端實作：後端沒有登入頁，只提供 API。
- [x] 確認 login submit 的 API contract：`POST /auth/login` 支援 email/password 或 nickname/PIN，成功會設定 `app_session` cookie；需要 2FA 時回傳 `require2FA`、`userId`、`displayName`。
- [x] 確認 register API contract：`POST /auth/register` 支援 email/password/display_name 或 nickname/PIN。
- [x] 確認 2FA verify API contract：`POST /auth/2fa/verify` 使用 `userId` 與六位數 `token`，成功後設定 `app_session` cookie。
- [x] 確認 handoff `api-client.ts` 已補齊 `authApi.register()`、`authApi.login()`、`authApi.verify2FA()`。
- [x] 確認 handoff `types.ts` 已補齊 auth 型別：`AuthenticatedResponse`、`LoginInput`、`LoginResponse`、`RegisterInput`、`VerifyTwoFactorInput`。
- [x] 確認後端 Markdown render 安全邊界：`POST /code_notebook/markdown/render` 會 escape raw HTML；前端仍只 render 後端產生的 `htmlContent` 或 render endpoint response。
- [x] 確認完整 API 文件已補齊：新版 `docs/frontend-handoff/API.md` 已改為 self-contained，前端不需要存取後端 repo 或其他 API 文件。

## Phase 1：專案基礎建置

- [x] 因為此 repo 有 `package-lock.json`，套件指令先統一使用 npm。
- [x] 請使用者安裝 runtime dependencies：
  ```bash
  npm install @tanstack/react-query lucide-react react-hook-form zod @hookform/resolvers @uiw/react-codemirror @codemirror/lang-markdown @codemirror/lang-javascript @codemirror/theme-one-dark @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-resizable-panels
  ```
- [x] 請使用者安裝單元與元件測試 dependencies，讓 `npm run test` 能盡早接上：
  ```bash
  npm install -D vitest @testing-library/react @testing-library/user-event jsdom msw
  ```
- [x] 請使用者安裝本機/手動 E2E 測試 dependency。CI 不執行 E2E：
  ```bash
  npm install -D @playwright/test
  ```
- [x] 請使用者在既有 Next.js 專案初始化 shadcn/ui：
  ```bash
  npx shadcn@latest init
  ```
- [x] 請使用者加入第一批 shadcn/ui 元件：
  ```bash
  npx shadcn@latest add button input textarea dialog alert-dialog dropdown-menu context-menu tabs tooltip scroll-area separator badge sonner resizable
  ```
- [x] 將 `docs/frontend-handoff/types.ts` 複製到 `lib/code-notebook/types.ts`。
- [x] 將 `docs/frontend-handoff/api-client.ts` 複製到 `lib/code-notebook/api-client.ts`。
- [x] 確認複製 API client 前 handoff `types.ts` 已補齊 auth 型別。
- [x] 請使用者自行從 `docs/frontend-handoff/.env.example` 建立 `.env.local`，並設定 `NEXT_PUBLIC_API_BASE_URL`。
- [x] 若環境變數有變更，只能更新 `.env.example`，並告知使用者要同步到本機環境。
- [x] 更新 create-next-app 預設 metadata。
- [x] 在依賴 `npm run build` 前，先移除或自託管預設 `next/font/google` 字體，因為目前環境無法在 build 時抓取 Google Fonts。
- [x] 盡早新增 package scripts：
  ```json
  {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
  ```
- [x] 驗證 `npm run lint`。
- [x] 驗證 `npm run test`。
- [x] 驗證 `npm run build`。

## Phase 2：App Providers 與 Auth

- [x] 新增 `app/providers.tsx`。
- [x] 設定 `QueryClientProvider`。
- [x] 設定全域 toast provider。
- [x] 使用 `authApi.me()` 建立 auth session query。
- [x] auth 回傳 `401` 時導向 `/login`。
- [x] 新增前端 `/login` 頁面。
- [x] 使用 `POST /auth/login` 串接 login form。
- [x] 支援 email/password 與 nickname/PIN 兩種登入方式。
- [x] login 回傳 `require2FA` 時顯示 2FA token 輸入流程，並呼叫 `POST /auth/2fa/verify`。
- [x] 視第一版需求決定是否在 `/login` 同頁提供 `POST /auth/register` 註冊入口：第一版先不放註冊入口，避免登入頁流程過重。
- [x] 使用 `authApi.logout()` 新增登出動作。
- [x] 驗證 auth loading、authenticated、unauthenticated 三種 UI 狀態。

## Phase 3：Workspace Shell

- [x] 將預設 `app/page.tsx` 換成 workspace entry。
- [x] 建立 `components/notebook-workspace/workspace-shell.tsx`。
- [x] 建立桌面四欄可調整 layout：
  - notebook tree
  - article panel
  - code panel
  - output panel
- [x] 建立窄螢幕 tab layout。
- [x] 將桌面 notebook tree 改為較寬、可收合的 sidebar。
- [x] 加入 loading 與 empty states。
- [x] 確保所有 icon 都來自 `lucide-react`。
- [x] 確認沒有新增手寫 SVG。

## Phase 4：Notebook Tree 讀取流程

- [x] 在 `lib/code-notebook/query-keys.ts` 建立 query keys。
- [x] 使用 `codeNotebookApi.listNotebooks()` 載入 notebook list。
- [x] 沒有選取 notebook 時預設選第一個 notebook。
- [x] 使用 `getNotebookTree()` 載入選取的 notebook tree。
- [x] 預設選取第一個可用 lesson。
- [x] 使用 `getLesson()` 載入選取 lesson。
- [x] 遇到 `404` 時刷新 tree 並清除無效選取。

## Phase 5：Notebook、Chapter、Lesson CRUD

- [x] 新增 notebook create dialog。
- [x] 新增 notebook rename 與 description edit。
- [x] 新增 notebook delete confirmation。
- [x] 新增 chapter create action。
- [x] 新增 chapter rename action。
- [x] 新增 chapter collapse toggle。
- [x] 新增 chapter delete confirmation。
- [x] 新增 lesson create action。
- [x] 新增 lesson rename action。
- [x] 新增 lesson delete confirmation。
- [x] 將後端 `400` validation message 顯示在對應 form 附近。
- [x] mutation 成功後 invalidate 或更新 React Query cache。

## Phase 6：排序

- [ ] 使用 `@dnd-kit` 建立 sortable chapter list。
- [ ] 使用 `reorderChapters()` 持久化 chapter order。
- [ ] 使用 `@dnd-kit` 建立 sortable lesson list。
- [ ] 使用 `reorderLessons()` 持久化 lesson order。
- [ ] reorder 使用 optimistic UI。
- [ ] reorder 失敗時 rollback 視覺順序。
- [ ] 後續 accessibility pass 要補上 keyboard 操作。

## Phase 7：Markdown Article Panel

- [x] 加入 CodeMirror Markdown editor。
- [x] 加入 edit 與 preview modes。
- [x] 使用 `lesson.htmlContent` 顯示初始 preview。
- [x] 使用 `codeNotebookApi.renderMarkdown()` 刷新 preview。
- [ ] 必要時將 preview refresh debounce 與 save debounce 分開。
- [x] preview render 失敗時保留 editor 內容。

## Phase 8：JavaScript Code Panel

- [x] 加入 CodeMirror JavaScript editor。
- [x] 加入控制：
  - Run
  - Stop
  - Clear Output
  - Save
- [x] 謹慎處理 lesson `autoRun`；lesson 與 sandbox 都 ready 前不要執行。
- [x] loading、hover、save 狀態切換時保持 editor 尺寸穩定。

## Phase 9：Autosave 與 Lesson 切換

- [x] 實作 `use-debounced-save`。
- [x] 使用 `updateLesson()` 儲存 Markdown 與 code edits。
- [x] autosave debounce 約 800-1500 ms。
- [x] 顯示 `Saving`、`Saved`、`Save failed`。
- [x] save 失敗時保留未儲存 editor state。
- [x] lesson 切換前盡可能 flush pending changes。
- [x] flush 失敗時阻止或警告 lesson switch。
- [x] 避免 background refetch 覆蓋 dirty local drafts。

## Phase 10：瀏覽器 JavaScript Runner

- [ ] 新增 runner types 與 event model。
- [ ] 實作可 disposable 的 Web Worker runner。
- [ ] 在 worker 端 patch `console.log`、`console.warn`、`console.error`。
- [ ] 捕捉 runtime errors 與可用的 stack traces。
- [ ] 追蹤 user code 建立的 timers。
- [ ] stop 時清除 timers。
- [ ] 強制 `maxRuntimeMs`，預設 10 秒。
- [ ] 每次 run 之間 terminate 並重建 worker。
- [ ] 執行期間在本地 append output。
- [ ] run stop、timeout、error 或 finish 後再 persist output。
- [ ] 不要每次 console event 都 persist output。

## Phase 11：錯誤處理與細節整理

- [ ] 新增共用 API error handling helper。
- [ ] 盡量全域處理 `401`。
- [ ] 依 `docs/frontend-handoff/UI-SPEC.md` 處理 `400`、`404`、`500`。
- [ ] destructive actions 需有 confirmation。
- [ ] icon-only buttons 需有 tooltips。
- [ ] 為沒有 notebooks、chapters、lessons 的狀態建立明確 empty states。
- [ ] 確認 responsive layout 沒有文字重疊。
- [ ] 確認 UI 是密集、workspace-oriented，不是 landing page 風格。

## Phase 12：測試

- [x] 確認已安裝單元與元件測試 dependencies：
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/user-event`
  - `jsdom`
  - `msw`
- [x] 確認已安裝本機/手動 E2E dependency：
  - `@playwright/test`
- [x] 確認 package scripts 存在：
  - `test`
  - `test:watch`
  - `test:e2e`
- [x] 新增 Vitest config。
- [x] 新增 Testing Library setup file。
- [ ] 新增 MSW browser/server test setup。
- [ ] 新增 Playwright config。
- [x] 測試 auth API client 使用 credentialed login request。
- [ ] 測試 auth `401` redirect。
- [x] 測試 workspace 預設選取第一個可用 lesson 的 helper。
- [x] 測試 debounced save behavior。
- [x] 測試 failed save 會保留 local draft。
- [ ] 測試 lesson switch flush behavior。
- [ ] 測試 runner stop 與 timeout behavior。
- [ ] 測試 reorder rollback behavior。
- [ ] 新增 E2E：unauthenticated redirect。
- [ ] 新增 E2E：authenticated workspace load。
- [ ] 新增 E2E：selecting a lesson。
- [ ] 新增 E2E：Markdown edit 與 save status。
- [ ] 新增 E2E：JavaScript run output。
- [ ] 新增 E2E：stopping long-running code。
- [x] 執行 `npm run lint`。
- [x] 執行 `npm run test`。
- [x] 執行 `npm run build`。
- [ ] 需要 E2E 驗證時，本機或手動執行 `npm run test:e2e`。

## Phase 13：GitHub CI

- [ ] 新增 `.github/workflows/ci.yml`。
- [ ] CI 使用 `npm ci`。
- [ ] 新增 lint job。
- [ ] 新增透過 `npm run test` 執行單元與元件測試的 job。
- [ ] 新增 production build job。
- [ ] 確保 CI 不執行 Playwright 或其他 E2E tests。
- [ ] 確保 CI 不需要 production credentials。
- [ ] 文件化 CI 所需環境變數。
- [ ] repo 準備好後，將 CI 設為 GitHub branch protection required check。

## Phase 14：最終驗證

- [ ] 啟動 local dev server。
- [ ] 驗證 authenticated happy path。
- [ ] 驗證 unauthenticated redirect。
- [ ] 驗證 CRUD operations。
- [ ] 驗證 autosave 與 explicit save。
- [ ] 驗證 Markdown preview。
- [ ] 驗證 JavaScript run、stop、timeout、clear output。
- [ ] 驗證 desktop layout。
- [ ] 驗證 narrow-screen tab layout。
- [ ] 驗證 external assets 以外沒有 custom SVG icons。
- [ ] 驗證 GitHub CI 通過。
- [ ] 若 implementation decisions 有變更，更新 `docs/SDD.md`。
