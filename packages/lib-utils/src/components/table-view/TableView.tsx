import {
  Pagination,
  PaginationVariant,
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
import FilterChips from './FilterChips';
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

const calculatePage = (limit = 10, offset = 0) => Math.floor(offset / limit) + 1;

const calculateOffset = (page = 1, limit = 10) => (page - 1) * limit;

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
  const [pagination, setPagination] = React.useState({
    limit: 10,
    offset: 0,
  });

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
  }, [activeFilter, data, filterValues, filters, onFilter, pagination.limit, pagination.offset]);

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
                  onChange={(value) => {
                    if (activeFilter) {
                      setFilterValues({
                        ...filterValues,
                        [activeFilter.id]: value,
                      });
                    }
                    setPagination({ ...pagination, offset: 0 });
                  }}
                  value={activeFilter ? filterValues[activeFilter.id] : ''}
                  placeholder={`Filter by ${activeFilter?.label}`}
                />
              </ToolbarItem>
            </>
          ) : null}
          <ToolbarItem className="dps-table-view-top-pagination">
            <Pagination
              itemCount={(filters ? filteredData : data).length}
              perPage={pagination.limit}
              page={calculatePage(pagination.limit, pagination.offset)}
              onSetPage={(e, page) =>
                setPagination({ ...pagination, offset: calculateOffset(page, pagination.limit) })
              }
              onPerPageSelect={(e, value) => setPagination({ ...pagination, limit: value })}
            />
          </ToolbarItem>
        </ToolbarContent>
        {Object.keys(filterValues).length > 0 && (
          <ToolbarContent className="dps-table-view-filters">
            <ToolbarItem>
              <FilterChips
                filters={filters}
                filterValues={filterValues}
                onDelete={(key) => {
                  setFilterValues(key ? omit(filterValues, key) : {});
                  setPagination({ ...pagination, offset: 0 });
                }}
              />
            </ToolbarItem>
          </ToolbarContent>
        )}
      </Toolbar>
      <Table
        areFiltersApplied={
          areFiltersApplied || Object.values(filterValues).some((value) => value?.length > 0)
        }
        data={(filters ? filteredData : data).slice(
          pagination.offset,
          pagination.offset + pagination.limit,
        )}
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
      <Pagination
        variant={PaginationVariant.bottom}
        itemCount={(filters ? filteredData : data).length}
        perPage={pagination.limit}
        page={calculatePage(pagination.limit, pagination.offset)}
        onSetPage={(e, page) =>
          setPagination({ ...pagination, offset: calculateOffset(page, pagination.limit) })
        }
        onPerPageSelect={(e, value) => setPagination({ ...pagination, limit: value })}
      />
    </>
  );
};

export default TableView;
