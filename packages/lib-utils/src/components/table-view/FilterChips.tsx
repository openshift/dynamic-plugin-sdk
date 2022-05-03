import { Chip, ChipGroup, Button } from '@patternfly/react-core';
import * as React from 'react';
import './filter-chips.css';

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
      className="filter-chips__chip-group"
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
        <Button className="filter-chips__clear-filters" variant="link" onClick={() => onDelete()}>
          Clear filters
        </Button>
      )}
    </>
  );
};

export default FilterChips;
