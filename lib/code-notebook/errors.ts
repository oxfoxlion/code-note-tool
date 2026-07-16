import { ApiConnectionError, ApiError } from "./api-client";

export function getApiErrorStatus(error: unknown) {
  return error instanceof ApiError ? error.status : null;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError || error instanceof ApiConnectionError) {
    return error.message;
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown) {
  return getApiErrorStatus(error) === 401;
}

export function isNotFoundError(error: unknown) {
  return getApiErrorStatus(error) === 404;
}

export function getRetryableErrorMessage(error: unknown, fallback: string) {
  const status = getApiErrorStatus(error);

  if (status === 500) {
    return `${getApiErrorMessage(error, fallback)} 請稍後重試。`;
  }

  return getApiErrorMessage(error, fallback);
}
