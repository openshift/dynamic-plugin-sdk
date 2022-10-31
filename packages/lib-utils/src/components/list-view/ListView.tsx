import { Pagination, PaginationVariant } from '@patternfly/react-core';
import type {
  ConditionalFilterItem,
  FilterChipGroup,
} from '@redhat-cloud-services/frontend-components';
import { PrimaryToolbar } from '@redhat-cloud-services/frontend-components';
import type { ActionsProps } from '@redhat-cloud-services/frontend-components/PrimaryToolbar/Actions';
import { debounce, omit } from 'lodash-es';
import * as React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { parseFiltersFromURL, setFiltersToURL } from '../../utils/url-sync';
import type { VirtualizedTableProps } from '../table/VirtualizedTable';
import VirtualizedTable from '../table/VirtualizedTable';
import './list-view.css';

export type ListViewProps = VirtualizedTableProps & {
  /** Optional custom onFilter callback. */
  onFilter?: (
    filterValues: Record<string, string[]>,
    activeFilter?: ConditionalFilterItem,
  ) => unknown[];
  /** Optional array of filterBy options. */
  filters?: ConditionalFilterItem[];
  /** Optional array of toolbar global actions. */
  globalActions?: ActionsProps;
};

export function filterDefault(data: unknown[], filterValues: Record<string, string[]>): unknown[] {
  return data.filter((item) =>
    Object.entries(filterValues).every(([key, values]) =>
      values.every((v) => String(Object(item)[key]).toLowerCase().includes(v.toLowerCase())),
    ),
  );
}

const calculatePage = (limit = 10, offset = 0) => Math.floor(offset / limit) + 1;
const calculateOffset = (page = 1, limit = 10) => (page - 1) * limit;

