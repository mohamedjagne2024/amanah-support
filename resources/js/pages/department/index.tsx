import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableBulkAction, type DataTableRowAction, type DataTableFilter } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Download, Upload, FileSpreadsheet, ChevronDown } from "lucide-react";

type DepartmentRecord = {
  id: number;
  code: string;
  name: string;
  status: number;
  created_at: string | null;
  updated_at: string | null;
};

type DepartmentPaginator = {
  data: DepartmentRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type DepartmentFilters = {
  search?: string | null;
  status?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type DepartmentPageProps = {
  departments: DepartmentPaginator;
  filters: DepartmentFilters;
};

const STATUS_FILTER_OPTIONS = [
  { label: "Active", value: "1" },
  { label: "Inactive", value: "0" }
];

const STATUS_LOOKUP: Record<number, { label: string; variant: "success" | "default" }> = {
  1: { label: "Active", variant: "success" },
  0: { label: "Inactive", variant: "default" }
};

export default function Index({ departments, filters }: DepartmentPageProps) {
  const safeDepartments: DepartmentPaginator = {
    data: departments?.data ?? [],
    current_page: departments?.current_page ?? 1,
    per_page: departments?.per_page ?? 10,
    total: departments?.total ?? 0,
    last_page: departments?.last_page ?? 1,
    from: departments?.from ?? 0,
    to: departments?.to ?? 0,
  };

  const safeFilters: DepartmentFilters = {
    search: filters?.search ?? "",
    status: filters?.status ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ code: "", name: "", status: "1" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((department?: DepartmentRecord) => {
    setEditingDepartment(department ?? null);
    setFormData({ 
      code: department?.code ?? "", 
      name: department?.name ?? "",
      status: department ? String(department.status) : "1"
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingDepartment(null);
      setFormData({ code: "", name: "", status: "1" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingDepartment 
      ? `/departments/${editingDepartment.id}` 
      : "/departments";
    
    const method = editingDepartment ? "put" : "post";

    router[method](url, formData, {
      preserveScroll: true,
      onStart: () => setIsSubmitting(true),
      onSuccess: () => {
        handleCloseDrawer();
      },
      onError: (errors) => {
        setFormErrors(errors);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  }, [editingDepartment, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((department: DepartmentRecord) => {
    setDeletingDepartment(department);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingDepartment(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingDepartment) return;

    router.delete(`/departments/${deletingDepartment.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingDepartment, handleCloseDeleteDialog]);

  // Bulk delete handlers
  const handleOpenBulkDeleteDialog = useCallback((ids: number[]) => {
    setBulkDeleteIds(ids);
    setIsBulkDeleteDialogOpen(true);
  }, []);

  const handleCloseBulkDeleteDialog = useCallback(() => {
    setIsBulkDeleteDialogOpen(false);
    setTimeout(() => {
      setBulkDeleteIds([]);
    }, 300);
  }, []);

  const handleConfirmBulkDelete = useCallback(() => {
    if (bulkDeleteIds.length === 0) return;

    router.post('/departments/bulk-delete', {
      ids: bulkDeleteIds
    }, {
      preserveScroll: true,
      onStart: () => setIsBulkDeleting(true),
      onFinish: () => {
        setIsBulkDeleting(false);
        handleCloseBulkDeleteDialog();
      }
    });
  }, [bulkDeleteIds, handleCloseBulkDeleteDialog]);

  // Export handler
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    
    if (safeFilters.search) params.append('search', safeFilters.search);
    if (safeFilters.status) params.append('status', safeFilters.status);

    window.location.href = `/departments/export?${params.toString()}`;
  }, [safeFilters]);

  // Import handler
  const handleImportClick = useCallback(() => {
    router.visit('/departments/import');
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; status: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        status: partial.status ?? safeFilters.status ?? "",
        page: partial.page ?? safeDepartments.current_page,
        perPage: partial.perPage ?? safeDepartments.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.status !== (safeFilters.status ?? "") ||
        query.page !== safeDepartments.current_page ||
        query.perPage !== safeDepartments.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if ((key === "search" || key === "status") && value === "") {
            return false;
          }
          if (key === "page" && value === 1) {
            return false;
          }
          if (key === "perPage" && value === 10) {
            return false;
          }
          return true;
        })
      );

      router.get("/departments", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeDepartments.current_page, safeDepartments.per_page, safeFilters.search, safeFilters.status, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<DepartmentRecord, unknown>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (
          <span className="text-default-700">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const statusValue = Number(getValue<number>());
          const status = STATUS_LOOKUP[statusValue] ?? STATUS_LOOKUP[0];
          return (
            <Badge variant={status.variant}>{status.label}</Badge>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: true
      }
    ],
    []
  );

  const tableFilters = useMemo<DataTableFilter[]>(
    () => [
      {
        id: "status",
        label: "Status",
        placeholder: "All statuses",
        options: STATUS_FILTER_OPTIONS
      }
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<DepartmentRecord>[]>(
    () => [
      {
        label: "Edit",
        value: "edit",
        onSelect: (department) => {
          handleOpenDrawer(department);
        }
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (department) => {
          handleOpenDeleteDialog(department);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<DepartmentRecord>[]>(
    () => [
      {
        label: "Delete selection",
        value: "delete",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);
          handleOpenBulkDeleteDialog(ids);
        }
      }
    ],
    [handleOpenBulkDeleteDialog]
  );

  return (
    <AppLayout>
      <PageMeta title="Departments" />
      <main>
        <PageBreadcrumb title="Departments" subtitle="Asset Management" />
        <div className="space-y-6">
          <DataTable<DepartmentRecord>
            data={safeDepartments.data}
            columns={columns}
            pagination={{
              page: safeDepartments.current_page,
              perPage: safeDepartments.per_page,
              total: safeDepartments.total
            }}
            searchValue={safeFilters.search ?? ""}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            filters={tableFilters}
            filterValues={{
              status: safeFilters.status ?? ""
            }}
            onFilterChange={(filterId, value) => {
              if (filterId === "status") {
                submitQuery({ status: value, page: 1 });
              }
            }}
            sorting={{
              sortBy: safeFilters.sort_by ?? undefined,
              sortDirection: safeFilters.sort_direction ?? undefined
            }}
            onSortChange={(sortBy, sortDirection) => {
              submitQuery({ sort_by: sortBy ?? null, sort_direction: sortDirection ?? null, page: 1 });
            }}
            onPageChange={(page) => submitQuery({ page })}
            onPerPageChange={(perPage) => submitQuery({ perPage, page: 1 })}
            bulkActions={bulkActions}
            renderCreate={({ isBusy }) => (
              <div className="flex gap-2">
                <Menu as="div" className="relative inline-flex">
                  <MenuButton
                    className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isBusy}
                  >
                    <FileSpreadsheet className="size-4" />
                    Import/Export
                    <ChevronDown className="size-4" />
                  </MenuButton>
                  <MenuItems
                    anchor="bottom end"
                    className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
                  >
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-default-500 rounded cursor-pointer ${
                            focus ? 'bg-default-150' : ''
                          }`}
                          onClick={handleExport}
                        >
                          <Download className="size-4" />
                          Export to Excel
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-default-500 rounded cursor-pointer ${
                            focus ? 'bg-default-150' : ''
                          }`}
                          onClick={handleImportClick}
                        >
                          <Upload className="size-4" />
                          Import from Excel
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
                <button
                  onClick={() => handleOpenDrawer()}
                  disabled={isBusy}
                  className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
                >
                  Create Department
                </button>
              </div>
            )}
            rowActions={rowActions}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingDepartment ? "Edit Department" : "Create Department"}
        size="lg"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="department-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingDepartment ? "Update" : "Create"
              )}
            </button>
          </>
        }
      >
        <form id="department-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Code <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="code"
              placeholder="Enter department code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.code ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.code && (
              <p className="text-danger text-sm mt-1">{formErrors.code}</p>
            )}
          </div>
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter department name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.name ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.name && (
              <p className="text-danger text-sm mt-1">{formErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Status <span className="text-danger">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.status ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            {formErrors.status && (
              <p className="text-danger text-sm mt-1">{formErrors.status}</p>
            )}
          </div>
        </form>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteDialog();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the department "${deletingDepartment?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseBulkDeleteDialog();
          }
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Confirm Bulk Delete"
        description={`Are you sure you want to delete ${bulkDeleteIds.length} department(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}

