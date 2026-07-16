# Code Notebook 前端 SDD

## 1. 目的

本文件定義 Code Notebook Next.js 前端第一版實作規劃。

目前的整合契約以 `docs/frontend-handoff` 為準。此 app 是一個 authenticated notebook workspace，使用者可以管理 notebooks、chapters、lessons、Markdown 文章內容、JavaScript 程式碼，以及瀏覽器端執行後捕捉到的 output。

## 2. 目前輸入資料

可用的後端交接文件：

- `docs/frontend-handoff/README.md`
- `docs/frontend-handoff/API.md`
- `docs/frontend-handoff/UI-SPEC.md`
- `docs/frontend-handoff/types.ts`
- `docs/frontend-handoff/api-client.ts`
- `docs/frontend-handoff/.env.example`

重要狀態：

- 新版 `docs/frontend-handoff/API.md` 已是 self-contained API contract，前端不需要存取後端 repo 或其他 API 文件。
- `docs/frontend-handoff/api-client.ts` 已包含 notebook API、`authApi.register()`、`authApi.login()`、`authApi.verify2FA()`、`authApi.me()`、`authApi.logout()` 與共用 request helper。
- `docs/frontend-handoff/types.ts` 已補齊新版 `api-client.ts` 引用的 auth 型別，包括 `AuthenticatedResponse`、`LoginInput`、`LoginResponse`、`RegisterInput`、`VerifyTwoFactorInput`。

## 3. 產品範圍

第一版範圍：

- app load 時透過 `/auth/me` 確認登入狀態。
- 顯示桌面四欄 workspace：
  - Notebook tree
  - Markdown article editor 與 preview
  - JavaScript code editor 與 runtime controls
  - Console output
- 支援 notebooks、chapters、lessons 的 CRUD。
- 支援 chapters 與 lessons 排序。
- 支援 lesson editing 與 debounced autosave。
- 在瀏覽器 sandbox 中本地執行 JavaScript。
- 捕捉 `console.log`、`console.warn`、`console.error`。
- output 只在執行停止後或 explicit save 時 persist。

第一版不做：

- Collaborative editing。
- Multi-language runtime。
- Server-side execution。
- Offline-first sync。
- Rich Markdown block editor。
- Realtime backend updates。

## 4. 建議套件

### UI Foundation

使用 shadcn/ui 作為元件基礎。

建議 runtime packages：

```txt
lucide-react
class-variance-authority
clsx
tailwind-merge
tailwindcss-animate
```

shadcn/ui 元件採逐步加入，不一次引入大型 UI library。第一批元件：

```txt
button
input
textarea
dialog
alert-dialog
dropdown-menu
context-menu
tabs
tooltip
scroll-area
separator
badge
sonner
resizable
```

理由：

- shadcn/ui 與 Tailwind 搭配自然，元件會落在本地程式碼中，方便調整。
- Radix primitives 可處理 dialogs、menus、tabs 等 accessibility 基礎。
- `lucide-react` 適合此類 icon-button-heavy workspace UI。

### Data Fetching 與 Server State

建議套件：

```txt
@tanstack/react-query
```

理由：

- app 主要是 authenticated client-side CRUD。
- React Query 提供 request deduplication、loading states、cache invalidation、retry 與 optimistic updates。
- 可讓 API interaction 不散落在 presentation components 中。

### Forms 與 Validation

建議套件：

```txt
react-hook-form
zod
@hookform/resolvers
```

理由：

- 後端 validation 仍是最終依據。
- 前端 validation 可改善 create、rename、edit flow。
- `zod` 可在 form 附近定義可重用 input schemas。

### Editors

建議套件：

```txt
@uiw/react-codemirror
@codemirror/lang-markdown
@codemirror/lang-javascript
@codemirror/theme-one-dark
```

理由：

- CodeMirror 比 Monaco 輕，足以支援 Markdown 與 JavaScript editing。
- 同一套 editor stack 可覆蓋 article 與 code panel。
- 支援 controlled editor state、keyboard handling、syntax highlighting 與 lazy loading。

