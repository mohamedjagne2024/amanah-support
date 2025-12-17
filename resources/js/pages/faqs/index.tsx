import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type DataTableBulkAction, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import Switch from "@/components/Switch";
import AppLayout from "@/layouts/app-layout";
import PageHeader from "@/components/Pageheader";
import PageMeta from "@/components/PageMeta";
import TextEditor from "@/components/TextEditor";
import { HelpCircle, Check, X } from "lucide-react";

type FaqRecord = {
  id: number;
  name: string;
  status: boolean;
  details: string;
};

type FaqPaginator = {
  data: FaqRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type FaqFilters = {
  search?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type FaqPageProps = {
  faqs: FaqPaginator;
  filters: FaqFilters;
};

export default function Index({ faqs, filters }: FaqPageProps) {
  const safeFaqs: FaqPaginator = {
    data: faqs?.data ?? [],
    current_page: faqs?.current_page ?? 1,
    per_page: faqs?.per_page ?? 10,
    total: faqs?.total ?? 0,
    last_page: faqs?.last_page ?? 1,
    from: faqs?.from ?? 0,
    to: faqs?.to ?? 0,
  };

  const safeFilters: FaqFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<FaqRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ 
    name: "", 
    status: true,
    details: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((faq?: FaqRecord) => {
    setEditingFaq(faq ?? null);
    setFormData({ 
      name: faq?.name ?? "",
      status: faq?.status ?? true,
      details: faq?.details ?? ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingFaq(null);
      setFormData({ name: "", status: true, details: "" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingFaq 
      ? `/faqs/${editingFaq.id}` 
      : "/faqs";
    
    const method = editingFaq ? "put" : "post";

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
  }, [editingFaq, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((faq: FaqRecord) => {
    setDeletingFaq(faq);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingFaq(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingFaq) return;

    router.delete(`/faqs/${deletingFaq.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingFaq, handleCloseDeleteDialog]);

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

    router.post('/faqs/bulk-delete', {
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
        page: partial.page ?? safeFaqs.current_page,
        perPage: partial.perPage ?? safeFaqs.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.page !== safeFaqs.current_page ||
        query.perPage !== safeFaqs.per_page ||
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

      router.get("/faqs", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeFaqs.current_page, safeFaqs.per_page, safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<FaqRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Question",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<boolean>();
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              status 
                ? 'bg-success/10 text-success' 
                : 'bg-default-100 text-default-500'
            }`}>
              {status ? <Check className="size-3" /> : <X className="size-3" />}
              {status ? 'Active' : 'Inactive'}
            </span>
          );
        },
        enableSorting: true
      }
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<FaqRecord>[]>(
    () => [
      {
        label: "Edit",
        value: "edit",
        onSelect: (faq) => {
          handleOpenDrawer(faq);
        }
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (faq) => {
          handleOpenDeleteDialog(faq);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<FaqRecord>[]>(
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
      <PageMeta title="FAQs" />
      <main>
        <PageHeader 
          title="FAQs" 
          subtitle="Manage frequently asked questions"
          icon={HelpCircle}
          count={safeFaqs.total}
        />
        
        <div className="space-y-6">
          <DataTable<FaqRecord>
            data={safeFaqs.data}
            columns={columns}
            pagination={{
              page: safeFaqs.current_page,
              perPage: safeFaqs.per_page,
              total: safeFaqs.total
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
                Create FAQ
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
        title={editingFaq ? "Edit FAQ" : "Create FAQ"}
        size="xl"
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
              form="faq-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingFaq ? "Update" : "Create"
              )}
            </button>
          </>
        }
      >
        <form id="faq-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Question <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter the FAQ question"
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
              Status
            </label>
            <Switch
              checked={formData.status}
              onChange={(checked) => setFormData({ ...formData, status: checked })}
              disabled={isSubmitting}
              label={formData.status ? 'Active' : 'Inactive'}
            />
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Answer <span className="text-danger">*</span>
            </label>
            <input type="hidden" name="details" value={formData.details} />
            <TextEditor
              initialValue={formData.details}
              placeholder="Enter the FAQ answer..."
              onChange={(content) => setFormData({ ...formData, details: content })}
              showToolbar={true}
              className="min-h-[200px]"
            />
            {formErrors.details && (
              <p className="text-danger text-sm mt-1">{formErrors.details}</p>
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
        description={`Are you sure you want to delete the FAQ "${deletingFaq?.name}"? This action cannot be undone.`}
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
        description={`Are you sure you want to delete ${bulkDeleteIds.length} FAQ(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}

