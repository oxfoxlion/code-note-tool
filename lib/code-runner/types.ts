export type RunnerConsoleLevel = "log" | "warn" | "error";

export type RunnerEvent =
  | {
      type: "console";
      level: RunnerConsoleLevel;
      values: string[];
    }
  | {
      type: "stdout";
      value: string;
    }
  | {
      type: "stderr";
      value: string;
    }
  | {
      type: "error";
      message: string;
      stack?: string;
    }
  | {
      type: "finish";
    }
  | {
      type: "stopped";
    }
  | {
      type: "timeout";
      maxRuntimeMs: number;
    };

export type RunnerStatus = "idle" | "running" | "stopped" | "timeout" | "error" | "finished";

export type RunnerRunOptions = {
  code: string;
  maxRuntimeMs: number;
  onEvent: (event: RunnerEvent) => void;
};

export type DisposableRunner = {
  stop: () => void;
  dispose: () => void;
};
