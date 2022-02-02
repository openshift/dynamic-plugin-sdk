const isPromiseFulfilledResult = <T>(r: PromiseSettledResult<T>): r is PromiseFulfilledResult<T> =>
  r.status === 'fulfilled';

const isPromiseRejectedResult = (r: PromiseSettledResult<unknown>): r is PromiseRejectedResult =>
  r.status === 'rejected';

/**
 * Unwrap the results of `Promise.allSettled()` call for easier processing.
 */
const unwrapPromiseSettledResults = <T>(
  results: PromiseSettledResult<T>[],
): [fulfilledValues: T[], rejectedReasons: unknown[]] => [
  results.filter(isPromiseFulfilledResult).map((r) => r.value),
  results.filter(isPromiseRejectedResult).map((r) => r.reason),
];

/**
 * Await `Promise.allSettled(promises)` and unwrap the results.
 *
 * Note that the Promise returned by `Promise.allSettled()` never rejects.
 */
export const settleAllPromises = async <T>(promises: Promise<T>[]) => {
  const results = await Promise.allSettled(promises);
  return unwrapPromiseSettledResults(results);
};
