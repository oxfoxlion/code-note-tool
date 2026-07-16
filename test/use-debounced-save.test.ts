import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebouncedSave } from "@/hooks/use-debounced-save";

describe("useDebouncedSave", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves changed values after the debounce delay", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue({ ok: true });

    const { rerender, result } = renderHook(
      ({ value, persistedValue }) =>
        useDebouncedSave({
          value,
          persistedValue,
          delayMs: 500,
          save,
        }),
      {
        initialProps: {
          value: "saved",
          persistedValue: "saved",
        },
      },
    );

    rerender({ value: "draft", persistedValue: "saved" });

    expect(result.current.status).toBe("idle");
    expect(save).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(save).toHaveBeenCalledWith("draft");
    expect(result.current.status).toBe("saved");
  });

  it("flushes pending changes immediately", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useDebouncedSave({
        value: "draft",
        persistedValue: "saved",
        delayMs: 1000,
        save,
      }),
    );

    let flushResult = false;
    await act(async () => {
      flushResult = await result.current.flush();
    });

    expect(flushResult).toBe(true);
    expect(save).toHaveBeenCalledWith("draft");
    expect(result.current.status).toBe("saved");
  });

  it("keeps pending changes when saving fails", async () => {
    vi.useFakeTimers();
    const save = vi.fn().mockRejectedValue(new Error("failed"));

    const { result } = renderHook(() =>
      useDebouncedSave({
        value: "draft",
        persistedValue: "saved",
        delayMs: 1000,
        save,
        getErrorMessage: () => "儲存失敗",
      }),
    );

    let flushResult = true;
    await act(async () => {
      flushResult = await result.current.flush();
    });

    expect(flushResult).toBe(false);
    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("儲存失敗");
    expect(result.current.hasPendingChanges()).toBe(true);
  });
});
