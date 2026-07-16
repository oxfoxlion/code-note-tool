export const runnerWorkerSource = `
const trackedTimeouts = new Set();
const trackedIntervals = new Set();
const originalSetTimeout = self.setTimeout.bind(self);
const originalClearTimeout = self.clearTimeout.bind(self);
const originalSetInterval = self.setInterval.bind(self);
const originalClearInterval = self.clearInterval.bind(self);
let isUserCodeSettled = false;
let isRunnerSettled = false;
let activeTimerCallbacks = 0;

function post(event) {
  self.postMessage(event);
}

function writeStream(type, value) {
  post({
    type,
    value: String(value),
  });
}

const processShim = {
  stdout: {
    write: (value) => {
      writeStream("stdout", value);
      return true;
    },
  },
  stderr: {
    write: (value) => {
      writeStream("stderr", value);
      return true;
    },
  },
};

self.process = processShim;

function serializeValue(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.stack || value.message;
  }

  try {
    const json = JSON.stringify(value);
    return json === undefined ? String(value) : json;
  } catch {
    return String(value);
  }
}

function clearTrackedTimers() {
  for (const timeoutId of trackedTimeouts) {
    originalClearTimeout(timeoutId);
  }
  for (const intervalId of trackedIntervals) {
    originalClearInterval(intervalId);
  }
  trackedTimeouts.clear();
  trackedIntervals.clear();
}

function hasTrackedTimers() {
  return trackedTimeouts.size > 0 || trackedIntervals.size > 0;
}

function finishIfIdle() {
  if (
    isRunnerSettled ||
    !isUserCodeSettled ||
    activeTimerCallbacks > 0 ||
    hasTrackedTimers()
  ) {
    return;
  }

  isRunnerSettled = true;
  post({ type: "finish" });
}

function postRuntimeError(error) {
  if (isRunnerSettled) {
    return;
  }

  isRunnerSettled = true;
  post({
    type: "error",
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  clearTrackedTimers();
}

function runTimerHandler(handler, args) {
  activeTimerCallbacks += 1;
  try {
    if (typeof handler === "function") {
      handler(...args);
      return;
    }
    new Function(String(handler))();
  } catch (error) {
    postRuntimeError(error);
  } finally {
    activeTimerCallbacks -= 1;
    finishIfIdle();
  }
}

self.setTimeout = (handler, timeout, ...args) => {
  const timeoutId = originalSetTimeout(() => {
    trackedTimeouts.delete(timeoutId);
    runTimerHandler(handler, args);
  }, timeout);
  trackedTimeouts.add(timeoutId);
  return timeoutId;
};

self.clearTimeout = (timeoutId) => {
  trackedTimeouts.delete(timeoutId);
  originalClearTimeout(timeoutId);
  finishIfIdle();
};

self.setInterval = (handler, timeout, ...args) => {
  const intervalId = originalSetInterval(() => {
    runTimerHandler(handler, args);
  }, timeout);
  trackedIntervals.add(intervalId);
  return intervalId;
};

self.clearInterval = (intervalId) => {
  trackedIntervals.delete(intervalId);
  originalClearInterval(intervalId);
  finishIfIdle();
};

for (const level of ["log", "warn", "error"]) {
  console[level] = (...values) => {
    post({
      type: "console",
      level,
      values: values.map(serializeValue),
    });
  };
}

self.onmessage = async (message) => {
  if (message.data?.type !== "run") {
    return;
  }

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const runUserCode = new AsyncFunction(message.data.code);
    await runUserCode();
    isUserCodeSettled = true;
    finishIfIdle();
  } catch (error) {
    postRuntimeError(error);
  }
};
`;
