"use client";

import type { DisposableRunner, RunnerEvent, RunnerRunOptions } from "./types";
import { runnerWorkerSource } from "./worker-source";

function createRunnerWorker() {
  const blob = new Blob([runnerWorkerSource], {
    type: "text/javascript",
  });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);

  return {
    worker,
    dispose: () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    },
  };
}

export function runBrowserJavaScript({
  code,
  maxRuntimeMs,
  onEvent,
}: RunnerRunOptions): DisposableRunner {
  const { worker, dispose } = createRunnerWorker();
  let isDisposed = false;
  const timeoutId = window.setTimeout(() => {
    if (isDisposed) {
      return;
    }

    onEvent({ type: "timeout", maxRuntimeMs });
    isDisposed = true;
    dispose();
  }, maxRuntimeMs);

  const finish = (event: RunnerEvent) => {
    if (isDisposed) {
      return;
    }

    onEvent(event);
    window.clearTimeout(timeoutId);
    isDisposed = true;
    dispose();
  };

  worker.onmessage = (message: MessageEvent<RunnerEvent>) => {
    if (message.data.type === "finish" || message.data.type === "error") {
      finish(message.data);
      return;
    }

    onEvent(message.data);
  };

  worker.onerror = (event) => {
    finish({
      type: "error",
      message: event.message || "JavaScript runner failed.",
      stack: `${event.filename}:${event.lineno}:${event.colno}`,
    });
  };

  worker.postMessage({
    type: "run",
    code,
  });

  return {
    stop: () => {
      if (isDisposed) {
        return;
      }

      onEvent({ type: "stopped" });
      window.clearTimeout(timeoutId);
      isDisposed = true;
      dispose();
    },
    dispose: () => {
      if (isDisposed) {
        return;
      }

      window.clearTimeout(timeoutId);
      isDisposed = true;
      dispose();
    },
  };
}
