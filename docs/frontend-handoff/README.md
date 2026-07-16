# Code Notebook Frontend Handoff

This folder is the copy-ready integration contract for a Next.js frontend.

## Contents

- `types.ts`: API domain and input types.
- `api-client.ts`: typed fetch client for Auth and Code Notebook endpoints.
- `.env.example`: required public API origin.
- `UI-SPEC.md`: first-release interface, saving, runner, and error behavior.
- `API.md`: self-contained Auth and Code Notebook endpoint contract.

## Next.js setup

1. Copy `types.ts` and `api-client.ts` into the frontend, for example `src/lib/code-notebook/`.
2. Copy `.env.example` to `.env.local` and change the API origin if needed.
3. Call `authApi.me()` when the application loads.
4. Use `codeNotebookApi` for all notebook operations.
5. Catch `ApiError`; redirect to the login page when `error.status === 401`.

Example:

```ts
import { ApiError, codeNotebookApi } from "@/lib/code-notebook/api-client";

try {
  const { notebooks } = await codeNotebookApi.listNotebooks();
  // update UI state
} catch (error) {
  if (error instanceof ApiError && error.status === 401) {
    window.location.assign("/login");
  }
  throw error;
}
```

## Authentication and deployment

The server uses the HTTP-only `app_session` cookie. Browser requests already include
`credentials: "include"` through the provided client.

For separate frontend and API origins, the backend must allow the exact frontend origin,
enable credentialed CORS, and configure cookie attributes for that deployment. A same-origin
reverse proxy is usually simpler for production.

The API URL must be an origin such as `https://api.example.com`, without
`/code_notebook` and without a trailing slash.

## Package boundary

This directory is intentionally self-contained and can be copied without the backend repository.
`API.md` includes every endpoint required by this handoff. When the backend contract changes,
update the copied contract and typed client together before sending a new handoff package.
