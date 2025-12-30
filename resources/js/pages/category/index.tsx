import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type DataTableBulkAction, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageHeader from "@/components/Pageheader";
import PageMeta from "@/components/PageMeta";
import { FolderTree } from "lucide-react";


type CategoryRecord = {
  id: number;
  name: string;
  color: string | null;
};

type CategoryPaginator = {
  data: CategoryRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type CategoryFilters = {
  search?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type CategoryPageProps = {
  categories: CategoryPaginator;
  filters: CategoryFilters;
};

export default function Index({ categories, filters }: CategoryPageProps) {
  const safeCategories: CategoryPaginator = {
    data: categories?.data ?? [],
    current_page: categories?.current_page ?? 1,
    per_page: categories?.per_page ?? 10,
    total: categories?.total ?? 0,
    last_page: categories?.last_page ?? 1,
    from: categories?.from ?? 0,
    to: categories?.to ?? 0,
  };

  const safeFilters: CategoryFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ 
    name: "", 
    color: "" 
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((category?: CategoryRecord) => {
    setEditingCategory(category ?? null);
    setFormData({ 
      name: category?.name ?? "",
      color: category?.color ?? "",
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingCategory(null);
      setFormData({ name: "", color: "" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingCategory 
      ? `/settings/categories/${editingCategory.id}` 
      : "/settings/categories";
    
    const method = editingCategory ? "put" : "post";

    // Convert empty strings to null for nullable fields
    const submitData = {
      name: formData.name,
      color: formData.color || null,
    };

    router[method](url, submitData, {
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
  }, [editingCategory, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((category: CategoryRecord) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingCategory(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingCategory) return;

    router.delete(`/settings/categories/${deletingCategory.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingCategory, handleCloseDeleteDialog]);

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

    router.post('/settings/categories/bulk-delete', {
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
        page: partial.page ?? safeCategories.current_page,
        perPage: partial.perPage ?? safeCategories.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.page !== safeCategories.current_page ||
        query.perPage !== safeCategories.per_page ||
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

      router.get("/settings/categories", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeCategories.current_page, safeCategories.per_page, safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<CategoryRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true
      }
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<CategoryRecord>[]>(
    () => [
      {
        label: "Edit",
        value: "edit",
        onSelect: (category) => {
          handleOpenDrawer(category);
        }
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (category) => {
          handleOpenDeleteDialog(category);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<CategoryRecord>[]>(
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
      <PageMeta title="Categories" />
      <main>
        <PageHeader 
          title="Categories" 
          subtitle="Manage ticket categories"
          icon={FolderTree}
          count={safeCategories.total}
        />
        
        <div className="space-y-6">
          <DataTable<CategoryRecord>
            data={safeCategories.data}
            columns={columns}
            pagination={{
              page: safeCategories.current_page,
              perPage: safeCategories.per_page,
              total: safeCategories.total
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
                Create Category
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
        title={editingCategory ? "Edit Category" : "Create Category"}
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
              form="category-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingCategory ? "Update" : "Create"
              )}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Category Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter category name"
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
              Color
            </label>
            <input
              type="text"
              name="color"
              placeholder="e.g., #FF5733 or red"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.color ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.color && (
              <p className="text-danger text-sm mt-1">{formErrors.color}</p>
            )}
            <p className="text-default-500 text-xs mt-1">
              Optional color for visual identification
            </p>
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
        description={`Are you sure you want to delete the category "${deletingCategory?.name}"? This action cannot be undone.`}
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
        description={`Are you sure you want to delete ${bulkDeleteIds.length} category(ies)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}
