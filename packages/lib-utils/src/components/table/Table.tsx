import type { AnyObject } from '@monorepo/common';
import type { ICell, ThProps } from '@patternfly/react-table';
import { TableComposable, Tbody, Th, Thead, Tr } from '@patternfly/react-table';
import * as _ from 'lodash-es';
import * as React from 'react';
import type { LoadError } from '../status/StatusBox';
import { StatusBox } from '../status/StatusBox';

export type RowProps<D> = {
  /** Row data object. */
  obj: D;
};

export type TableColumn = ICell & {
  /** Column title. */
  title: string;
  /** Column id. */
  id: string;
  /** Optional sort attribute - please do not use string value (deprecated). */
  sort?: ThProps['sort'] | string;
};

export type TableProps<D> = {
  /** Optional flag indicating that external filters are applied. */
  areFiltersApplied?: boolean;
  /** Data array. */
  data: D[];
  /** Data loaded flag. */
  loaded: boolean;
  /** Optional load error object. */
  loadError?: LoadError;
  /** Table volumns. */
  columns: TableColumn[];
  /** Table row component used for rendering rows. */
  Row: React.FC<RowProps<D>>;
  /** Optional default message used when data loading fails. */
  LoadErrorDefaultMsg?: React.ComponentType;
  /** Optional message used when there is no data. */
  NoDataEmptyMsg?: React.ComponentType;
  /** Optional message used when there is no data after filtering. */
  EmptyMsg?: React.ComponentType;
  /** Optional label used where there is no data. */
  emptyLabel?: string;
  /** Optional aria label. */
  'aria-label'?: string;
};

const Table: React.FC<TableProps<AnyObject>> = ({
  areFiltersApplied,
  data: initialData,
  loaded,
  loadError,
  columns,
  Row,
  LoadErrorDefaultMsg,
  NoDataEmptyMsg,
  EmptyMsg,
  emptyLabel,
  'aria-label': ariaLabel,
}) => {
  const [data, setData] = React.useState(initialData);
  const [activeSortIndex, setActiveSortIndex] = React.useState(-1);
  const [activeSortDirection, setActiveSortDirection] = React.useState('none');

  React.useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const onSort = (event: React.FormEvent, index: number, direction: string) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
    // back compatibility with sort column attribute defined as a string + transforms: [sortable]
    const columnSort = _.isString(columns[index].sort) ? columns[index].sort : undefined;
    const updatedRows = data.sort((objA, objB) => {
      const a = columnSort ? _.get(objA, String(columnSort)) : Object.values(objA)[index];
      const b = columnSort ? _.get(objB, String(columnSort)) : Object.values(objB)[index];
      if (typeof a === 'number' && typeof b === 'number') {
        return direction === 'asc' ? a - b : b - a;
      }
      return direction === 'asc'
        ? String(a).localeCompare(String(b))
        : String(b).localeCompare(String(a));
    });
    setData(updatedRows);
  };

  return (
    <StatusBox
      noData={!data || _.isEmpty(data)}
      loaded={loaded}
      loadError={loadError}
      areFiltersApplied={areFiltersApplied}
      emptyLabel={emptyLabel}
      LoadErrorDefaultMsg={LoadErrorDefaultMsg}
      NoDataEmptyMsg={NoDataEmptyMsg}
      EmptyMsg={EmptyMsg}
    >
      <TableComposable aria-label={ariaLabel}>
        <Thead>
          <Tr>
            {columns.map(({ title, props: properties, sort, transforms }, columnIndex) => {
              const isSortable = !!transforms?.find((item) => item?.name === 'sortable');
              const defaultSort = {
                sortBy: {
                  index: activeSortIndex,
                  direction: activeSortDirection,
                },
                onSort,
                columnIndex,
              };
              return (
                <Th
                  // eslint-disable-next-line react/no-array-index-key
                  key={`column-${columnIndex}`}
                  sort={isSortable ? defaultSort : sort}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...properties}
                >
                  {title}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((item, idx) => (
            // eslint-disable-next-line react/no-array-index-key
            <Tr key={`row-${idx}`}>
              <Row obj={item} />
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </StatusBox>
  );
};

export default Table;