const ListView = ({
  columns,
  data = [],
  filters = [],
  isRowSelected,
  onSelect,
  onFilter,
  loadError,
  loaded,
  rowActions,
  globalActions,
  Row,
  virtualized,
  CustomEmptyState,
  emptyStateDescription,
  CustomNoDataEmptyState,
  'aria-label': ariaLabel,
}: ListViewProps) => {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = React.useState<string>(filters?.[0]?.id || '');
  const [filteredData, setFilteredData] = React.useState(data);
  const [searchParams, setSearchParams] = useSearchParams();
  const [useURL, setUseURL] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    limit: 10,
    offset: 0,
  });
  const filterValues = React.useRef<Record<string, string[]>>({});
  const inputValue = React.useRef<string>('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedToggleURL = React.useCallback(
    debounce(() => setUseURL(true), 2000),
    [setUseURL],
  );

  React.useEffect(() => {
    if (useURL) {
      filterValues.current = parseFiltersFromURL(
        new URLSearchParams(location.search),
        filters.map((item) => String(item.id)).filter(Boolean),
      );
    }
    debouncedToggleURL();
    if (filters) {
      setFilteredData(
        onFilter && activeFilter
          ? onFilter(
              filterValues.current,
              filters.find((item) => item.id === activeFilter),
            )
          : filterDefault([...data], filterValues.current),
      );
    }
  }, [
    location,
    activeFilter,
    data,
    filters,
    onFilter,
    useURL,
    pagination.limit,
    pagination.offset,
    debouncedToggleURL,
  ]);

  React.useEffect(() => {
    inputValue.current = activeFilter ? filterValues.current[activeFilter]?.[0] : '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {loaded && (
        <PrimaryToolbar
          pagination={
            virtualized
              ? undefined
              : {
                  isCompact: false,
                  itemCount: (filters ? filteredData : data).length,
                  page: calculatePage(pagination.limit, pagination.offset),
                  perPage: pagination.limit,
                  onSetPage: (
                    e: React.MouseEvent | React.KeyboardEvent | MouseEvent,
                    page: number,
                  ) =>
                    setPagination({
                      ...pagination,
                      offset: calculateOffset(page, pagination.limit),
                    }),
                  onPerPageSelect: (
                    e: React.MouseEvent | React.KeyboardEvent | MouseEvent,
                    perPage: number,
                  ) => setPagination({ limit: perPage, offset: 0 }),
                  titles: { paginationTitle: 'Above table pagination' },
                }
          }
          actionsConfig={globalActions}
          filterConfig={{
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore:next-line
            items: [
              ...(filters && filters.length > 0
                ? filters.map(({ label, type, id }) => ({
                    name: label,
                    type,
                    value: id,
                    label: label ?? id,
                    filterValues: {
                      onChange: (
                        event: MouseEvent | React.ChangeEvent | React.FormEvent,
                        value: string | number | undefined,
                      ) => {
                        if (activeFilter) {
                          inputValue.current = String(value);
                          if (useURL) {
                            setUseURL(false);
                          }
                          setFiltersToURL(
                            searchParams,
                            setSearchParams,
                            filters.map((item) => item.id as string).filter(Boolean),
                            String(value)?.length > 0
                              ? {
                                  ...filterValues.current,
                                  [activeFilter]: [value],
                                }
                              : omit(filterValues.current, activeFilter),
                          );
                        }
                        if (!virtualized) {
                          setPagination({ ...pagination, offset: 0 });
                        }
                      },
                      placeholder: `Search by ${
                        filters.find((item) => item.id === activeFilter)?.label
                      }`,
                      value: inputValue.current || '',
                    },
                  }))
                : []),
            ],
            onChange: (
              e: MouseEvent | React.ChangeEvent | React.FormEvent,
              value: string | number | undefined,
            ) => {
              setActiveFilter(String(value));
              inputValue.current = value ? filterValues.current[value]?.[0] : '';
            },
            value: String(activeFilter),
          }}
          activeFiltersConfig={{
            filters: Object.entries(filterValues.current).map(([key, value]) => ({
              category: key,
              chips: (Array.isArray(value) ? value : [value]).map((name: string) => ({
                name,
              })),
            })),
            onDelete: (e, items) => {
              const values = filterValues.current;
              (items as FilterChipGroup[]).forEach(({ chips, category }) => {
                chips?.forEach((chip) => {
                  values[category] = values[category].filter((item) => item !== chip.name);
                  if (activeFilter === category) {
                    inputValue.current = '';
                  }
                });
              });
              setFiltersToURL(
                searchParams,
                setSearchParams,
                filters.map((item) => item.id as string),
                items.length > 0 ? values : {},
              );
              if (!virtualized) {
                setPagination({ ...pagination, offset: 0 });
              }
            },
            showDeleteButton: Object.values(filterValues.current).some((value) => value.length > 0),
          }}
        />
      )}
      <VirtualizedTable
        aria-label={ariaLabel}
        areFiltersApplied={Object.values(filterValues.current).some((value) => value?.length > 0)}
        data={filters ? filteredData : data}
        loaded={loaded}
        columns={columns}
        isRowSelected={isRowSelected}
        onSelect={onSelect}
        rowActions={rowActions}
        pagination={pagination}
        Row={Row}
        virtualized={virtualized}
        emptyStateDescription={emptyStateDescription}
        CustomEmptyState={CustomEmptyState}
        loadError={loadError}
        CustomNoDataEmptyState={CustomNoDataEmptyState}
      />
      {!virtualized && (
        <Pagination
          variant={PaginationVariant.bottom}
          itemCount={(filters ? filteredData : data).length}
          perPage={pagination.limit}
          page={calculatePage(pagination.limit, pagination.offset)}
          onSetPage={(e, page) =>
            setPagination({ ...pagination, offset: calculateOffset(page, pagination.limit) })
          }
          onPerPageSelect={(e, value) => setPagination({ limit: value, offset: 0 })}
          titles={{ paginationTitle: 'Below table pagination' }}
        />
      )}
    </>
  );
};

export default ListView;
