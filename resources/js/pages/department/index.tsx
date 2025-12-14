import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type DataTableBulkAction, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageHeader from "@/components/Pageheader";
import PageMeta from "@/components/PageMeta";
import { Building2 } from "lucide-react";

type DepartmentRecord = {
  id: number;
  name: string;
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
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type DepartmentPageProps = {
  departments: DepartmentPaginator;
  filters: DepartmentFilters;
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
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((department?: DepartmentRecord) => {
    setEditingDepartment(department ?? null);
    setFormData({ 
      name: department?.name ?? ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingDepartment(null);
      setFormData({ name: "" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingDepartment 
      ? `/settings/departments/${editingDepartment.id}` 
      : "/settings/departments";
    
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

    router.delete(`/settings/departments/${deletingDepartment.id}`, {
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

    router.post('/settings/departments/bulk-delete', {
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

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        page: partial.page ?? safeDepartments.current_page,
        perPage: partial.perPage ?? safeDepartments.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
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
          if (key === "search" && value === "") {
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

      router.get("/settings/departments", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeDepartments.current_page, safeDepartments.per_page, safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<DepartmentRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Department Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
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
        <PageHeader 
          title="Departments" 
          subtitle="Manage organization departments"
          icon={Building2}
          count={safeDepartments.total}
        />
        
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
              <button
                onClick={() => handleOpenDrawer()}
                disabled={isBusy}
                className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
              >
                Create Department
              </button>
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
              Department Name <span className="text-danger">*</span>
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
