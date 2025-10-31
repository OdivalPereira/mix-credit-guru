import React from "react";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";

import { TableBody, TableCell, TableRow } from "@/components/ui/table";

interface VirtualizedTableBodyProps<T> {
  data: T[];
  /** Number of columns in the table for spacer rows */
  colSpan: number;
  /** Function that renders a TableRow for a given item */
  renderRow: (item: T, index: number) => React.ReactElement;
  /** Scroll container reference used by the virtualizer */
  scrollElement: () => HTMLElement | null;
  /** Minimum number of rows required to enable virtualization */
  threshold?: number;
  /** Estimated row height in pixels */
  estimateSize?: (index: number) => number;
  overscan?: number;
  /** Optional row rendered when the dataset is empty */
  emptyRow?: React.ReactNode;
}

function getPadding(virtualRows: VirtualItem[], totalSize: number) {
  if (virtualRows.length === 0) {
    return { paddingTop: 0, paddingBottom: 0 };
  }

  const paddingTop = virtualRows[0]?.start ?? 0;
  const paddingBottom = totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0);

  return { paddingTop, paddingBottom };
}

export function VirtualizedTableBody<T>({
  data,
  colSpan,
  renderRow,
  scrollElement,
  threshold = 200,
  estimateSize = () => 56,
  overscan = 8,
  emptyRow,
}: VirtualizedTableBodyProps<T>) {
  const shouldVirtualize = data.length >= threshold;

  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? data.length : 0,
    getScrollElement: scrollElement,
    estimateSize,
    overscan,
  });

  const virtualRows = shouldVirtualize ? rowVirtualizer.getVirtualItems() : [];
  const { paddingTop, paddingBottom } = shouldVirtualize
    ? getPadding(virtualRows, rowVirtualizer.getTotalSize())
    : { paddingTop: 0, paddingBottom: 0 };

  if (!shouldVirtualize) {
    return (
      <TableBody>
        {data.length === 0 && emptyRow}
        {data.map((item, index) => renderRow(item, index))}
      </TableBody>
    );
  }

  return (
    <TableBody>
      {paddingTop > 0 && (
        <TableRow aria-hidden className="pointer-events-none">
          <TableCell
            colSpan={colSpan}
            className="p-0"
            style={{ height: paddingTop }}
          />
        </TableRow>
      )}
      {virtualRows.map((virtualRow) => {
        const item = data[virtualRow.index];
        const row = renderRow(item, virtualRow.index);
        return React.cloneElement(row, {
          key:
            row.key ??
            (typeof item === "object" && item !== null && "id" in (item as Record<string, unknown>)
              ? String((item as Record<string, unknown>).id)
              : `row-${virtualRow.index}`),
        });
      })}
      {paddingBottom > 0 && (
        <TableRow aria-hidden className="pointer-events-none">
          <TableCell
            colSpan={colSpan}
            className="p-0"
            style={{ height: paddingBottom }}
          />
        </TableRow>
      )}
    </TableBody>
  );
}

