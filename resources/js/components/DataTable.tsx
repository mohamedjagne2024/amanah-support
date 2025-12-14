import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2, Search, Archive} from "lucide-react";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ComboboxComponent, { SelectOption } from "./Combobox";
import { Link } from "@inertiajs/react";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { TbRestore } from "react-icons/tb";

export interface DataTableFilterOption {
  label: string;
  value: string;
  isDisabled?: boolean;
}

export interface DataTableFilter {
  id: string;
  label: string;
  placeholder?: string;
  options: DataTableFilterOption[];
}

export interface DataTableBulkAction<TData> {
  label: string;
  value: string;
  onSelect?: (rows: TData[]) => Promise<void> | void;
}

export interface DataTableRowAction<TData> {
  label: string;
  value: string;
  href?: (row: TData) => string;
  onSelect?: (row: TData) => void;
  condition?: (row: TData) => boolean;
}

export interface DataTablePagination {
  page: number;
  perPage: number;
  total: number;
}

export interface DataTableSorting {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pagination: DataTablePagination;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  pageSizeOptions?: number[];
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchDebounceMs?: number;
  filters?: DataTableFilter[];
  filterValues?: Record<string, string | undefined>;
  onFilterChange?: (filterId: string, value: string) => void;
  sorting?: DataTableSorting;
  onSortChange?: (sortBy: string | undefined, sortDirection: 'asc' | 'desc' | undefined) => void;
  manualSorting?: boolean;
  bulkActions?: DataTableBulkAction<TData>[];
  renderCreate?: (ctx: {
    isBusy: boolean;
    selectedCount: number;
  }) => ReactNode;
  rowActions?: DataTableRowAction<TData>[];
  getRowId?: (row: TData, index: number) => string;
  isLoading?: boolean;
  isProcessingAction?: boolean;
  emptyState?: {
    title: string;
    description?: string;
  };
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50];

// Badge Component
export interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'default';
  children: ReactNode;
  icon?: ReactNode;
}

export const Badge = ({ variant = 'default', children, icon }: BadgeProps) => {
  const variantClasses = {
    success: 'bg-success/15 text-success',
    danger: 'bg-danger/15 text-danger',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/15 text-info',
    primary: 'bg-primary/15 text-primary',
    default: 'bg-default/15 text-default-800',
  };

  return (
    <span className={`py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium rounded ${variantClasses[variant]}`}>
      {icon}
      {children}
    </span>
  );
};

// Actions Dropdown Component
const ActionsDropdown = <TData,>({
  row,
  rowActions,
  isLoading,
  isProcessingAction
}: {
  row: { original: TData };
  rowActions: DataTableRowAction<TData>[];
  isLoading: boolean;
  isProcessingAction: boolean;
}) => {
  const filteredActions = rowActions.filter(
    (action) => !action.condition || action.condition(row.original)
  );

  const getIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('overview') || lowerLabel.includes('view')) {
      return <Eye className="lucide lucide-eye size-3" />;
    } else if (lowerLabel.includes('edit')) {
      return <Edit className="lucide lucide-edit size-3" />;
    } else if (lowerLabel.includes('delete')) {
      return <Trash2 className="lucide lucide-trash-2 size-3" />;
    } else if (lowerLabel.includes('retire')) {
      return <Archive className="lucide lucide-archive size-3" />;
    } else if (lowerLabel.includes('restore')) {
      return <TbRestore className="lucide lucide-restore size-3" />;
    }
    return null;
  };

  return (
    <Menu as="div" className="relative inline-flex">
      <MenuButton
        className="btn size-7.5 bg-default-200 hover:bg-default-600 text-default-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isLoading || isProcessingAction}
      >
        <MoreHorizontal className="size-4" />
      </MenuButton>

      <MenuItems
        anchor="bottom end"
        className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
      >
        {filteredActions.map((action) => {
          const href = action.href ? action.href(row.original) : undefined;
          
          if (href) {
            return (
              <MenuItem key={action.value}>
                {({ focus }) => (
                  <Link
                    href={href}
                    className={`flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                      focus ? 'bg-default-150' : ''
                    }`}
                  >
                    {getIcon(action.label)}
                    {action.label}
                  </Link>
                )}
              </MenuItem>
            );
          }
          
          return (
            <MenuItem key={action.value}>
              {({ focus }) => (
                <button
                  className={`w-full text-left flex items-center gap-1.5 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                    focus ? 'bg-default-150' : ''
                  }`}
                  onClick={() => {
                    if (action.onSelect) {
                      action.onSelect(row.original);
                    }
                  }}
                >
                  {getIcon(action.label)}
                  {action.label}
                </button>
              )}
            </MenuItem>
          );
        })}
      </MenuItems>
    </Menu>
  );
};

