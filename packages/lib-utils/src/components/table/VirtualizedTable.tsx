import type { AnyObject } from '@monorepo/common';
import { ActionsColumn, Tbody, Td, Th, Thead, Tr, TableComposable } from '@patternfly/react-table';
import type { IAction, ICell, SortByDirection, ThProps } from '@patternfly/react-table';
import * as _ from 'lodash-es';
import * as React from 'react';
import type { LoadError } from '../status/StatusBox';
import { StatusBox } from '../status/StatusBox';

export type RowProps<D = AnyObject> = {
  /** Row data object. */
  obj: D;
  /** Row index */
  index: number;
};

export type TableColumn<D = AnyObject> = ICell & {
  /** Column ID. */
  id: string;
  /** Optional sort configuration. */
  sort?: ((data: D[], sortDirection: SortByDirection) => D[]) | ThProps['sort'] | string;
  /** Optional visibility. */
  visibility?: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RowMemo = React.memo(({ Row: RowComponent, obj, index }: RowMemoProps<any>) => (
  <RowComponent obj={obj} index={index} />
));

export type RowMemoProps<D = AnyObject> = RowProps<D> & { Row: React.ComponentType<RowProps<D>> };

export type VirtualizedTableProps<D = AnyObject> = {
  /** Optional flag indicating that filters are applied to data. */
  areFiltersApplied?: boolean;
  /** Optional actions for each row. */
  rowActions?: IAction[];
  /** Data array. */
  data: D[];
  /** Flag indicating data has been loaded. */
  loaded: boolean;
  /** Optional load error object. */
  loadError?: LoadError;
  /** Table columns array. */
  columns: TableColumn[];
  /** Table row component. */
  Row: React.ComponentType<RowProps>;
  /** Optional isSelected row callback */
  isRowSelected?: (item: D) => boolean;
  /** Optional onSelect row callback */
  onSelect?: (event: React.FormEvent<HTMLInputElement>, isRowSelected: boolean, data: D[]) => void;
  /** Optional pagination params */
  pagination?: TablePagination;
  /** Optional no data empty state component. */
  CustomNoDataEmptyState?: React.ReactElement;
  /** Optional no applicable data empty state component. */
  CustomEmptyState?: React.ReactElement;
  /** Optional empty state description. */
  emptyStateDescription?: string;
  /** Optional aria label. */
  'aria-label'?: string;
  /** Optional scroll node. */
  scrollNode?: HTMLElement;
};

const isHTMLElement = (n: Node): n is HTMLElement => {
  return n.nodeType === Node.ELEMENT_NODE;
};

export const getParentScrollableElement = (node: HTMLElement) => {
  let parentNode: Node | null = node;
  while (parentNode) {
    if (isHTMLElement(parentNode)) {
      let overflow = parentNode.style?.overflow;
      if (!overflow.includes('scroll') && !overflow.includes('auto')) {
        overflow = window.getComputedStyle(parentNode).overflow;
      }
      if (overflow.includes('scroll') || overflow.includes('auto')) {
        return parentNode;
      }
    }
    parentNode = parentNode.parentNode;
  }
  return undefined;
};

type TablePagination = {
  limit: number;
  offset: number;
};

type WithScrollContainerProps = {
  children: (scrollContainer: HTMLElement) => React.ReactElement | null;
};

export const WithScrollContainer: React.FC<WithScrollContainerProps> = ({ children }) => {
  const [scrollContainer, setScrollContainer] = React.useState<HTMLElement>();
  const ref = React.useCallback((node) => {
    if (node) {
      setScrollContainer(getParentScrollableElement(node));
    }
  }, []);
  return scrollContainer ? children(scrollContainer) : <span ref={ref} />;
};

export const compareData = (a: unknown, b: unknown, direction: string): number => {
  if (typeof a === 'number' && typeof b === 'number') {
    return direction === 'asc' ? a - b : b - a;
  }
  return direction === 'asc'
    ? String(a).localeCompare(String(b))
    : String(b).localeCompare(String(a));
};

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  areFiltersApplied,
  rowActions = [],
  data: initialData,
  loaded,
  loadError,
  columns,
  pagination,
  Row,
  CustomNoDataEmptyState,
  CustomEmptyState,
  emptyStateDescription,
  onSelect,
  isRowSelected,
  'aria-label': ariaLabel,
}) => {
  const [activeSortDirection, setActiveSortDirection] = React.useState('none');
  const [activeSortIndex, setActiveSortIndex] = React.useState(-1);
  const [data, setData] = React.useState<AnyObject[]>(initialData);

  const paginateData = (allData: AnyObject[]) => {
    const end =
      pagination?.offset && pagination?.limit ? pagination.offset + pagination.limit : undefined;
    return allData.slice(pagination?.offset, end);
  };

  const sortData = (index = activeSortIndex, direction = activeSortDirection) => {
    if (direction && direction !== 'none') {
      // back compatibility with sort column attribute defined as a string + transforms: [sortable]
      const columnSort = _.isString(columns[index].sort) ? columns[index].sort : undefined;
      return initialData?.sort((objA, objB) => {
        const a = columnSort ? _.get(objA, String(columnSort)) : Object.values(objA)[index];
        const b = columnSort ? _.get(objB, String(columnSort)) : Object.values(objB)[index];
        return compareData(a, b, direction);
      });
    }
    return initialData;
  };

  React.useEffect(() => {
    setData(paginateData(sortData()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const onSort = (event: React.FormEvent, index: number, direction: string) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);
    const updatedRows = sortData(index, direction);
    setData(paginateData(updatedRows));
  };

  return (
    <StatusBox
      areFiltersApplied={areFiltersApplied}
      emptyStateDescription={emptyStateDescription}
      CustomEmptyState={CustomEmptyState}
      loaded={loaded}
      loadError={loadError}
      noData={!data || _.isEmpty(data)}
      CustomNoDataEmptyState={CustomNoDataEmptyState}
    >
      <div role="grid" aria-label={ariaLabel} aria-rowcount={data?.length || 0}>
        <TableComposable aria-label={ariaLabel} role="presentation" gridBreakPoint="">
          <Thead>
            <Tr>
              {onSelect && (
                <Th
                  className="pf-m-truncate dps-list-view__table-text"
                  data-testid="check-all-rows"
                  select={{
                    onSelect: (event, rowSelected) => onSelect(event, rowSelected, data),
                    isSelected: data.every((item) => isRowSelected?.(item)),
                  }}
                />
              )}
              {columns.map(
                ({ title, props: properties, sort, transforms, visibility, id }, columnIndex) => {
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
                      key={`column-${columnIndex}-${id}`}
                      sort={isSortable ? defaultSort : sort}
                      visibility={visibility}
                      // eslint-disable-next-line react/jsx-props-no-spreading
                      {...properties}
                      className="pf-m-truncate dps-list-view__table-text"
                    >
                      {title}
                    </Th>
                  );
                },
              )}
              {rowActions?.length > 0 && <Th />}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((item, index) => (
              <Tr key={`row-${item.id}`}>
                {onSelect && (
                  <Td
                    select={{
                      rowIndex: index,
                      onSelect: (event, isSelected) => onSelect?.(event, isSelected, [item]),
                      isSelected: isRowSelected?.(item) || false,
                      disable: !!(item as Record<string, unknown>)?.disable,
                    }}
                    data-testid={`check-row-${index}`}
                  />
                )}
                <RowMemo Row={Row} obj={item} index={index} />
                {rowActions && (
                  <Td isActionCell>
                    <ActionsColumn items={rowActions} />
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </TableComposable>
      </div>
    </StatusBox>
  );
};

export default VirtualizedTable;