替代方案：

- 若未來需要 TypeScript language service、inline diagnostics 或 VS Code-like experience，再評估 Monaco。第一版不建議預設使用，因為較重。

### Markdown Preview

主要路徑：

- 載入 lesson 時使用後端回傳的 `lesson.htmlContent`。
- preview refresh 使用 `codeNotebookApi.renderMarkdown(markdown)`。

可選 frontend fallback packages：

```txt
react-markdown
remark-gfm
rehype-sanitize
```

建議：

- 第一版先不要安裝 Markdown rendering packages，除非確認需要不等待後端的 instant local preview。
- 若後續加入 local rendering，生成 HTML 必須 sanitize，且 backend-rendered HTML 仍應是 saved preview 的 canonical source。

### Drag and Drop 排序

建議套件：

```txt
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```

理由：

- React 支援良好。
- 適合 sortable chapter 與 lesson lists。
- 避免使用維護狀態較弱的舊 drag-and-drop libraries。

### Layout Panels

建議套件：

```txt
react-resizable-panels
```

理由：

- workspace 需要可調整 panels。
- shadcn `resizable` component 也是建立在此套件上。

### Utility Packages

可選套件：

```txt
date-fns
```

只有在畫面需要 visible timestamps 或 relative save status formatting 時再加入。未確認需求前先不加。

## 5. 建議目錄結構

```txt
app/
  layout.tsx
  page.tsx
  login/page.tsx
  providers.tsx
components/
  notebook-workspace/
    workspace-shell.tsx
    notebook-tree.tsx
    article-panel.tsx
    code-panel.tsx
    output-panel.tsx
    lesson-toolbar.tsx
  ui/
lib/
  code-notebook/
    api-client.ts
    types.ts
    query-keys.ts
  runner/
    javascript-runner.ts
    runner.worker.ts
  hooks/
    use-auth-session.ts
    use-debounced-save.ts
    use-before-lesson-switch.ts
```

備註：

- 將 `docs/frontend-handoff/types.ts` 與 `api-client.ts` 複製到 `lib/code-notebook/`。
- 後端契約檔保持薄且貼近 handoff source。
- JavaScript runner 隔離在 `lib/runner/`。
- 需要互動狀態的 workspace UI 放在 Client Component boundary 後面。

## 6. 工程規則

- 遵守 clean-code 原則：function 聚焦、命名清楚、資料流明確、避免隱藏 side effects，並在有實際維護成本時消除重複。
- React components 保持小而 purpose-driven。
- 對 auth session loading、debounced save、runner lifecycle、lesson-switch flushing 等可重用 stateful 行為抽 custom hooks。
- 優先使用直接清楚的 composition，不過早建立大型抽象。
- 保留 `docs/frontend-handoff` 定義的後端 API contract；不要在未更新契約的情況下自行發明 request 或 response shape。
- 所有 icons 必須來自 `lucide-react`；禁止手寫 inline SVG、自訂 SVG path 或 ad hoc icon component。
- Agents 與使用者溝通、回報都使用繁體中文，除非使用者明確要求其他語言。
- Agents 不得安裝套件。需要 dependencies 時，只提供使用者要執行的精確指令。
- 每次 code 或 document 修改後，agents 必須在回報前執行 `npm run lint`、`npm run test`、`npm run build`。若 script 不存在或執行失敗，需回報明確阻塞點。
- 測試不得寫入 `.env`、`.env.local` 或任何真實 `.env*` 檔案。請使用 test-only environment variables、mocks、fixtures 或 CI secrets。
- Agents 不得讀取 `.env`、`.env.local` 或任何真實 `.env*` 檔案。若需要新增環境變數，只能更新 `.env.example` 並告知使用者要同步到本機環境。
- 只有使用者可以執行 commit 與 push。Agents 只能用純文字建議 commit message 或指令，不得執行 `git commit`、`git push` 或等效 publishing commands。

## 7. Next.js 架構

此專案使用 Next.js 16 App Router。

