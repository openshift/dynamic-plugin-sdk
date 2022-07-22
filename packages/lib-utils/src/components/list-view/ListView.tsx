import {
  SearchInput,
  Select,
  SelectOption,
  SelectVariant,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarItemVariant,
} from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { omit } from 'lodash-es';
import * as React from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { parseFiltersFromURL, setFiltersToURL } from '../../utils/url-sync';
import type { VirtualizedTableProps } from '../table/VirtualizedTable';
import VirtualizedTable from '../table/VirtualizedTable';
import FilterChips from './FilterChips';
import './list-view.css';

export type FilterItem = {
  /** Label of a parameter used for filtering. */
  label: string;
  /** Column name for given filtering parameter. */
  id: string;
};

export type ListViewProps<D> = VirtualizedTableProps<D> & {
  /** Optional custom onFilter callback. */
  onFilter?: (filterValues: Record<string, string[]>, activeFilter?: FilterItem) => D[];
  /** Optional array of filterBy options. */
  filters?: FilterItem[];
};

const ListView: React.FC<ListViewProps<Record<string, unknown>>> = ({
  columns,
  data,
  filters = [],
  isRowSelected,
  onSelect,
  onFilter,
  loadError,
  loaded,
  rowActions,
  Row,
  CustomEmptyState,
  emptyStateDescription,
  loadErrorDefaultText,
  CustomNoDataEmptyState,
  'aria-label': ariaLabel,
}) => {
  const location = useLocation();
  const [activeFilter, setActiveFilter] = React.useState<FilterItem | undefined>(filters?.[0]);
  const [filteredData, setFilteredData] = React.useState(data);
  const [isFilterSelectExpanded, setFilterSelectExpanded] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const filterValues = React.useRef<Record<string, string[]>>({});

  React.useEffect(() => {
    filterValues.current = parseFiltersFromURL(
      new URLSearchParams(location.search),
      filters.map((filter) => filter.id),
    );
    if (filters) {
      setFilteredData(
        onFilter
          ? onFilter(filterValues.current, activeFilter)
          : [...data].filter((item) => {
              let isRelevant = true;
              Object.keys(filterValues.current).forEach((key) => {
                if (
                  filterValues.current[key].some(
                    (filterValue) => !(item[key] as string)?.toLowerCase()?.includes(filterValue),
                  )
                ) {
                  isRelevant = false;
                }
              });
              return isRelevant;
            }),
      );
    }
  }, [location, activeFilter, data, filters, onFilter]);

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          {filters ? (
            <>
              <ToolbarItem key="filter-select">
                <Select
                  toggleIcon={<FilterIcon />}
                  variant={SelectVariant.single}
                  onToggle={(value) => setFilterSelectExpanded(value)}
                  onSelect={(e, selection) => {
                    setActiveFilter(filters.find((item) => item.id === selection));
                    setFilterSelectExpanded(false);
                  }}
                  placeholderText={activeFilter?.label}
                  isOpen={isFilterSelectExpanded}
                >
                  {filters.map((option) => (
                    <SelectOption key={option.id} value={option.id}>
                      {option.label}
                    </SelectOption>
                  ))}
                </Select>
              </ToolbarItem>
              <ToolbarItem variant={ToolbarItemVariant['search-filter']} key="search-filter">
                <SearchInput
                  className="dps-list-view__search"
                  onChange={(value) => {
                    if (activeFilter) {
                      const newValues =
                        value?.length > 0
                          ? { ...filterValues.current, [activeFilter.id]: [value] }
                          : omit(filterValues.current, activeFilter.id);
                      setFiltersToURL(
                        searchParams,
                        setSearchParams,
                        filters.map((filter) => filter.id),
                        newValues,
                      );
                    }
                  }}
                  value={activeFilter ? filterValues.current[activeFilter.id]?.[0] : ''}
                  placeholder={`Filter by ${activeFilter?.label}`}
                />
              </ToolbarItem>
            </>
          ) : null}
        </ToolbarContent>
        {Object.keys(filterValues.current)?.length > 0 && (
          <ToolbarContent className="dps-list-view__filters">
            <ToolbarItem>
              <FilterChips
                filters={filters}
                filterValues={filterValues.current}
                onDelete={(key) => {
                  setFiltersToURL(
                    searchParams,
                    setSearchParams,
                    filters.map((filter) => filter.id),
                    key ? omit(filterValues.current, key) : {},
                  );
                }}
              />
            </ToolbarItem>
          </ToolbarContent>
        )}
      </Toolbar>
      <VirtualizedTable
        aria-label={ariaLabel}
        areFiltersApplied={Object.values(filterValues.current).some((value) => value?.length > 0)}
        data={filters ? filteredData : data}
        loaded={loaded}
        columns={columns}
        isRowSelected={isRowSelected}
        onSelect={onSelect}
        rowActions={rowActions}
        Row={Row}
        emptyStateDescription={emptyStateDescription}
        CustomEmptyState={CustomEmptyState}
        loadError={loadError}
        loadErrorDefaultText={loadErrorDefaultText}
        CustomNoDataEmptyState={CustomNoDataEmptyState}
      />
    </>
  );
};

export default ListView;
