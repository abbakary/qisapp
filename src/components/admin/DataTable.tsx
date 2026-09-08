import React, { useState, useMemo } from "react";

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessor?: (row: T) => any;
  cell?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
};

export type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  keyField?: keyof T | ((row: T) => string);
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  filterSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  pagination?: boolean;
  defaultPageSize?: number;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
};

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = "id",
  searchable = true,
  searchPlaceholder = "Search records...",
  searchFilter,
  filterSlot,
  actionSlot,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  pagination = true,
  defaultPageSize = 10,
  emptyMessage = "No records found.",
  emptyAction,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const getRowKey = (row: T): string => {
    if (typeof keyField === "function") return keyField(row);
    return String(row[keyField] ?? Math.random());
  };

  // Filter
  const filteredData = useMemo(() => {
    if (!query.trim()) return data;
    const q = query.toLowerCase().trim();
    if (searchFilter) {
      return data.filter((row) => searchFilter(row, q));
    }
    return data.filter((row) => {
      return Object.values(row).some((val) => {
        if (val == null) return false;
        if (typeof val === "object") return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, query, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortCol) return filteredData;
    const colDef = columns.find((c) => c.id === sortCol);
    if (!colDef) return filteredData;

    return [...filteredData].sort((a, b) => {
      let valA = colDef.accessor ? colDef.accessor(a) : a[sortCol];
      let valB = colDef.accessor ? colDef.accessor(b) : b[sortCol];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortCol, sortDir, columns]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const pageData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (validCurrentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, validCurrentPage, pageSize]);

  const handleSort = (colId: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortCol === colId) {
      if (sortDir === "asc") setSortDir("desc");
      else {
        setSortCol(null);
        setSortDir("asc");
      }
    } else {
      setSortCol(colId);
      setSortDir("asc");
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;
    if (e.target.checked) {
      const allKeys = pageData.map(getRowKey);
      const combined = Array.from(new Set([...selectedIds, ...allKeys]));
      onSelectionChange(combined);
    } else {
      const pageKeys = new Set(pageData.map(getRowKey));
      onSelectionChange(selectedIds.filter((k) => !pageKeys.has(k)));
    }
  };

  const handleSelectRow = (rowKey: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(rowKey)) {
      onSelectionChange(selectedIds.filter((id) => id !== rowKey));
    } else {
      onSelectionChange([...selectedIds, rowKey]);
    }
  };

  const isAllPageSelected =
    pageData.length > 0 && pageData.every((row) => selectedIds.includes(getRowKey(row)));

  return (
    <div className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-line bg-white">
        <div className="flex flex-1 items-center gap-2.5">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted pointer-events-none text-xs">
                🔍
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-line bg-sand/30 pl-8 pr-3 py-2 text-[12px] text-ink placeholder:text-muted focus:bg-white focus:border-gold focus:outline-none transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
          {filterSlot}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {actionSlot}
        </div>
      </div>

      {/* Bulk actions banner if items selected */}
      {selectable && selectedIds.length > 0 && bulkActions && (
        <div className="bg-sand/60 px-4 py-2.5 border-b border-line flex items-center justify-between animate-fade-in text-[12px]">
          <span className="font-semibold text-deep-green">
            {selectedIds.length} item{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions(selectedIds, () => onSelectionChange?.([]))}
          </div>
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-line bg-sand/40 text-[11px] font-bold tracking-wider text-muted uppercase">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    className="rounded border-line text-deep-green focus:ring-gold cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortCol === col.id;
                return (
                  <th
                    key={col.id}
                    onClick={() => handleSort(col.id, col.sortable)}
                    style={{ width: col.width }}
                    className={`px-4 py-3 font-semibold ${
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                        ? "text-center"
                        : "text-left"
                    } ${
                      col.sortable
                        ? "cursor-pointer hover:text-deep-green select-none"
                        : ""
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "right"
                          ? "justify-end"
                          : col.align === "center"
                          ? "justify-center"
                          : "justify-start"
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-[10px] text-muted">
                          {isSorted ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-12 text-center text-muted"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-3xl">📭</span>
                    <p className="font-semibold text-ink text-sm">{emptyMessage}</p>
                    {emptyAction && <div className="mt-2">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => {
                const key = getRowKey(row);
                const isSelected = selectedIds.includes(key);
                return (
                  <tr
                    key={key}
                    className={`transition hover:bg-sand/30 ${
                      isSelected ? "bg-gold/10 hover:bg-gold/15" : idx % 2 === 1 ? "bg-sand/10" : "bg-white"
                    }`}
                  >
                    {selectable && (
                      <td className="w-10 px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(key)}
                          className="rounded border-line text-deep-green focus:ring-gold cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const content = col.cell
                        ? col.cell(row, idx)
                        : col.accessor
                        ? col.accessor(row)
                        : row[col.id];
                      return (
                        <td
                          key={col.id}
                          className={`px-4 py-3 align-middle ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left"
                          }`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-line bg-white text-[12px] text-muted">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-ink">
                {(validCurrentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-ink">
                {Math.min(validCurrentPage * pageSize, totalItems)}
              </strong>{" "}
              of <strong className="text-ink">{totalItems}</strong> entries
            </span>
            <span className="hidden sm:inline">|</span>
            <div className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-line bg-white px-2 py-1 text-ink focus:border-gold focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-line px-2.5 py-1 font-bold text-ink hover:bg-sand/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-semibold text-deep-green">
              Page {validCurrentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-line px-2.5 py-1 font-bold text-ink hover:bg-sand/40 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
