# Code Notebook Frontend API Contract

This document is self-contained. The frontend team does not need access to the backend repository or any other API document.

## Common conventions

- API origin example: `http://localhost:3001`
- Auth base path: `/auth`
- Code Notebook base path: `/code_notebook`
- JSON request bodies must use `Content-Type: application/json`.
- Browser requests must use `credentials: "include"`.
- Authentication uses the HTTP-only `app_session` cookie. Frontend JavaScript must not read or store it.
- All Code Notebook endpoints require authentication.
- IDs are UUID strings and timestamps are ISO 8601 strings.

Common errors:

| Status | Meaning | Frontend behavior |
|---|---|---|
| `400` | Invalid or missing input | Display the returned `error` or `message` |
| `401` | Missing or expired session | Clear frontend user state and redirect to login |
| `404` | Resource does not exist or is not owned by the user | Refresh the relevant list/tree |
| `500` | Server error | Preserve unsaved input and offer retry |

Error bodies use one of these shapes:

```json
{ "error": "title is required" }
```

```json
{ "message": "尚未登入" }
```

## Authentication

### POST /auth/register

Creates an account and starts a session.

Request using email and password:

```json
{
  "email": "user@example.com",
  "password": "minimum 8 characters",
  "display_name": "Shao"
}
```

Alternatively, register using nickname and a six-digit PIN:

```json
{
  "nickname": "Shao",
  "pin": "123456"
}
```

Response `201`:

```json
{
  "message": "註冊成功",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Shao"
  }
}
```

Possible errors: `400` invalid fields, `409` email or nickname already registered.

### POST /auth/login

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Alternatively, log in using nickname and PIN:

```json
{
  "nickname": "Shao",
  "pin": "123456"
}
```

Successful response `200` sets the `app_session` cookie:

```json
{
  "message": "登入成功",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Shao"
  }
}
```

When two-factor authentication is required, the response does not set the session cookie:

```json
{
  "require2FA": true,
  "userId": "uuid",
  "displayName": "Shao"
}
```

Complete 2FA with `POST /auth/2fa/verify`:

```json
{
  "userId": "uuid",
  "token": "123456"
}
```

Possible errors: `400` missing fields, `401` invalid credentials.

### POST /auth/logout

No request body. Clears the session cookie.

Response `200`:

```json
{ "message": "已登出" }
```

### GET /auth/me

