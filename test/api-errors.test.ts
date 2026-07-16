import { describe, expect, it } from "vitest";

import { ApiConnectionError, ApiError } from "@/lib/code-notebook/api-client";
import {
  getApiErrorMessage,
  getApiErrorStatus,
  getRetryableErrorMessage,
  isNotFoundError,
  isUnauthorizedError,
} from "@/lib/code-notebook/errors";

describe("API error helpers", () => {
  it("extracts status and backend messages from ApiError", () => {
    const error = new ApiError(400, "Title is required");

    expect(getApiErrorStatus(error)).toBe(400);
    expect(getApiErrorMessage(error, "fallback")).toBe("Title is required");
  });

  it("detects auth and not found errors", () => {
    expect(isUnauthorizedError(new ApiError(401, "尚未登入"))).toBe(true);
    expect(isNotFoundError(new ApiError(404, "Not found"))).toBe(true);
    expect(isUnauthorizedError(new Error("nope"))).toBe(false);
  });

  it("returns connection error messages and fallback messages", () => {
    expect(getApiErrorMessage(new ApiConnectionError("Cannot connect"), "fallback")).toBe(
      "Cannot connect",
    );
    expect(getApiErrorMessage(new Error("Unknown"), "fallback")).toBe("fallback");
  });

  it("adds retry guidance for server errors", () => {
    expect(getRetryableErrorMessage(new ApiError(500, "Server failed"), "fallback")).toBe(
      "Server failed 請稍後重試。",
    );
    expect(getRetryableErrorMessage(new ApiError(400, "Bad request"), "fallback")).toBe(
      "Bad request",
    );
  });
});
