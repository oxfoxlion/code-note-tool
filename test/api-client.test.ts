import { describe, expect, it } from "vitest";

import { authApi, codeNotebookApi } from "../lib/code-notebook/api-client";

describe("frontend API client contract", () => {
  it("exposes auth endpoints from the backend handoff", () => {
    expect(authApi.register).toBeTypeOf("function");
    expect(authApi.login).toBeTypeOf("function");
    expect(authApi.verify2FA).toBeTypeOf("function");
    expect(authApi.me).toBeTypeOf("function");
    expect(authApi.logout).toBeTypeOf("function");
  });

  it("exposes the notebook workspace endpoints", () => {
    expect(codeNotebookApi.listNotebooks).toBeTypeOf("function");
    expect(codeNotebookApi.getNotebookTree).toBeTypeOf("function");
    expect(codeNotebookApi.getLesson).toBeTypeOf("function");
    expect(codeNotebookApi.renderMarkdown).toBeTypeOf("function");
  });
});
