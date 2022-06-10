import type { History } from 'history';
import * as _ from 'lodash';

export const applyFiltersToURL = (
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

export const syncFiltersWithURL = (
  history,
  keys: string[],
  defaults: Record<string, string[]> = {},
) => {
  const searchParams = new URLSearchParams(history.location.search);

  let filters: Record<string, string[]> = keys.reduce((acc, key) => {
    const values = searchParams.getAll(key);
    return {
      ...acc,
      [key]: values,
    };
  }, {});

  filters = _.merge(filters, defaults);

  Object.keys(filters).forEach((key) => filters[key]?.length > 0 || delete filters[key]);
  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
  return filters;
};
