import { useCallback, useEffect, useState } from "react";
import { toErrorMessage } from "@/lib/api-client";

/**
 * Small data-fetching hook for GET-on-mount screens.
 *
 * Every screen here loads one or a handful of independent endpoints on mount and
 * then mutates the result locally after a write. This hook owns that lifecycle so
 * each page is not reimplementing loading/error/refetch state.
 *
 * A response that arrives after the component unmounts, or after the deps
 * changed, is discarded rather than written into an unmounted tree. Errors are
 * collapsed to a display string here so no component has to unwrap ApiError.
 */
export function useApiData<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[] = [],
  options: { enabled?: boolean } = {},
): {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  /** Re-runs the loader. */
  refetch: () => Promise<void>;
  /** Applies local changes after a write, avoiding a round trip. */
  setData: (updater: T | null | ((current: T | null) => T | null)) => void;
} {
  const { enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  // Starts in the correct state on the first render, so no effect is needed to
  // "sync" it — an effect that calls setState synchronously causes a wasted
  // extra render pass.
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    // The setState calls all live inside async callbacks, never synchronously in
    // the effect body.
    async function load() {
      try {
        const result = await loader();
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (caught) {
        if (!cancelled) setError(toErrorMessage(caught));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
    // `loader` is intentionally excluded: callers pass an inline arrow, so its
    // identity changes every render. `deps` is the caller's contract for when to
    // reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  /**
   * Recreated each render, so it always closes over the current `loader` without
   * needing a ref or a dependency array.
   */
  const refetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await loader());
    } catch (caught) {
      setError(toErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  };

  const applyUpdate = (
    updater: T | null | ((current: T | null) => T | null),
  ) => {
    setData((current) =>
      typeof updater === "function"
        ? (updater as (previous: T | null) => T | null)(current)
        : updater,
    );
  };

  return { data, isLoading, error, refetch, setData: applyUpdate };
}

/**
 * Tracks an in-flight mutation (accept job, update profile, ...) with its own
 * pending flag and error, so forms can disable themselves and surface failures
 * without duplicating that state per screen.
 *
 * Returns the result or null rather than throwing, which lets callers use it
 * directly in a click handler: `if (await save.mutate()) { ... }`.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): {
  mutate: (...args: TArgs) => Promise<TResult | null>;
  isPending: boolean;
  error: string | null;
  reset: () => void;
} {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setIsPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        setError(toErrorMessage(caught));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [action],
  );

  return { mutate, isPending, error, reset: () => setError(null) };
}