import type { AnyObject } from '@monorepo/common';
import type { ICell, SortByDirection, ThProps } from '@patternfly/react-table';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import type { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import type { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer';

export type RowProps<D> = {
  /** Row data object. */
  obj: D;
};

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

export const TableRow: React.FC<TableRowProps> = ({ id, style, trKey, className }) => {
  return <tr id={id} style={style} key={trKey} className={className} role="row" />;
};

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
  /** Scroll top number. */
  scrollTop: number;
  /** Table body width. */
  width: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RowMemo = React.memo<RowProps<any> & { Row: React.ComponentType<RowProps<any>> }>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ({ Row, obj }: RowProps<any> & { Row: React.ComponentType<RowProps<any>> }) => <Row obj={obj} />,
);

const VirtualizedTableBody = <D,>({
  columns,
  data,
  height,
  isScrolling,
  onChildScroll,
  Row,
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

  const rowRenderer = ({ index, isVisible, key, parent, style }: AnyObject) => {
    const rowArgs: RowProps<D> = {
      obj: data[index as number],
    };

    // do not render non visible elements (this excludes overscan)
    if (!isVisible) {
      return null;
    }
    return (
      <CellMeasurer
        cache={cellMeasurementCache}
        columnIndex={0}
        key={key as string}
        parent={parent as MeasuredCellParent}
        rowIndex={index as number}
      >
        <TableRow
          id={key as string}
          index={index as number}
          trKey={key as string}
          style={style as object}
        >
          <RowMemo Row={Row} obj={rowArgs.obj} />
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