設計規則：

- `app/layout.tsx` 保持 Server Component。
- 使用 client `app/providers.tsx` 放 React Query 與全域 toasts。
- `app/page.tsx` 保持薄，只 render workspace entry。
- workspace 需要 browser state、editor state、Web Workers、drag-and-drop 與 keyboard interactions，因此使用 Client Components。
- 第一版 notebook mutations 不使用 Server Actions，因為後端已提供 HTTP API contract，且 browser request 需要 `credentials: "include"`。

Auth：

- app load 時呼叫 `authApi.me()`。
- 若回傳 `401`，清除前端 user state 並導向 `/login`。
- 後端沒有登入頁，`/login` 由前端實作。
- `POST /auth/login` 支援 email/password 或 nickname/PIN；成功會設定 HTTP-only `app_session` cookie。
- login 若需要 2FA，會回傳 `require2FA`、`userId`、`displayName`，前端需接續呼叫 `POST /auth/2fa/verify`。
- `POST /auth/register` 支援 email/password/display_name 或 nickname/PIN，可建立帳號並開始 session。
- handoff `api-client.ts` 已包含 `register`、`login`、`verify2FA` methods，且 handoff `types.ts` 已補齊對應 auth 型別。
- 不讀取也不儲存 HTTP-only `app_session` cookie。

Environment：

- 使用 `NEXT_PUBLIC_API_BASE_URL`。
- value 必須只有 origin，不包含 `/code_notebook` suffix，也不能有 trailing slash。
- 不要把 secrets 放入 `NEXT_PUBLIC_*`。
- agent 工作期間不得讀取本機 `.env*` 檔案。環境契約變更只能透過 `.env.example`。

## 8. State Management

使用三層 state：

### Server State

由 React Query 管理：

- current user
- notebook list
- selected notebook tree
- selected lesson

主要 query keys：

```ts
["auth", "me"]
["notebooks"]
["notebook-tree", notebookId]
["lesson", lessonId]
```

### Local Draft State

由 workspace components 管理：

- `markdownContent`
- `codeContent`
- `outputContent`
- lesson title edits
- editor mode、preview mode、active mobile tab

dirty local draft 不得被 background refetch 覆蓋。

### UI State

由 local state 或小型 hooks 管理：

- selected notebook id
- selected chapter id
- selected lesson id
- collapsed panels
- narrow screens 的 active tabs
- dialog open states
- saving state

第一版不引入 global state library。React Query 加 local state 足夠。

## 9. 主要資料流程

Initial load：

1. 呼叫 `authApi.me()`。
2. 若已登入，載入 notebooks。
3. 選取第一個 notebook，或顯示 empty state。
4. 載入 notebook tree。
5. 若尚未選取 lesson，選取第一個 lesson。
6. 載入完整 lesson content。

Lesson edit flow：

1. 使用者編輯 Markdown 或 code。
2. 立即更新 local draft。
3. debounce save 800-1500 ms。
4. 顯示 `Saving`。
5. 呼叫 `updateLesson`。
6. 成功顯示 `Saved`，失敗顯示 `Save failed`。
7. 失敗時保留 unsaved content。

Lesson switch flow：

1. 若目前 lesson 有 pending save，先 flush。
2. flush 成功後切換 selection。
3. flush 失敗時保留 local draft 並提供 retry affordance。
4. 載入下一個 lesson content。

Reorder flow：

1. 用 optimistic local state 先更新視覺順序。
2. 呼叫 `reorderChapters` 或 `reorderLessons`。
3. 成功時用後端 response 取代 tree cache。
4. 失敗時 rollback 並顯示錯誤。

## 10. JavaScript Runner 設計

後端不執行使用者程式碼。

每次 run 使用 disposable Web Worker：

- 點擊 Run 時建立新 Worker。
- 在 worker 端 patch `console.log`、`console.warn`、`console.error`。
- 將 console events post 回 app。
- 追蹤 user code 建立的 timers。
- Stop 時 terminate worker。
- 強制 `maxRuntimeMs`，預設 10 秒。
- 每次 run 之間 terminate 並重建 worker。

