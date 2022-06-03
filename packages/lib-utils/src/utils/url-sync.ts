import type { History } from 'history';

export const applyFiltersToURL = (
  history: History,
  keys: string[],
  filterValues: Record<string, string>,
) => {
  const searchParams = new URLSearchParams(history.location.search);
  keys.forEach((key: string) => {
    searchParams.delete(key);
    if (filterValues[key]) {
      searchParams.set(key, filterValues[key]);
    }
  });

  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
};

export const syncFiltersWithURL = (
  history: History,
  keys: string[],
  defaults: Record<string, string> = {},
) => {
  const searchParams = new URLSearchParams(history.location.search);

  let filters: Record<string, string> = keys.reduce((acc, key) => {
    const values = searchParams.getAll(key);
    return {
      ...acc,
      [key]: values.length > 1 ? values : values[0],
    };
  }, {});

  Object.keys(defaults).forEach((key: string) => {
    const value = defaults[key];
    filters = {
      ...filters,
      [key]: (value?.length > 0 && value) || filters[key],
    };

    if (Array.isArray(value)) {
      value.forEach(
        (item) => searchParams.getAll(key).includes(item) || searchParams.append(key, item),
      );
    } else if (!searchParams.get(key) && value) {
      searchParams.set(key, value);
    }
  });

  Object.keys(filters).forEach((key) => !!filters[key] || delete filters[key]);
  history.replace({
    pathname: history.location.pathname,
    search: searchParams.toString(),
  });
  return filters;
};
