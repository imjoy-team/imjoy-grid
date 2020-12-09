export function randId() {
  return Math.random()
    .toString(36)
    .substr(2, 10);
}

export function assert(condition, message) {
  if (!condition) {
    message = message || "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
}
