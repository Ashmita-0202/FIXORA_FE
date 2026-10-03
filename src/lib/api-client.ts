import axios, { AxiosError, type AxiosInstance } from "axios";
import { API_BASE_URL } from "@/config/env";
import { ApiError, defaultMessageForStatus, stripErrorPrefix } from "./errors";
import { TOKEN_STORAGE_KEY } from "./storage";

/**
 * The single axios instance every API service goes through.
 *
 * Interceptors own two cross-cutting concerns so no service has to:
 *   1. attaching the bearer token to outgoing requests
 *   2. turning the backend's several unrelated error shapes into one ApiError
 */

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  // 20s is generous for a local API but stops a hung request from pinning the
  // UI in a loading state indefinitely.
  timeout: 20_000,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Registered by the auth layer so a 401 can clear session state without this
 *  module importing React or the router (which would be a cycle). */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeApiError(error)),
);

/**
 * Maps any axios failure onto a single ApiError.
 *
 * Handles the four distinct shapes the backend can produce:
 *   - a bare JSON array of strings  → HandleFailureResult, e.g. ["NotFound: ..."]
 *   - a bare JSON string           → the 403 branch, which serializes differently
 *   - { "Message": "..." }          → read-all notifications, plus 204-style results
 *   - { "errors": { field: [...] } } → [ApiController] model-binding failures
 *   - { "title", "status", "errors" } → ASP.NET ProblemDetails
 *
 * A FluentValidation failure arrives as `{"Errors": ["msg | msg"]}` because
 * ValidationBehavior joins messages with " | " into a single ValidationException.
 * That is split back apart here.
 */
export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (!axios.isAxiosError(error)) {
    return new ApiError(
      error instanceof Error ? error.message : "Unexpected error.",
      0,
    );
  }

  const status = error.response?.status ?? 0;

  // No response at all: DNS failure, connection refused, CORS block, or timeout.
  if (!error.response) {
    const isTimeout = error.code === "ECONNABORTED";
    return new ApiError(
      isTimeout
        ? "The request took too long. Please check your connection and try again."
        : "Could not reach the server. Please try again.",
      status,
    );
  }

  const { messages, fieldErrors } = extractErrorDetail(error.response.data);

  // Surface the auth-layer logout exactly once, and never while the login call
  // itself is in flight (a 401 there means "bad credentials", not "expired").
  if (status === 401 && !isAuthEndpoint(error.config?.url)) {
    onUnauthorized?.();
  }

  return new ApiError(
    messages[0] ?? defaultMessageForStatus(status),
    status,
    messages,
    fieldErrors,
  );
}

function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return /\/auth\/(login|forgotpassword|resetpassword)\b/i.test(url);
}

function extractErrorDetail(data: unknown): {
  messages: string[];
  fieldErrors: Record<string, string[]>;
} {
  const fieldErrors: Record<string, string[]> = {};

  // Bare array of strings — the common failure shape.
  if (Array.isArray(data)) {
    return { messages: cleanMessages(data), fieldErrors };
  }

  if (typeof data === "string") {
    return { messages: cleanMessages(splitJoinedMessages(data)), fieldErrors };
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    // FluentValidation: {"Errors": ["a | b | c"]}
    const validationErrors = record.Errors;
    if (Array.isArray(validationErrors)) {
      return {
        messages: cleanMessages(
          validationErrors.flatMap((entry) => splitJoinedMessages(String(entry))),
        ),
        fieldErrors,
      };
    }

    // ASP.NET [ApiController] model binding: {"errors": {"Email": ["..."]}}
    const bindingErrors = record.errors ?? record.Errors;
    if (bindingErrors && typeof bindingErrors === "object" && !Array.isArray(bindingErrors)) {
      for (const [field, value] of Object.entries(
        bindingErrors as Record<string, unknown>,
      )) {
        const list = Array.isArray(value) ? value.map(String) : [String(value)];
        fieldErrors[field] = list;
      }
      const flattened = Object.values(fieldErrors).flat();
      return { messages: cleanMessages(flattened), fieldErrors };
    }

    // ProblemDetails / { "Message": "..." }
    for (const key of ["Message", "message", "title", "error", "detail"]) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return { messages: cleanMessages(splitJoinedMessages(value)), fieldErrors };
      }
    }
  }

  return { messages: [], fieldErrors };
}

/**
 * ValidationBehavior joins every failure message with " | " and throws a single
 * ValidationException, so a three-field form error arrives as one long string.
 * Recover the individual messages for display.
 */
function splitJoinedMessages(value: string): string[] {
  return value.includes("|") ? value.split("|").map((part) => part.trim()) : [value];
}

function cleanMessages(messages: string[]): string[] {
  return messages
    .map((message) => stripErrorPrefix(message.trim()))
    .filter((message) => message.length > 0);
}

/** Guard for components: turns any thrown value into a renderable string. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.friendlyMessage;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}