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
import { omit } from 'lodash';
import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { applyFiltersToURL, syncFiltersWithURL } from '../../utils/url-sync';
import type { VirtualizedTableProps } from '../table/VirtualizedTable';
import VirtualizedTable from '../table/VirtualizedTable';
import FilterChips from './FilterChips';
import './table-view.css';

export type FilterItem = {
  /** Label of a parameter used for filtering. */
  label: string;
  /** Column name for given filtering parameter. */
  id: string;
};

export type TableViewProps<D> = VirtualizedTableProps<D> & {
  /** Optional custom onFilter callback. */
  onFilter?: (filterValues: Record<string, string[]>, activeFilter?: FilterItem) => D[];
  /** Optional array of filterBy options. */
  filters?: FilterItem[];
};

const TableView: React.FC<TableViewProps<Record<string, unknown>>> = ({
  columns,
  data,
  filters = [],
  isRowSelected,
  onSelect,
  onFilter,
  loadError,
  loaded,
  Row,
  CustomEmptyState,
  emptyStateDescription,
  loadErrorDefaultText,
  CustomNoDataEmptyState,
  'aria-label': ariaLabel,
}) => {
  const history = useHistory();
  const [activeFilter, setActiveFilter] = React.useState<FilterItem | undefined>(filters?.[0]);
  const [filterValues, setFilterValues] = React.useState<Record<string, string[]>>({});
  const [filteredData, setFilteredData] = React.useState(data);
  const [isFilterSelectExpanded, setFilterSelectExpanded] = React.useState(false);

  React.useEffect(() => {
    const initialFilterValues = syncFiltersWithURL(
      history,
      filters.map((filter) => filter.id),
      filterValues,
    );
    setFilterValues(initialFilterValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    applyFiltersToURL(
      history,
      filters.map((filter) => filter.id),
      filterValues,
    );
    if (filters) {
      setFilteredData(
        onFilter
          ? onFilter(filterValues, activeFilter)
          : [...data].filter((item) => {
              let isRelevant = true;
              Object.keys(filterValues).forEach((key) => {
                if (
                  filterValues[key].some(
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, filterValues, onFilter]);

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
                  className="dps-table-view__search"
                  onChange={(value) => {
                    const newValues =
                      value?.length > 0
                        ? { ...filterValues, [activeFilter.id]: [value] }
                        : omit(filterValues, activeFilter.id);
                    setFilterValues(newValues);
                  }}
                  value={activeFilter ? filterValues[activeFilter.id]?.[0] : ''}
                  placeholder={`Filter by ${activeFilter?.label}`}
                />
              </ToolbarItem>
            </>
          ) : null}
        </ToolbarContent>
        {Object.keys(filterValues)?.length > 0 && (
          <ToolbarContent className="dps-table-view__filters">
            <ToolbarItem>
              <FilterChips
                filters={filters}
                filterValues={filterValues}
                onDelete={(key) => {
                  setFilterValues(key ? omit(filterValues, key) : {});
                }}
              />
            </ToolbarItem>
          </ToolbarContent>
        )}
      </Toolbar>
      <VirtualizedTable
        aria-label={ariaLabel}
        areFiltersApplied={Object.values(filterValues).some((value) => value?.length > 0)}
        data={filters ? filteredData : data}
        loaded={loaded}
        columns={columns}
        isRowSelected={isRowSelected}
        onSelect={onSelect}
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

export default TableView;
