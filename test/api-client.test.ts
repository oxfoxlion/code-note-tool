import { describe, expect, it, vi } from "vitest";

import {
  ApiConnectionError,
  authApi,
  codeNotebookApi,
} from "../lib/code-notebook/api-client";

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

  it("sends credentialed login requests", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          message: "登入成功",
          user: {
            id: "user-id",
            email: "user@example.com",
            displayName: "Shao",
            nickname: null,
            twoFactorEnabled: false,
            hasPassword: true,
            hasPin: false,
            googleLinked: false,
            discordLinked: false,
            createdAt: "2026-07-15T00:00:00.000Z",
            lastLoginAt: null,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await authApi.login({
      email: "user@example.com",
      password: "password",
    });

    expect(response.require2FA).toBeFalsy();
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3001/auth/login",
      expect.objectContaining({
        body: JSON.stringify({
          email: "user@example.com",
          password: "password",
        }),
        credentials: "include",
        method: "POST",
      })
    );
  });

  it("throws a clear connection error when fetch cannot reach the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );

    await expect(authApi.me()).rejects.toBeInstanceOf(ApiConnectionError);
  });
});
