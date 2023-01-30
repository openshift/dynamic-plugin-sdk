import type { AnyObject } from '@openshift/dynamic-plugin-sdk';
import { ActionsColumn, Td as PFTd } from '@patternfly/react-table';
import type { ICell, SortByDirection, ThProps, TdProps, IAction } from '@patternfly/react-table';
import { VirtualTableBody } from '@patternfly/react-virtualized-extension';
import type { Scroll } from '@patternfly/react-virtualized-extension/dist/js/components/Virtualized/types';
import * as React from 'react';
import { CellMeasurerCache, CellMeasurer } from 'react-virtualized';
import type { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer';
import './virtualized-table.css';

export type RowProps<D> = {
  /** Row data object. */
  obj: D;
  /** Row index */
  index: number;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RowMemo = React.memo(({ Row: RowComponent, obj, index }: RowMemoProps<any>) => (
  <RowComponent obj={obj} index={index} />
));

export type RowMemoProps<D> = RowProps<D> & { Row: React.ComponentType<RowProps<D>> };

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

export const Td = React.forwardRef<
  HTMLTableCellElement,
  Omit<TdProps, 'ref'> & { className?: string }
>(({ className, ...props }, ref: React.Ref<HTMLTableCellElement>) => (
  <PFTd
    ref={ref as React.Ref<HTMLTableCellElement>}
    className={`${className ? `${className} ` : ''}pf-m-truncate dps-list-view__table-text`}
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...props}
  />
));

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
  /** Optional actions for each row. */
  rowActions?: IAction[];
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

const VirtualizedTableBody = <D extends AnyObject>({
  columns,
  data,
  height,
  isScrolling,
  onChildScroll,
  Row,
  isRowSelected,
  onSelect,
  rowActions = [],
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
            <PFTd
              className="pf-m-truncate dps-list-view__table-text"
              select={{
                rowIndex: index,
                onSelect: (event, isSelected) => onSelect?.(event, isSelected, [rowArgs.obj]),
                isSelected: isRowSelected?.(rowArgs.obj) || false,
                disable: !!(rowArgs?.obj as Record<string, unknown>)?.disable,
              }}
            />
          )}
          <RowMemo Row={Row} obj={rowArgs.obj} index={index} />
          {rowActions?.length > 0 && (
            <PFTd isActionCell>
              <ActionsColumn items={rowActions} />
            </PFTd>
          )}
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