安全規則：

- 不暴露 cookies。
- 不暴露 DOM APIs。
- 不暴露 app state。
- 不暴露 API clients。
- 不允許從 app bundle imports。

Runner event model：

```ts
type RunnerEvent =
  | { type: "log"; level: "log" | "warn" | "error"; args: unknown[] }
  | { type: "done" }
  | { type: "runtime-error"; message: string; stack?: string }
  | { type: "timeout" };
```

Output persistence：

- 執行期間只在本地 append console output。
- worker finished、timeout、stop 或使用者點 Save 後再 save output。
- 不要每個 log event 都呼叫 `updateLessonOutput`。

## 11. Markdown 設計

Editing：

- 使用 CodeMirror 與 Markdown syntax support。
- article editor 中的 editable truth 是 Markdown source。

Preview：

- 載入內容優先使用 `lesson.htmlContent`。
- debounce 後或進入 preview mode 時使用 `renderMarkdown(markdown)`。
- 後端 Markdown renderer 會 escape raw HTML；前端仍只 render 後端產生的 `lesson.htmlContent` 或 `renderMarkdown()` response。
- 若未來加入 client-side Markdown rendering，必須使用 `rehype-sanitize`。

Performance：

- 不要在每次 keystroke 同步 render Markdown。
- 必要時 preview refresh debounce 與 save debounce 分開。

## 12. 錯誤處理

API error 行為：

- `400`：在相關 form 附近顯示後端 validation message。
- `401`：清除 user state 並導向 `/login`。
- `404`：必要時刷新 notebook tree 並清除 invalid selection。
- `500`：保留 unsaved editor content 並顯示 retry。

Frontend error surfaces：

- 非阻塞錯誤用 toast。
- validation 用 inline form errors。
- tree 與 lesson loading 用 panel-level empty/error states。
- destructive delete actions 使用 confirmation dialogs。

## 13. Responsive Layout

Desktop：

- 使用 resizable panels 的四欄 workspace。
- Tree panel 有固定 minimum width。
- Editors 使用穩定尺寸並在內部 scroll。

Narrow screens：

- 使用 tabs 或 drawer 呈現 tree/article/code/output。
- 不把四欄硬擠進窄欄位。
- Run、Stop、Clear Output、Save、Preview 要在 active panel toolbar 可達。

## 14. Accessibility

基本要求：

- Dialogs 與 menus 必須使用 shadcn/Radix accessible primitives。
- Icon-only buttons 需要 labels 或 tooltips。
- Keyboard focus states 必須可見。
- Destructive actions 需要 confirmation。
- Tree items 在後續 accessibility pass 應補 keyboard selectable。

## 15. 視覺方向

UI 應該像專注的開發 workspace，不是 marketing page。

Guidelines：

- Dense but readable panels。
- 克制的色彩系統。
- 清楚的 active selection states。
- 常用 commands 使用 icon buttons。
- 所有 icons 必須來自 `lucide-react`；禁止手寫 inline SVG、自訂 SVG path 或 ad hoc icon component。
- Primary experience 不做 landing page。
- 不做 decorative hero section。

## 16. 實作階段

### Phase 1：Foundation

- 提供使用者安裝 shadcn/ui 與基礎 UI components 的指令。
- 複製 API client 與 types 到 `lib/code-notebook`。
- 請使用者依 handoff example 建立 `.env.local`。
- 加入 React Query provider。
- 實作 auth check 與 login redirect behavior。

### Phase 2：Read Workspace

- 載入 notebooks。
- 載入 notebook tree。
- 載入 selected lesson。
- 建立包含 tree、article、code、output panels 的 desktop shell。
- 加入 mobile tab layout。

### Phase 3：CRUD

- Notebook create、rename、description edit、delete。
- Chapter create、rename、collapse、delete。
- Lesson create、rename、move、delete。
- 加入 backend persistence 的基本 reorder。

### Phase 4：Editing and Save

