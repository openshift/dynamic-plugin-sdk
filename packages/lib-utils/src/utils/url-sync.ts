import type { History } from 'history';

export const setFiltersToURL = (
  history: History,
  keys: string[],
  filterValues: Record<string, string[]>,
) => {
  const searchParams = new URLSearchParams(history.location.search);
  keys.forEach((key: string) => {
    searchParams.delete(key);
    if (filterValues[key]) {
      filterValues[key].map((value) => searchParams.append(key, value));
    }
  });

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
};

export const parseFiltersFromURL = (
  searchParams: URLSearchParams,
  keys: string[],
): Record<string, string[]> =>
  keys.reduce((acc, key) => {
    const values = searchParams.getAll(key);
    return {
      ...acc,
      [key]: values,
    };
  }, {});
