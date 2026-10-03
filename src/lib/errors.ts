/**
 * Normalized error type shared by every API service.
 *
 * The backend has no ProblemDetails middleware and no global exception handler,
 * so failures arrive in one of several unrelated shapes. All of them are funnelled
 * through parseApiError() in api-client.ts and surface here as a consistent
 * object, which keeps error handling out of every component.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];
  /** Field-level messages parsed from a ValidationProblemDetails body. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    messages: string[] = [],
    fieldErrors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.messages = messages;
    this.fieldErrors = fieldErrors;
  }

  /** First message, or a status-derived fallback. Safe to render directly. */
  get friendlyMessage(): string {
    return this.messages[0] ?? defaultMessageForStatus(this.status);
  }
}

export function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "That request could not be processed. Please check the details and try again.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 402:
      return "There is a problem with payment.";
    case 403:
      return "You do not have access to this resource.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 409:
      return "That conflicts with the current state. Please refresh and try again.";
    case 500:
      return "Something went wrong on our end. Please try again shortly.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/**
 * The backend prefixes every service-layer failure message with a sentinel that
 * BaseController.HandleFailureResult string-matches to pick the HTTP status, and
 * that prefix is never stripped before serializing. Strip it so the UI shows
 * "Booking not found." rather than "NotFound: Booking not found.".
 */
const ERROR_PREFIX =
  /^(Unauthorized|NotFound|InsufficientFunds|ForbiddenAccess|Conflict|NoContent):\s*/i;

export function stripErrorPrefix(message: string): string {
  return message.replace(ERROR_PREFIX, "").trim();
}