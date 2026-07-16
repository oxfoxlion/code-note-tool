import type { RunnerEvent } from "./types";

const consolePrefix = {
  log: "",
  warn: "warn: ",
  error: "error: ",
} as const;

export function formatRunnerEvent(event: RunnerEvent) {
  switch (event.type) {
    case "console":
      return `${consolePrefix[event.level]}${event.values.join(" ")}`;
    case "stdout":
      return event.value;
    case "stderr":
      return event.value;
    case "error":
      return event.stack ? `${event.message}\n${event.stack}` : event.message;
    case "finish":
      return "";
    case "stopped":
      return "Stopped.";
    case "timeout":
      return `Timed out after ${event.maxRuntimeMs} ms.`;
  }
}

export function appendRunnerEventOutput(output: string, event: RunnerEvent) {
  if (event.type === "stdout" || event.type === "stderr") {
    return `${output}${event.value}`;
  }

  const formattedEvent = formatRunnerEvent(event);

  if (!formattedEvent) {
    return output;
  }

  return output ? `${output}\n${formattedEvent}` : formattedEvent;
}
