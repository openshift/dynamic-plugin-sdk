import { Chip, ChipGroup, Button } from '@patternfly/react-core';
import * as React from 'react';
import './filter-chips.scss';

export type FilterChipItem = {
  /* Label of a parameter used for filtering. */
  label: string;
  /* Column name for given filtering parameter. */
  id: string;
};

export interface FilterChipsProps {
  filters?: FilterChipItem[];
  filterValues?: Record<string, string>;
  onDelete?: (key?: string) => void;
}

const FilterChips: React.FunctionComponent<FilterChipsProps> = ({
  filters = [],
  filterValues = {},
  onDelete = () => undefined,
}) => {
  const groupedFilters = Object.keys(filterValues).map((key) => (
    <ChipGroup
      className="dps-table-view-chips"
      key={`group-${key}`}
      categoryName={filters.find((item) => item.id === key)?.label}
    >
      <Chip
        key={filterValues[key]}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(key);
        }}
      >
        {filterValues[key]}
      </Chip>
    </ChipGroup>
  ));

  return (
    <>
      {groupedFilters}
      {Object.values(filterValues).some((value) => value?.length > 0) && (
        <Button className="dps-table-view-clear" variant="link" onClick={() => onDelete()}>
          Clear filters
        </Button>
      )}
    </>
  );
};

export default FilterChips;
