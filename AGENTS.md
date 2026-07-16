<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Rules

- 遵守 clean-code 原則：function 保持聚焦、命名清楚、避免隱藏 side effects、在有實際維護成本時移除重複，並優先使用簡單明確的控制流程。
- Components 保持小而 purpose-driven。當 state、effects 或 rendering branches 變得難以掃讀時，抽出 hooks 或 child components。
- 保留 `docs/frontend-handoff` 定義的後端 API contract；不要在未更新契約的情況下自行發明 request 或 response shape。
- 所有 icons 必須來自 `lucide-react`。禁止手寫 inline SVG、自訂 SVG path 或 ad hoc icon component。
- Agents 與使用者對話和回報時必須使用繁體中文，除非使用者明確要求其他語言。
- Agents 不得安裝套件。需要 dependencies 時，只提供使用者要執行的精確指令。
- 每次 code 或 document 修改後，agents 必須在回報前執行 `npm run lint`、`npm run test`、`npm run build`。若 script 不存在或執行失敗，需回報明確阻塞點。
- GitHub CI 只能執行 `npm run lint`、`npm run test`、`npm run build`。CI 不得執行 Playwright 或其他 end-to-end tests。
- 測試不得寫入 `.env`、`.env.local` 或任何真實環境檔。請使用 test-only environment variables、mocks、fixtures 或 CI secrets。
- Agents 不得讀取 `.env`、`.env.local` 或任何真實 `.env*` 檔案。若需要新增環境變數，只能更新 `.env.example` 並告知使用者要同步到本機環境。
- 只有使用者可以執行 commit 與 push。Agents 只能用純文字建議 commit message 或指令，不得執行 `git commit`、`git push` 或等效 publishing commands。
