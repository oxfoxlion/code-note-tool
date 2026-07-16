import { afterEach, describe, expect, it, vi } from "vitest";

import { runBrowserJavaScript } from "@/lib/code-runner/browser-runner";
import { appendRunnerEventOutput } from "@/lib/code-runner/output";

class FakeWorker {
  static instances: FakeWorker[] = [];

  onmessage: ((message: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();

  constructor(public readonly url: string) {
    FakeWorker.instances.push(this);
  }
}

describe("code runner output", () => {
  it("appends stdout writes without adding extra line breaks", () => {
    let output = "";

    output = appendRunnerEventOutput(output, {
      type: "stdout",
      value: "first line\n",
    });
    output = appendRunnerEventOutput(output, {
      type: "stdout",
      value: "second line\n",
    });

    expect(output).toBe("first line\nsecond line\n");
  });

  it("formats console, error, stopped, and timeout events without finish noise", () => {
    let output = "";

    output = appendRunnerEventOutput(output, {
      type: "console",
      level: "log",
      values: ["hello", "world"],
    });
    output = appendRunnerEventOutput(output, {
      type: "error",
      message: "Boom",
      stack: "stack trace",
    });
    output = appendRunnerEventOutput(output, { type: "finish" });
    output = appendRunnerEventOutput(output, { type: "stopped" });
    output = appendRunnerEventOutput(output, {
      type: "timeout",
      maxRuntimeMs: 1000,
    });

    expect(output).toBe(
      "hello world\nBoom\nstack trace\nStopped.\nTimed out after 1000 ms.",
    );
  });
});

describe("runBrowserJavaScript", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    FakeWorker.instances = [];
  });

  it("emits stopped and terminates the worker", () => {
    const events: string[] = [];
    vi.stubGlobal("Worker", FakeWorker);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:runner"),
      revokeObjectURL: vi.fn(),
    });

    const runner = runBrowserJavaScript({
      code: "console.log('hello')",
      maxRuntimeMs: 1000,
      onEvent: (event) => events.push(event.type),
    });

    runner.stop();

    expect(events).toEqual(["stopped"]);
    expect(FakeWorker.instances[0]?.terminate).toHaveBeenCalledOnce();
  });

  it("emits timeout and terminates the worker", async () => {
    vi.useFakeTimers();
    const events: string[] = [];
    vi.stubGlobal("Worker", FakeWorker);
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:runner"),
      revokeObjectURL: vi.fn(),
    });

    runBrowserJavaScript({
      code: "while (true) {}",
      maxRuntimeMs: 1000,
      onEvent: (event) => events.push(event.type),
    });

    await vi.advanceTimersByTimeAsync(1000);

    expect(events).toEqual(["timeout"]);
    expect(FakeWorker.instances[0]?.terminate).toHaveBeenCalledOnce();
  });
});
