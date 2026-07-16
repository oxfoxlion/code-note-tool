# Code Notebook UI Spec

## Main workspace

The first release uses a four-panel desktop workspace:

1. Chapter tree: notebooks, chapters, lessons, collapse and reorder actions.
2. Article: Markdown edit/preview modes.
3. Code: JavaScript editor and runtime controls.
4. Output: captured console output.

On narrow screens, use tabs or a drawer instead of forcing four small columns.

## Required actions

- Notebook: create, rename, edit description, delete with confirmation.
- Chapter: create, rename, collapse, reorder, delete with confirmation.
- Lesson: create, rename, move/reorder, delete with confirmation.
- Editing: Run, Stop, Clear Output, Save, Markdown preview.
- Session: check `/auth/me` on app load and redirect to login after a `401`.

## Save behavior

- Keep editor state locally while typing.
- Debounce auto-save by roughly 800–1500 ms.
- Show `Saving`, `Saved`, and `Save failed` states.
- Flush pending changes before switching lessons when possible.
- Do not save output on every `console.log`; save after execution stops or on explicit Save.

## Browser JavaScript runner

The backend never executes user code. Run it in a disposable Web Worker or sandboxed iframe.

- Capture `console.log`, `console.warn`, and `console.error`.
- Support timers and clear all timers on Stop.
- Enforce `maxRuntimeMs` (default 10 seconds).
- Terminate and recreate the worker between runs.
- Never expose cookies, DOM access, application state, or privileged APIs to user code.
- Treat `autoRun` cautiously; do not run until the lesson is loaded and the sandbox is ready.

## Error states

- `400`: show the backend validation message near the relevant form.
- `401`: clear local user state and redirect to login.
- `404`: refresh the tree; the selected item may have been deleted.
- `500`: retain unsaved editor content and offer Retry.

## Security

- Requests must use `credentials: "include"`.
- Do not read or store the HTTP-only `app_session` cookie in JavaScript.
- Prefer rendering `htmlContent` from the backend. If another HTML source is introduced, sanitize it first.
- Never put secrets in `NEXT_PUBLIC_*` variables.
