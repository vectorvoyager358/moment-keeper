type ErrorLike = {
  message?: string;
  code?: string;
  status?: number;
};

export function isAuthExpiredError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { message, code, status } = error as ErrorLike;
  const normalized = message?.toLowerCase() ?? "";

  return (
    status === 401 ||
    code === "PGRST301" ||
    normalized.includes("jwt expired") ||
    normalized.includes("invalid jwt") ||
    normalized.includes("session expired") ||
    normalized.includes("refresh token") ||
    normalized.includes("not authenticated")
  );
}

export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = (error as ErrorLike).message?.toLowerCase() ?? "";

  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("fetch failed")
  );
}

export function isUploadTooLargeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = (error as ErrorLike).message?.toLowerCase() ?? "";

  return (
    message.includes("unexpected end of form") ||
    message.includes("request entity too large") ||
    message.includes("payload too large") ||
    message.includes("body exceeded")
  );
}

export function toUserErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (!error) {
    return fallback;
  }

  if (isAuthExpiredError(error)) {
    return "Your session expired. Please log in again.";
  }

  if (isNetworkError(error)) {
    return "Could not reach the server. Check your connection and try again.";
  }

  if (isUploadTooLargeError(error)) {
    return "That file is too large to upload. Use a smaller photo, video (max 50 MB), or audio (max 25 MB).";
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && "message" in error
        ? String((error as ErrorLike).message ?? "")
        : String(error);

  if (!message || message.length > 200) {
    return fallback;
  }

  if (/^(PGRST|22|23)\w*/.test(message)) {
    return fallback;
  }

  return message;
}
