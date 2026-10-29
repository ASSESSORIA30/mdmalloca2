import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * Reads a browser-only value without a hydration mismatch:
 * the server (and hydration) render `serverValue`, the client then renders `read()`.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribeNever, read, () => serverValue);
}