Returns the current user.

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Shao",
    "nickname": "Shao",
    "twoFactorEnabled": false,
    "hasPassword": true,
    "hasPin": false,
    "googleLinked": false,
    "discordLinked": false,
    "createdAt": "2026-07-15T00:00:00.000Z",
    "lastLoginAt": "2026-07-16T00:00:00.000Z"
  }
}
```

Returns `401` when there is no valid session.

### POST /auth/2fa/verify

Verifies a six-digit TOTP during login or while enabling 2FA. During login, use the `userId` returned by `POST /auth/login`.

Request:

```json
{
  "userId": "uuid",
  "token": "123456"
}
```

Successful response `200` sets the `app_session` cookie:

```json
{
  "message": "驗證成功",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Shao"
  }
}
```

Possible errors: `400` missing parameters or 2FA is not configured, `401` invalid token, `404` user not found.

## Data shapes

### Notebook

```json
{
  "id": "uuid",
  "title": "JavaScript 遊戲開發筆記",
  "description": "用 CLI 小遊戲學 JavaScript",
  "createdAt": "2026-07-15T00:00:00.000Z",
  "updatedAt": "2026-07-15T00:00:00.000Z"
}
```

### Chapter

```json
{
  "id": "uuid",
  "notebookId": "uuid",
  "parentId": null,
  "title": "第一章 基礎",
  "orderIndex": 1,
  "isCollapsed": false,
  "lessons": []
}
```

### Lesson

```json
{
  "id": "uuid",
  "notebookId": "uuid",
  "chapterId": "uuid",
  "title": "1.1 變數",
  "orderIndex": 1,
  "markdownContent": "這是文章內容。",
  "htmlContent": "<p>這是文章內容。</p>",
  "codeLanguage": "javascript",
  "runtime": "browser-js",
  "codeContent": "console.log('hello');",
  "outputContent": "hello",
  "autoRun": false,
  "maxRuntimeMs": 10000,
  "createdAt": "2026-07-15T00:00:00.000Z",
  "updatedAt": "2026-07-15T00:00:00.000Z"
}
```

## Notebooks

### GET /code_notebook/notebooks

Response `200`:

```json
{ "notebooks": [] }
```

### POST /code_notebook/notebooks

Request:

```json
{
  "title": "JavaScript 遊戲開發筆記",
  "description": "用 CLI 小遊戲學 JavaScript"
}
```

`title` is required. `description` is optional and may be `null`.

Response `201`:

```json
{ "notebook": { "id": "uuid", "title": "JavaScript 遊戲開發筆記", "description": null, "createdAt": "2026-07-15T00:00:00.000Z", "updatedAt": "2026-07-15T00:00:00.000Z" } }
```

### GET /code_notebook/notebooks/:notebookId

Response `200`: `{ "notebook": Notebook }`.

### PATCH /code_notebook/notebooks/:notebookId

Request may contain either field:

```json
{ "title": "新標題", "description": "新說明" }
```

Response `200`: `{ "notebook": Notebook }`.

### DELETE /code_notebook/notebooks/:notebookId

Deletes the notebook and its chapters and lessons.

Response `200`:

```json
{ "ok": true }
```

### GET /code_notebook/notebooks/:notebookId/tree

Response `200`:

```json
{
  "notebook": {
    "id": "uuid",
    "title": "JavaScript 遊戲開發筆記",
    "description": null,
    "createdAt": "2026-07-15T00:00:00.000Z",
    "updatedAt": "2026-07-15T00:00:00.000Z"
  },
  "chapters": [
    {
      "id": "uuid",
      "notebookId": "uuid",
      "parentId": null,
      "title": "第一章 基礎",
      "orderIndex": 1,
      "isCollapsed": false,
      "lessons": [
        {
          "id": "uuid",
          "notebookId": "uuid",
          "chapterId": "uuid",
          "title": "1.1 變數",
          "orderIndex": 1,
          "codeLanguage": "javascript",
          "runtime": "browser-js",
          "autoRun": false,
          "maxRuntimeMs": 10000
        }
      ]
    }
  ]
}
```

## Chapters

### POST /code_notebook/chapters

Request:

```json
{
  "notebookId": "uuid",
  "title": "第一章 基礎",
  "parentId": null,
  "orderIndex": 1,
  "isCollapsed": false
}
```

`notebookId` and `title` are required. Response `201`: `{ "chapter": Chapter }`.

### PATCH /code_notebook/chapters/:chapterId

Request may contain `title`, `parentId`, `orderIndex`, or `isCollapsed`.

```json
{ "title": "第一章 JavaScript 基礎", "isCollapsed": true }
```

Response `200`: `{ "chapter": Chapter }`.

### DELETE /code_notebook/chapters/:chapterId

Deletes the chapter and lessons directly under it.

Response `200`:

```json
{ "ok": true }
```

### PUT /code_notebook/notebooks/:notebookId/chapters/reorder

Request:

```json
{
  "chapters": [
    { "id": "uuid-1", "orderIndex": 1 },
    { "id": "uuid-2", "orderIndex": 2 }
  ]
}
```

All IDs must belong to the notebook and current user. Response `200` is the complete updated `NotebookTree` object.

## Lessons

### POST /code_notebook/lessons

Request:

```json
{
  "chapterId": "uuid",
  "title": "1.1 setInterval 與地圖渲染",
  "orderIndex": 1,
  "markdownContent": "這段程式每秒重新輸出一次地圖。",
  "codeLanguage": "javascript",
  "runtime": "browser-js",
  "codeContent": "let count = 3;\nconsole.log(count);",
  "outputContent": "",
  "autoRun": false,
  "maxRuntimeMs": 10000
}
```

`chapterId` and `title` are required. Response `201`: `{ "lesson": Lesson }`.

### GET /code_notebook/lessons/:lessonId

Response `200`: `{ "lesson": Lesson }`, including Markdown, rendered HTML, code, settings, and saved output.

### PATCH /code_notebook/lessons/:lessonId

Request may contain:

- `title`
- `chapterId`
- `orderIndex`
- `markdownContent`
- `codeLanguage`
- `runtime`
- `codeContent`
- `outputContent`
- `autoRun`
- `maxRuntimeMs`

Example:

```json
{
  "markdownContent": "## 更新後內容",
  "codeContent": "console.log('updated');",
  "autoRun": false
}
```

Updating `markdownContent` also updates `htmlContent`. Moving a lesson requires a `chapterId` owned by the current user.

Response `200`: `{ "lesson": Lesson }`.

### PATCH /code_notebook/lessons/:lessonId/output

Use this after execution stops or when the user explicitly saves output.

Request:

```json
{ "outputContent": "########\n#  @   #\n########" }
```

Response `200`: `{ "lesson": Lesson }`.

### DELETE /code_notebook/lessons/:lessonId

Response `200`:

```json
{ "ok": true }
```

### PUT /code_notebook/chapters/:chapterId/lessons/reorder

Request:

```json
{
  "lessons": [
    { "id": "uuid-1", "orderIndex": 1 },
    { "id": "uuid-2", "orderIndex": 2 }
  ]
}
```

All IDs must belong to the chapter and current user. Response `200` is the complete updated `NotebookTree` object.

## Markdown

### POST /code_notebook/markdown/render

Renders Markdown without saving it.

Request:

```json
{ "markdown": "## 標題\n\n`console.log()` 會輸出文字。" }
```

Response `200`:

```json
{ "html": "<h2>標題</h2>\n<p><code>console.log()</code> 會輸出文字。</p>" }
```

Raw HTML is escaped. The first release supports headings, paragraphs, unordered lists, fenced code blocks, inline code, bold, italic, and HTTP/HTTPS links.

## Field naming

The supplied TypeScript client uses camelCase. The backend also accepts snake_case aliases for Code Notebook input fields, but new frontend code should consistently use camelCase.

## Execution boundary

The backend never executes lesson code. The frontend runs JavaScript in a disposable Web Worker or sandboxed iframe, enforces `maxRuntimeMs`, captures console output, and optionally saves the final output through the output endpoint.
