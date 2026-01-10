import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type DataTableBulkAction, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import Combobox, { SelectOption } from "@/components/Combobox";
import AppLayout from "@/layouts/app-layout";
import PageHeader from "@/components/Pageheader";
import PageMeta from "@/components/PageMeta";
import TextEditor from "@/components/TextEditor";
import { BookOpen } from "lucide-react";
import { useLanguageContext } from "@/context/useLanguageContext";

type TypeOption = {
  id: number;
  name: string;
};

type KbRecord = {
  id: number;
  title: string;
  type: string;
  type_id: number;
  details: string;
};

type KbPaginator = {
  data: KbRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type KbFilters = {
  search?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type KbPageProps = {
  knowledge_base: KbPaginator;
  filters: KbFilters;
  types: TypeOption[];
};

export default function Index({ knowledge_base, filters, types = [] }: KbPageProps) {
  const { t } = useLanguageContext();

  const safeKb: KbPaginator = {
    data: knowledge_base?.data ?? [],
    current_page: knowledge_base?.current_page ?? 1,
    per_page: knowledge_base?.per_page ?? 10,
    total: knowledge_base?.total ?? 0,
    last_page: knowledge_base?.last_page ?? 1,
    from: knowledge_base?.from ?? 0,
    to: knowledge_base?.to ?? 0,
  };

  const safeFilters: KbFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KbRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingKb, setDeletingKb] = useState<KbRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type_id: "",
    details: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Type options for combobox
  const typeOptions = useMemo<SelectOption[]>(
    () => types.map((type) => ({
      label: type.name,
      value: type.id,
    })),
    [types]
  );

  // Drawer handlers
  const handleOpenDrawer = useCallback((kb?: KbRecord) => {
    setEditingKb(kb ?? null);
    setFormData({
      title: kb?.title ?? "",
      type_id: kb?.type_id?.toString() ?? "",
      details: kb?.details ?? ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingKb(null);
      setFormData({ title: "", type_id: "", details: "" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const url = editingKb
      ? `/knowledge_base/${editingKb.id}`
      : "/knowledge_base";

    const method = editingKb ? "put" : "post";

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
  }, [editingKb, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((kb: KbRecord) => {
    setDeletingKb(kb);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingKb(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingKb) return;

    router.delete(`/knowledge_base/${deletingKb.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingKb, handleCloseDeleteDialog]);

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

    router.post('/knowledge_base/bulk-delete', {
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
        page: partial.page ?? safeKb.current_page,
        perPage: partial.perPage ?? safeKb.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged =
        query.search !== (safeFilters.search ?? "") ||
        query.page !== safeKb.current_page ||
        query.perPage !== safeKb.per_page ||
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

      router.get("/knowledge_base", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeKb.current_page, safeKb.per_page, safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<KbRecord, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: t('table.title'),
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "type",
        header: t('table.type'),
        cell: ({ getValue }) => {
          const type = getValue<string>();
          return type ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {type}
            </span>
          ) : (
            <span className="text-default-400">—</span>
          );
        },
        enableSorting: true
      }
    ],
    [t]
  );

  const rowActions = useMemo<DataTableRowAction<KbRecord>[]>(
    () => [
      {
        label: t('table.edit'),
        value: "edit",
        onSelect: (kb) => {
          handleOpenDrawer(kb);
        }
      },
      {
        label: t('table.delete'),
        value: "delete",
        onSelect: (kb) => {
          handleOpenDeleteDialog(kb);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog, t]
  );

  const bulkActions = useMemo<DataTableBulkAction<KbRecord>[]>(
    () => [
      {
        label: t('table.deleteSelection'),
        value: "delete",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);
          handleOpenBulkDeleteDialog(ids);
        }
      }
    ],
    [handleOpenBulkDeleteDialog, t]
  );

  return (
    <AppLayout>
      <PageMeta title={t('kb.title')} />
      <main>
        <PageHeader
          title={t('kb.title')}
          subtitle={t('kb.subtitle')}
          icon={BookOpen}
          count={safeKb.total}
        />

        <div className="space-y-6">
          <DataTable<KbRecord>
            data={safeKb.data}
            columns={columns}
            pagination={{
              page: safeKb.current_page,
              perPage: safeKb.per_page,
              total: safeKb.total
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
                {t('kb.createArticle')}
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
        title={editingKb ? t('kb.editArticle') : t('kb.createArticle')}
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
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="kb-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('table.processing')}
                </span>
              ) : (
                editingKb ? t('table.update') : t('table.create')
              )}
            </button>
          </>
        }
      >
        <form id="kb-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              {t('kb.articleTitle')} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder={t('kb.enterTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.title ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.title && (
              <p className="text-danger text-sm mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <input type="hidden" name="type_id" value={formData.type_id} />
            <Combobox
              label={
                <>
                  {t('table.type')} <span className="text-danger">*</span>
                </>
              }
              options={typeOptions}
              value={
                typeOptions.find(
                  (opt) => String(opt.value) === formData.type_id
                ) || null
              }
              onChange={(option) =>
                setFormData({ ...formData, type_id: option?.value?.toString() || '' })
              }
              placeholder={t('kb.selectType')}
              disabled={isSubmitting}
              isClearable
              isSearchable
              error={formErrors.type_id}
            />
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              {t('kb.content')} <span className="text-danger">*</span>
            </label>
            <input type="hidden" name="details" value={formData.details} />
            <TextEditor
              initialValue={formData.details}
              placeholder={t('kb.enterContent')}
              onChange={(content) => setFormData({ ...formData, details: content })}
              showToolbar={true}
              className="min-h-[300px]"
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
        title={t('table.confirmDelete')}
        description={`${t('kb.confirmDelete')} "${deletingKb?.title}"`}
        confirmText={t('table.delete')}
        cancelText={t('common.cancel')}
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
        title={t('table.confirmBulkDelete')}
        description={`${t('kb.confirmBulkDelete')} (${bulkDeleteIds.length})`}
        confirmText={t('table.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}