export const DataTable = <TData,>({
  data,
  columns,
  pagination,
  onPageChange,
  onPerPageChange,
  searchValue = "",
  onSearchChange,
  searchDebounceMs = 300,
  searchPlaceholder = "Search...",
  filters,
  filterValues,
  onFilterChange,
  sorting,
  onSortChange,
  manualSorting = true,
  bulkActions,
  renderCreate,
  rowActions,
  getRowId,
  isLoading = false,
  isProcessingAction = false,
  emptyState = {
    title: "No records found",
    description: "Try adjusting your filters or search criteria."
  }
}: DataTableProps<TData>) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const skipNextSearchEffect = useRef(true);
  const latestOnSearchChange = useRef(onSearchChange);
  
  const sortingState: SortingState = useMemo(() => {
    if (!sorting?.sortBy) return [];
    return [{ id: sorting.sortBy, desc: sorting.sortDirection === 'desc' }];
  }, [sorting]);

  useEffect(() => {
    latestOnSearchChange.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    setLocalSearch((previous) => {
      if (previous === searchValue) {
        return previous;
      }

      skipNextSearchEffect.current = true;
      return searchValue;
    });
  }, [searchValue]);

  useEffect(() => {
    if (!latestOnSearchChange.current) return;
    if (skipNextSearchEffect.current) {
      skipNextSearchEffect.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      latestOnSearchChange.current?.(localSearch);
    }, searchDebounceMs);

    return () => clearTimeout(timeout);
  }, [localSearch, searchDebounceMs]);

  const tableColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const selectionColumn: ColumnDef<TData, unknown> = {
      id: "_select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="form-checkbox"
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? false
                : false
          }
          onChange={(e) => {
            table.toggleAllRowsSelected(e.target.checked);
          }}
          disabled={isLoading || isProcessingAction}
          aria-label="Select all rows"
          ref={(el) => {
            if (el) {
              el.indeterminate = table.getIsSomeRowsSelected();
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="form-checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            row.toggleSelected(e.target.checked);
          }}
          disabled={isLoading || isProcessingAction}
          aria-label="Select row"
        />
      ),
      size: 48,
      enableSorting: false,
      enableColumnFilter: false
    };

    const actionsColumn: ColumnDef<TData, unknown> | null =
      rowActions && rowActions.length > 0
        ? {
            id: "_actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
              <ActionsDropdown
                row={row}
                rowActions={rowActions}
                isLoading={isLoading}
                isProcessingAction={isProcessingAction}
              />
            ),
            size: 64,
            enableSorting: false,
            enableColumnFilter: false
          }
        : null;

    const computed = [selectionColumn, ...columns];
    if (actionsColumn) {
      computed.push(actionsColumn);
    }
    return computed;
  }, [columns, isLoading, isProcessingAction, rowActions]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      rowSelection,
      sorting: sortingState
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      if (!onSortChange) return;
      
      const newSorting = typeof updater === 'function' ? updater(sortingState) : updater;
      
      if (newSorting.length === 0) {
        onSortChange(undefined, undefined);
      } else {
        const sort = newSorting[0];
        onSortChange(sort.id, sort.desc ? 'desc' : 'asc');
      }
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    manualSorting,
    enableSorting: true,
    getRowId: getRowId ?? ((row: TData, index: number) => String(index))
  });

  const isTableBusy = isLoading || isProcessingAction || isActionLoading;

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
  }, []);

  const handleBulkAction = useCallback(
    async (action: DataTableBulkAction<TData>) => {
      if (!action.onSelect) return;
      const rows = table.getSelectedRowModel().flatRows.map((r) => r.original);
      if (rows.length === 0) {
        return;
      }
      setIsActionLoading(true);
      try {
        await action.onSelect(rows);
      } finally {
        setIsActionLoading(false);
        setRowSelection({});
      }
    },
    [table]
  );

  const pageCount = Math.max(
    1,
    Math.ceil(pagination.total / pagination.perPage)
  );
  const currentPage = Math.min(pagination.page, pageCount);
  const from =
    pagination.total === 0
      ? 0
      : (currentPage - 1) * pagination.perPage + 1;
  const to =
    pagination.total === 0
      ? 0
      : Math.min(currentPage * pagination.perPage, pagination.total);

  return (
    <div className="card">
      {/* Card Header */}
      <div className="card-header p-2">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search Input */}
          {onSearchChange && (
            <div className="relative">
              <input
                type="text"
                className="form-input form-input-sm ps-9"
                placeholder={searchPlaceholder}
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              <div className="absolute inset-y-0 start-0 flex items-center ps-3">
                <Search className="size-3.5 text-default-500" />
              </div>
            </div>
          )}

          {/* Filters */}
          {filters?.map((filter) => {
            const placeholder = filter.placeholder ?? `All ${filter.label.toLowerCase()}`;
            const selectedValue = filterValues?.[filter.id] || "";
            
            // Convert filter options to Select component format
            const selectOptions: SelectOption[] = filter.options.map((option) => ({
              label: option.label,
              value: option.value,
              isDisabled: option.isDisabled
            }));
            
            // Find the selected option object
            const selectedOption = selectedValue 
              ? selectOptions.find((opt) => opt.value === selectedValue) || null
              : null;

            return (
              <div key={filter.id} className="min-w-[160px]">
                <ComboboxComponent
                  options={selectOptions}
                  value={selectedOption}
                  onChange={(newValue) => {
                    const value = newValue ? String((newValue as SelectOption).value) : "";
                    onFilterChange?.(filter.id, value);
                  }}
                  placeholder={placeholder}
                  isDisabled={isLoading}
                  isClearable={true}
                  isSearchable={true}
                  inputClassName="form-input form-input-sm"
                />
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-3 items-center">
          {/* Bulk Actions */}
          {bulkActions && bulkActions.length > 0 && (
            <Menu as="div" className="relative inline-flex">
              <MenuButton
                className="btn btn-sm bg-transparent text-default-600 border border-dashed border-default-300 hover:bg-default-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={table.getSelectedRowModel().rows.length === 0 || isTableBusy}
              >
                Bulk actions
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
              >
                {bulkActions.map((action) => (
                  <MenuItem key={action.value}>
                    {({ focus }) => (
                      <button
                        className={`w-full text-left block py-1.5 px-3 text-sm font-medium text-default-500 rounded cursor-pointer ${
                          focus ? 'bg-default-150' : ''
                        }`}
                        onClick={() => handleBulkAction(action)}
                      >
                        {action.label}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          )}

          {/* Create Button */}
          {renderCreate?.({
            isBusy: isTableBusy,
            selectedCount: table.getSelectedRowModel().rows.length
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden relative">
            <table className="min-w-full divide-y divide-default-200 dark:divide-white/14">
              <thead className="bg-default-150">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="text-default-600">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const sortDirection = header.column.getIsSorted();
                      
                      return (
                        <th
                          key={header.id}
                          scope="col"
                          className={`py-3 text-start text-sm font-medium ${
                            header.id === "_select" ? "ps-4" : "px-3.5"
                          } ${
                            canSort ? "cursor-pointer hover:bg-default-200" : ""
                          }`}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          {header.isPlaceholder ? null : (
                            <div className={`flex items-center gap-2 ${
                              header.id === "_actions" ? "justify-end" : ""
                            }`}>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {canSort && (
                                <span className="text-default-500">
                                  {sortDirection === 'asc' ? (
                                    <ArrowUp className="size-4" />
                                  ) : sortDirection === 'desc' ? (
                                    <ArrowDown className="size-4" />
                                  ) : (
                                    <ArrowUpDown className="size-4" />
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-default-200 dark:divide-white/14">
                {table.getRowModel().rows.length === 0 && !isTableBusy ? (
                  <tr>
                    <td colSpan={tableColumns.length} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <p className="text-sm font-medium text-default-800">{emptyState.title}</p>
                        {emptyState.description && (
                          <p className="text-sm text-default-500 mt-1">{emptyState.description}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`text-default-800 ${
                        row.getIsSelected() ? "bg-default-50" : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className={`py-2.5 text-sm ${
                            cell.column.id === "_select" ? "ps-4" : "px-3.5"
                          } ${
                            cell.column.id === "_actions" ? "text-right" : ""
                          }`}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {isTableBusy && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-sm rounded-lg">
                <div className="inline-flex items-center gap-2 font-medium text-default-700">
                  <div className="size-4 border-2 border-default-300 border-t-default-600 rounded-full animate-spin" />
                  Processing...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer - Pagination */}
      <div className="card-footer flex items-center justify-between">
        <p className="text-default-500 text-sm">
          Showing <b>{from.toLocaleString()}</b> to <b>{to.toLocaleString()}</b> of <b>{pagination.total.toLocaleString()}</b> Results
        </p>
        
        <div className="flex items-center gap-3">
          {onPerPageChange && (
            <div className="flex items-center gap-2">
              <span className="text-default-500 text-sm">Show:</span>
              <select
                className="form-input form-input-sm w-16"
                value={pagination.perPage}
                onChange={(e) => onPerPageChange(Number(e.target.value))}
                disabled={isLoading || isProcessingAction}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          )}
          
          <nav className="flex items-center gap-2" aria-label="Pagination">
            <button
              type="button"
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary hover:border-primary/10"
              onClick={() => onPageChange?.(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1 || isTableBusy}
            >
              <ChevronLeft className="size-4 me-1" />
              Prev
            </button>

            {/* Page Numbers */}
            {Array.from({ length: Math.min(3, pageCount) }, (_, i) => {
              let pageNum: number;
              if (pageCount <= 3) {
                pageNum = i + 1;
              } else if (currentPage === 1) {
                pageNum = i + 1;
              } else if (currentPage === pageCount) {
                pageNum = pageCount - 2 + i;
              } else {
                pageNum = currentPage - 1 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`btn size-7.5 ${
                    pageNum === currentPage
                      ? 'bg-primary/10 text-primary'
                      : 'bg-transparent border border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary hover:border-primary/10'
                  }`}
                  onClick={() => onPageChange?.(pageNum)}
                  disabled={isTableBusy}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              type="button"
              className="btn btn-sm border bg-transparent border-default-200 text-default-600 hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary hover:border-primary/10"
              onClick={() => onPageChange?.(Math.min(currentPage + 1, pageCount))}
              disabled={currentPage >= pageCount || isTableBusy}
            >
              Next
              <ChevronRight className="size-4 ms-1" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};