- 加入 CodeMirror Markdown editor。
- 加入 CodeMirror JavaScript editor。
- 加入 debounced autosave。
- 加入 save status UI。
- lesson 切換前 flush。
- 使用後端 render endpoint 加入 Markdown preview。

### Phase 5：Runner

- 加入 disposable Web Worker runner。
- 捕捉 console output。
- 加入 Run、Stop、Clear Output。
- 強制 timeout。
- 執行後 persist output。

### Phase 6：Polish and Hardening

- 改善 empty states。
- 改善 error states。
- 加入 optimistic reorder rollback。
- 必要時加入 keyboard shortcuts。
- 加入 API hooks、save behavior、runner behavior 的 focused tests。

## 17. 測試計畫

建議單元與元件測試 stack：

```txt
vitest
@testing-library/react
@testing-library/user-event
jsdom
msw
```

建議 E2E 測試 stack：

```txt
@playwright/test
```

單元與元件測試優先項目：

- API error handling 與 `401` redirect。
- Debounced save 與 failed save retention。
- Lesson switch flush behavior。
- Runner timeout 與 stop behavior。
- API failure 時 reorder rollback。

E2E 測試優先項目：

- 未登入使用者導向 login。
- 已登入使用者可載入 notebooks、選取 lesson，並看到 article/code/output panels。
- 使用者可 create、rename、delete notebook tree items。
- 使用者可編輯 Markdown 並看到 save status。
- 使用者可執行 JavaScript 並看到 captured console output。
- 使用者可在 timeout 前 stop 長時間執行的 JavaScript。

E2E 使用 MSW 或 dedicated test backend 取得 deterministic data。不要依賴會變動的 shared production data。

## 18. GitHub CI

第一個 feature PR 完成前需加入 GitHub Actions。

建議 workflow jobs：

- `lint`：執行 `npm run lint`。
- `test`：執行 `npm run test`。
- `build`：執行 `npm run build`。

建議 CI commands：

```txt
npm ci
npm run lint
npm run test
npm run build
```

建議 package scripts：

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test"
}
```

CI 要求：

- 使用 `npm ci`，不要使用 `npm install`。
- 不需要 production credentials。
- CI 中的 `npm run test` 只跑 unit 與 component tests。
- GitHub CI 不跑 Playwright 或其他 E2E tests。
- GitHub branch protection 設定後，merge 前應要求 workflow 通過。
- 安裝 dependencies 後，GitHub CI 只能呼叫 `npm run lint`、`npm run test`、`npm run build`。

## 19. 開放問題

- production 應由前端直接 cross-origin 呼叫 API，或使用 same-origin Next.js proxy？
- notebook、chapter、lesson titles 的精確 validation constraints 是什麼？
- `autoRun` 是否應在 lesson load 後立即執行，或只在使用者 UI 明確啟用後執行？
- 第一版是否需要 nested chapters，或 `parentId` 是保留給後續？

## 20. 初始建議

先從這組 runtime packages 開始：

```txt
@tanstack/react-query
@uiw/react-codemirror
@codemirror/lang-markdown
@codemirror/lang-javascript
@codemirror/theme-one-dark
react-hook-form
zod
@hookform/resolvers
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
react-resizable-panels
lucide-react
```

第一個 workspace skeleton 建好前，先補上 testing packages：

```txt
vitest
@testing-library/react
@testing-library/user-event
jsdom
msw
@playwright/test
```

CI 使用 `npm ci` 安裝 dependencies，但 test step 只透過 `npm run test` 執行 unit 與 component tests。Playwright E2E tests 保留給本機或手動驗證，除非後續決策改變。

元件層使用 shadcn/ui，依需求逐步安裝個別 components。

以下套件先延後，等需求確定再加入：

```txt
react-markdown
remark-gfm
rehype-sanitize
date-fns
```

延後 Markdown rendering packages 的主要原因是後端已提供 `htmlContent` 與 `/code_notebook/markdown/render`。前端不應在沒有明確需求前建立第二套 Markdown rendering source。
