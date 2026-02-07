/**
 * Concurrency control utilities for batched async operations.
 */

/**
 * Execute an array of async tasks with concurrency limit.
 * Tasks are processed in a pool pattern where a new task starts
 * as soon as one finishes, maintaining the concurrency limit.
 *
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param concurrency - Maximum number of concurrent tasks (default: 5)
 * @returns Array of PromiseSettledResult in the same order as input items
 */
export async function concurrentMap<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = 5
): Promise<PromiseSettledResult<R>[]> {
  if (items.length === 0) return [];

  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        const value = await fn(items[index]);
        results[index] = { status: 'fulfilled', value };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}
