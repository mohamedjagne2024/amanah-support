import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableBulkAction, type DataTableRowAction, type DataTableFilter } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import ComboboxComponent, { SelectOption } from "@/components/Combobox";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Download, Upload, FileSpreadsheet, ChevronDown } from "lucide-react";

type SubCategoryRecord = {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
};

type SubCategoryPaginator = {
  data: SubCategoryRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type CategoryOption = {
  id: number;
  name: string;
};

type SubCategoryFilters = {
  search?: string | null;
  category_id?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type SubCategoryPageProps = {
  subCategories: SubCategoryPaginator;
  categories: CategoryOption[];
  filters: SubCategoryFilters;
};

export default function Index({ subCategories, categories, filters }: SubCategoryPageProps) {
  const safeSubCategories: SubCategoryPaginator = {
    data: subCategories?.data ?? [],
    current_page: subCategories?.current_page ?? 1,
    per_page: subCategories?.per_page ?? 10,
    total: subCategories?.total ?? 0,
    last_page: subCategories?.last_page ?? 1,
    from: subCategories?.from ?? 0,
    to: subCategories?.to ?? 0,
  };

  const safeFilters: SubCategoryFilters = {
    search: filters?.search ?? "",
    category_id: filters?.category_id ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const categoryItems = useMemo(() => 
    (categories || []).map((category) => ({
      label: category.name,
      value: String(category.id)
    })),
    [categories]
  );

  const [isLoading, setIsLoading] = useState(false);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategoryRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSubCategory, setDeletingSubCategory] = useState<SubCategoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: "", category_id: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((subCategory?: SubCategoryRecord) => {
    setEditingSubCategory(subCategory ?? null);
    setFormData({ 
      name: subCategory?.name ?? "", 
      category_id: subCategory ? String(subCategory.category_id) : "" 
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingSubCategory(null);
      setFormData({ name: "", category_id: "" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingSubCategory 
      ? `/subcategories/${editingSubCategory.id}` 
      : "/subcategories";
    
    const method = editingSubCategory ? "put" : "post";

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
  }, [editingSubCategory, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((subCategory: SubCategoryRecord) => {
    setDeletingSubCategory(subCategory);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingSubCategory(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingSubCategory) return;

    router.delete(`/subcategories/${deletingSubCategory.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingSubCategory, handleCloseDeleteDialog]);

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

    router.post('/subcategories/bulk-delete', {
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
    if (safeFilters.category_id) params.append('category_id', safeFilters.category_id);

    window.location.href = `/subcategories/export?${params.toString()}`;
  }, [safeFilters]);

  // Import handler
  const handleImportClick = useCallback(() => {
    router.visit('/subcategories/import');
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; category_id: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        category_id: partial.category_id ?? safeFilters.category_id ?? "",
        page: partial.page ?? safeSubCategories.current_page,
        perPage: partial.perPage ?? safeSubCategories.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.category_id !== (safeFilters.category_id ?? "") ||
        query.page !== safeSubCategories.current_page ||
        query.perPage !== safeSubCategories.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if ((key === "search" || key === "category_id") && value === "") {
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

      router.get("/subcategories", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeSubCategories.current_page, safeSubCategories.per_page, safeFilters.search, safeFilters.category_id, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<SubCategoryRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "category_name",
        header: "Category",
        cell: ({ getValue }) => (
          <Badge variant="primary">{getValue<string>()}</Badge>
        ),
        enableSorting: false
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
        id: "category_id",
        label: "Category",
        placeholder: "All categories",
        options: categoryItems
      }
    ],
    [categoryItems]
  );

  const rowActions = useMemo<DataTableRowAction<SubCategoryRecord>[]>(
    () => [
      {
        label: "Edit",
        value: "edit",
        onSelect: (subCategory) => {
          handleOpenDrawer(subCategory);
        }
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (subCategory) => {
          handleOpenDeleteDialog(subCategory);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<SubCategoryRecord>[]>(
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

  // Get selected category option for the form combobox
  const selectedCategoryOption = useMemo(() => {
    if (!formData.category_id) return null;
    const found = categoryItems.find(item => item.value === formData.category_id);
    return found ? { label: found.label, value: found.value } as SelectOption : null;
  }, [formData.category_id, categoryItems]);

  const categorySelectOptions: SelectOption[] = useMemo(() => 
    categoryItems.map(item => ({ label: item.label, value: item.value })),
    [categoryItems]
  );

  return (
    <AppLayout>
      <PageMeta title="SubCategories" />
      <main>
        <PageBreadcrumb title="SubCategories" subtitle="Asset Management" />
        <div className="space-y-6">
          <DataTable<SubCategoryRecord>
            data={safeSubCategories.data}
            columns={columns}
            pagination={{
              page: safeSubCategories.current_page,
              perPage: safeSubCategories.per_page,
              total: safeSubCategories.total
            }}
            searchValue={safeFilters.search ?? ""}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            filters={tableFilters}
            filterValues={{
              category_id: safeFilters.category_id ?? ""
            }}
            onFilterChange={(filterId, value) => {
              if (filterId === "category_id") {
                submitQuery({ category_id: value, page: 1 });
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
                  Create SubCategory
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
        title={editingSubCategory ? "Edit SubCategory" : "Create SubCategory"}
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
              form="subcategory-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingSubCategory ? "Update" : "Create"
              )}
            </button>
          </>
        }
      >
        <form id="subcategory-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Category <span className="text-danger">*</span>
            </label>
            <ComboboxComponent
              options={categorySelectOptions}
              value={selectedCategoryOption}
              onChange={(newValue) => {
                const value = newValue ? String((newValue as SelectOption).value) : "";
                setFormData({ ...formData, category_id: value });
              }}
              placeholder="Select a category"
              disabled={isSubmitting}
              isClearable={true}
              inputClassName={`form-input w-full ${formErrors.category_id ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.category_id && (
              <p className="text-danger text-sm mt-1">{formErrors.category_id}</p>
            )}
          </div>
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter subcategory name"
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
        description={`Are you sure you want to delete the subcategory "${deletingSubCategory?.name}"? This action cannot be undone.`}
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
        description={`Are you sure you want to delete ${bulkDeleteIds.length} subcategory(ies)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}

