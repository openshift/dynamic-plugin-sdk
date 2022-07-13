import { Td } from '@patternfly/react-table';
import type { ICell, SortByDirection, ThProps } from '@patternfly/react-table';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import type { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import type { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer';

export type RowProps<D> = {
  /** Row data object. */
  obj: D;
  /** Row index */
  index: number;
};

type RowMemoProps<D> = RowProps<D> & { Row: React.ComponentType<RowProps<D>> };

export type TableColumn<D> = ICell & {
  /** Column ID. */
  id: string;
  /** Optional sort configuration. */
  sort?: ((data: D[], sortDirection: SortByDirection) => D[]) | ThProps['sort'] | string;
  /** Optional visibility. */
  visibility?: string[];
};

export type TableRowProps = {
  /** Row ID. */
  id: string;
  /** Row index. */
  index: number;
  /** Optional row style. */
  style: object;
  /** Row key. */
  trKey: string;
  /** Optional className. */
  className?: string;
};

export const TableRow: React.FC<TableRowProps> = ({ id, children, style, trKey, className }) => (
  <tr id={id} style={style} key={trKey} className={className} role="row">
    {children}
  </tr>
);

type VirtualizedTableBodyProps<D> = {
  /** Table columns. */
  columns: TableColumn<D>[];
  /** Data to be rendered. */
  data: D[];
  /** Table body height. */
  height: number;
  /** isScrolling flag. */
  isScrolling: boolean;
  /** onChildScroll callback. */
  onChildScroll: (params: Scroll) => void;
  /** Row component. */
  Row: React.ComponentType<RowProps<D>>;
  /** Optional isSelected row callback */
  isRowSelected?: (item: D) => boolean;
  /** Optional onSelect row callback */
  onSelect?: (event: React.FormEvent<HTMLInputElement>, isRowSelected: boolean, data: D[]) => void;
  /** Scroll top number. */
  scrollTop: number;
  /** Table body width. */
  width: number;
};

const VirtualizedTableBody = <D,>({
  columns,
  data,
  height,
  isScrolling,
  onChildScroll,
  Row,
  isRowSelected,
  onSelect,
  scrollTop,
  width,
}: VirtualizedTableBodyProps<D>) => {
  const cellMeasurementCache = new CellMeasurerCache({
    fixedWidth: true,
    minHeight: 44,
    keyMapper: (rowIndex: number) =>
      (data?.[rowIndex] as unknown as Record<string, Record<string, unknown>>)?.metadata?.uid ??
      rowIndex,
  });

  // eslint-disable-next-line react/prop-types -- this rule has issues with React.memo
  const RowMemo: React.FC<RowMemoProps<D>> = React.memo(({ Row: RowComponent, obj, index }) => (
    <RowComponent obj={obj} index={index} />
  ));

  type RowRendererParams = {
    index: number;
    key: string;
    parent: MeasuredCellParent;
    style: object;
    isScrolling: boolean;
    isVisible: boolean;
  };

  const rowRenderer = ({ index, isVisible, key, parent, style }: RowRendererParams) => {
    const rowArgs: RowProps<D> = {
      obj: data[index],
      index,
    };

    // do not render non visible elements (this excludes overscan)
    if (!isVisible) {
      return null;
    }

    return (
      <CellMeasurer
        cache={cellMeasurementCache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        <TableRow id={key} index={index} trKey={key} style={style}>
          {onSelect && (
            <Td
              data-testid={`check-row-${index}`}
              select={{
                rowIndex: index,
                onSelect: (event, isSelected) => onSelect?.(event, isSelected, [rowArgs.obj]),
                isSelected: isRowSelected?.(rowArgs.obj) || false,
                disable: !!(rowArgs?.obj as Record<string, unknown>)?.disable,
              }}
            />
          )}
          <RowMemo Row={Row} obj={rowArgs.obj} index={index} />
        </TableRow>
      </CellMeasurer>
    );
  };

  return (
    <VirtualTableBody
      autoHeight
      columns={columns}
      className="pf-c-table pf-m-border-rows pf-c-virtualized pf-c-window-scroller"
      deferredMeasurementCache={cellMeasurementCache}
      height={height || 0}
      isScrolling={isScrolling}
      onScroll={onChildScroll}
      overscanRowCount={10}
      rowCount={data.length}
      rowHeight={cellMeasurementCache.rowHeight}
      rowRenderer={rowRenderer}
      rows={data}
      scrollTop={scrollTop}
      width={width}
    />
  );
};

export default VirtualizedTableBody;
