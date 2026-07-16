"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type DebouncedSaveStatus = "idle" | "saving" | "saved" | "error";

type UseDebouncedSaveOptions<TValue, TSaved> = {
  value: TValue;
  persistedValue: TValue;
  enabled?: boolean;
  delayMs?: number;
  save: (value: TValue) => Promise<TSaved>;
  onSaved?: (saved: TSaved, value: TValue) => void;
  getErrorMessage?: (error: unknown) => string;
};

const defaultGetErrorMessage = () => "儲存失敗";

export function useDebouncedSave<TValue, TSaved>({
  value,
  persistedValue,
  enabled = true,
  delayMs = 1000,
  save,
  onSaved,
  getErrorMessage = defaultGetErrorMessage,
}: UseDebouncedSaveOptions<TValue, TSaved>) {
  const [status, setStatus] = useState<DebouncedSaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const valueRef = useRef(value);
  const persistedValueRef = useRef(persistedValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightSaveRef = useRef<Promise<boolean> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const hasPendingChanges = useCallback(
    () => enabled && valueRef.current !== persistedValueRef.current,
    [enabled],
  );

  const flush = useCallback(async () => {
    clearPendingTimeout();

    if (!enabled || valueRef.current === persistedValueRef.current) {
      setStatus("idle");
      setErrorMessage(null);
      return true;
    }

    if (inFlightSaveRef.current) {
      return inFlightSaveRef.current;
    }

    const valueToSave = valueRef.current;
    setStatus("saving");
    setErrorMessage(null);

    const savePromise = save(valueToSave)
      .then((saved) => {
        persistedValueRef.current = valueToSave;
        setStatus("saved");
        setErrorMessage(null);
        onSaved?.(saved, valueToSave);
        return true;
      })
      .catch((error: unknown) => {
        setStatus("error");
        setErrorMessage(getErrorMessage(error));
        return false;
      })
      .finally(() => {
        inFlightSaveRef.current = null;
      });

    inFlightSaveRef.current = savePromise;
    return savePromise;
  }, [clearPendingTimeout, enabled, getErrorMessage, onSaved, save]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    persistedValueRef.current = persistedValue;
  }, [persistedValue]);

  useEffect(() => {
    clearPendingTimeout();

    if (!enabled || value === persistedValueRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      void flush();
    }, delayMs);

    return clearPendingTimeout;
  }, [clearPendingTimeout, delayMs, enabled, flush, value]);

  useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

  return {
    status,
    errorMessage,
    hasPendingChanges,
    flush,
  };
}
