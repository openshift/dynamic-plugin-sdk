import type { AnyObject } from '@monorepo/common';
import { Th, Thead, Tr, TableComposable } from '@patternfly/react-table';
import { AutoSizer, WindowScroller } from '@patternfly/react-virtualized-extension';
import * as _ from 'lodash';
import * as React from 'react';
import type { LoadError } from '../status/StatusBox';
import { StatusBox } from '../status/StatusBox';
import type { RowProps, TableColumn } from './VirtualizedTableBody';
import VirtualizedTableBody from './VirtualizedTableBody';

export type VirtualizedTableProps<D> = {
  /** Optional flag indicating that filters are applied to data. */
  areFiltersApplied?: boolean;
  /** Data array. */
  data: D[];
  /** Flag indicating data has been loaded. */
  loaded: boolean;
  /** Optional load error object. */
  loadError?: LoadError;
  /** Table columns array. */
  columns: TableColumn<D>[];
  /** Table row component. */
  Row: React.FC<RowProps<D>>;
  /** Optional load error default text. */
  loadErrorDefaultText?: string;
  /** Optional no data empty state component. */
  CustomNoDataEmptyState?: React.ComponentType;
  /** Optional no applicable data empty state component. */
  CustomEmptyState?: React.ComponentType;
  /** Optional empty state description. */
  emptyStateDescription?: string;
  /** Optional aria label. */
  'aria-label'?: string;
  /** Optional scroll node. */
  scrollNode?: () => HTMLElement;
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

const VirtualizedTable: React.FC<VirtualizedTableProps<AnyObject>> = ({
  areFiltersApplied,
  data: initialData,
  loaded,
  loadError,
  columns,
  Row,
  loadErrorDefaultText,
  CustomNoDataEmptyState,
  CustomEmptyState,
  emptyStateDescription,
  scrollNode,
  'aria-label': ariaLabel,
}) => {
  const [activeSortDirection, setActiveSortDirection] = React.useState('none');
  const [activeSortIndex, setActiveSortIndex] = React.useState(-1);
  const [data, setData] = React.useState(initialData);

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

  const renderVirtualizedTable = (scrollContainer: (() => HTMLElement) | HTMLElement) => (
    <WindowScroller scrollElement={scrollContainer}>
      {({ height, isScrolling, registerChild, onChildScroll, scrollTop }: AnyObject) => (
        <AutoSizer disableHeight>
          {({ width }: AnyObject) => (
            <div ref={registerChild as React.LegacyRef<HTMLDivElement> | undefined}>
              <VirtualizedTableBody
                Row={Row}
                height={height as number}
                isScrolling={isScrolling as boolean}
                onChildScroll={onChildScroll as () => unknown}
                data={data}
                columns={columns}
                scrollTop={scrollTop as number}
                width={width as number}
              />
            </div>
          )}
        </AutoSizer>
      )}
    </WindowScroller>
  );

  return (
    <StatusBox
      areFiltersApplied={areFiltersApplied}
      emptyStateDescription={emptyStateDescription}
      CustomEmptyState={CustomEmptyState}
      loaded={loaded}
      loadError={loadError}
      loadErrorDefaultText={loadErrorDefaultText}
      noData={!data || _.isEmpty(data)}
      CustomNoDataEmptyState={CustomNoDataEmptyState}
    >
      <div role="grid" aria-label={ariaLabel} aria-rowcount={data?.length || 0}>
        <TableComposable aria-label={ariaLabel} role="presentation">
          <Thead>
            <Tr>
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
                    >
                      {title}
                    </Th>
                  );
                },
              )}
            </Tr>
          </Thead>
        </TableComposable>
        {scrollNode ? (
          renderVirtualizedTable(scrollNode)
        ) : (
          <WithScrollContainer>{renderVirtualizedTable}</WithScrollContainer>
        )}
      </div>
    </StatusBox>
  );
};

export default VirtualizedTable;
