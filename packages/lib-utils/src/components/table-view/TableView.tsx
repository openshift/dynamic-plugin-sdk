import {
  Button,
  ButtonVariant,
  Chip,
  ChipGroup,
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
import type { TableProps } from '../table/Table';
import Table from '../table/Table';
import './table-view.scss';

export type FilterItem = {
  /* Label of a parameter used for filtering. */
  label: string;
  /* Column name for given filtering parameter. */
  id: string;
};

export type TableViewProps<D> = TableProps<D> & {
  /* Optional custom onFilter callback. */
  onFilter?: (filterValues: Record<string, string>, activeFilter?: FilterItem) => D[];
  /* Optional array of filterBy options. */
  filters?: FilterItem[];
};

const TableView: React.FC<TableViewProps<Record<string, unknown>>> = ({
  areFiltersApplied,
  data,
  loaded,
  loadError,
  columns,
  Row,
  LoadErrorDefaultMsg,
  NoDataEmptyMsg,
  onFilter,
  filters,
  EmptyMsg,
  emptyLabel,
  'aria-label': ariaLabel,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterItem | undefined>(filters?.[0]);
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});
  const [filteredData, setFilteredData] = React.useState(data);
  const [isFilterSelectExpanded, setFilterSelectExpanded] = React.useState(false);

  React.useEffect(() => {
    if (filters) {
      setFilteredData(
        onFilter
          ? onFilter(filterValues, activeFilter)
          : [...data].filter((item: Record<string, unknown>) =>
              Object.keys(filterValues).every((key) =>
                (item[key] as string)?.toLowerCase()?.includes(filterValues[key]?.toLowerCase()),
              ),
            ),
      );
    }
  }, [activeFilter, data, filterValues, filters, onFilter]);

  return (
    <>
      {filters ? (
        <Toolbar>
          <ToolbarContent>
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
                {filters?.map((option) => (
                  <SelectOption key={option.id} value={option.id}>
                    {option.label}
                  </SelectOption>
                ))}
              </Select>
            </ToolbarItem>
            <ToolbarItem variant={ToolbarItemVariant['search-filter']} key="search-filter">
              <SearchInput
                className="dps-table-view-search"
                onChange={(value) =>
                  activeFilter &&
                  setFilterValues({
                    ...filterValues,
                    [activeFilter.id]: value,
                  })
                }
                value={activeFilter ? filterValues[activeFilter.id] : ''}
                placeholder={`Filter by ${activeFilter?.label}`}
              />
            </ToolbarItem>
            {Object.keys(filterValues).map((key) =>
              filterValues[key]?.length > 0 ? (
                <ToolbarItem variant={ToolbarItemVariant['chip-group']} key={`chips-${key}`}>
                  <ChipGroup categoryName={filters.find((item) => item.id === key)?.label}>
                    <Chip
                      key={filterValues[key]}
                      onClick={() => setFilterValues(omit(filterValues, key))}
                    >
                      {filterValues[key]}
                    </Chip>
                  </ChipGroup>
                </ToolbarItem>
              ) : null,
            )}
            {Object.values(filterValues).some((value) => value?.length > 0) ? (
              <ToolbarItem key="delete-chips" className="dps-table-view-clear">
                <Button variant={ButtonVariant.link} onClick={() => setFilterValues({})} isInline>
                  Clear all filters
                </Button>
              </ToolbarItem>
            ) : null}
          </ToolbarContent>
        </Toolbar>
      ) : null}
      <Table
        areFiltersApplied={
          areFiltersApplied || Object.values(filterValues).some((value) => value?.length > 0)
        }
        data={filteredData}
        loaded={loaded}
        loadError={loadError}
        columns={columns}
        Row={Row}
        LoadErrorDefaultMsg={LoadErrorDefaultMsg}
        NoDataEmptyMsg={NoDataEmptyMsg}
        EmptyMsg={EmptyMsg}
        emptyLabel={emptyLabel}
        aria-label={ariaLabel}
      />
    </>
  );
};

export default TableView;
