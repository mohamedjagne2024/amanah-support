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
import { useLanguageContext } from "@/context/useLanguageContext";

type RegionRecord = {
  id: number;
  name: string;
};

type RegionPaginator = {
  data: RegionRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type RegionFilters = {
  search?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type RegionPageProps = {
  regions: RegionPaginator;
  filters: RegionFilters;
};

export default function Index({ regions, filters }: RegionPageProps) {
  const { t } = useLanguageContext();

  const safeRegions: RegionPaginator = {
    data: regions?.data ?? [],
    current_page: regions?.current_page ?? 1,
    per_page: regions?.per_page ?? 10,
    total: regions?.total ?? 0,
    last_page: regions?.last_page ?? 1,
    from: regions?.from ?? 0,
    to: regions?.to ?? 0,
  };

  const safeFilters: RegionFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<RegionRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRegion, setDeletingRegion] = useState<RegionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((region?: RegionRecord) => {
    setEditingRegion(region ?? null);
    setFormData({
      name: region?.name ?? ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingRegion(null);
      setFormData({ name: "" });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const url = editingRegion
      ? `/settings/regions/${editingRegion.id}`
      : "/settings/regions";

    const method = editingRegion ? "put" : "post";

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
  }, [editingRegion, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((region: RegionRecord) => {
    setDeletingRegion(region);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingRegion(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingRegion) return;

    router.delete(`/settings/regions/${deletingRegion.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingRegion, handleCloseDeleteDialog]);

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

    router.post('/settings/regions/bulk-delete', {
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
        page: partial.page ?? safeRegions.current_page,
        perPage: partial.perPage ?? safeRegions.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged =
        query.search !== (safeFilters.search ?? "") ||
        query.page !== safeRegions.current_page ||
        query.perPage !== safeRegions.per_page ||
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

      router.get("/settings/regions", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeRegions.current_page, safeRegions.per_page, safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<RegionRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: t('settings.regions.regionName'),
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      }
    ],
    [t]
  );

  const rowActions = useMemo<DataTableRowAction<RegionRecord>[]>(
    () => [
      {
        label: t('table.edit'),
        value: "edit",
        onSelect: (region) => {
          handleOpenDrawer(region);
        }
      },
      {
        label: t('table.delete'),
        value: "delete",
        onSelect: (region) => {
          handleOpenDeleteDialog(region);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog, t]
  );

  const bulkActions = useMemo<DataTableBulkAction<RegionRecord>[]>(
    () => [
      {
        label: t('settings.regions.deleteSelection'),
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
      <PageMeta title={t('settings.regions.title')} />
      <main>
        <PageHeader
          title={t('settings.regions.title')}
          subtitle={t('settings.regions.subtitle')}
          icon={Building2}
          count={safeRegions.total}
        />

        <div className="space-y-6">
          <DataTable<RegionRecord>
            data={safeRegions.data}
            columns={columns}
            pagination={{
              page: safeRegions.current_page,
              perPage: safeRegions.per_page,
              total: safeRegions.total
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
                {t('settings.regions.createRegion')}
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
        title={editingRegion ? t('settings.regions.editRegion') : t('settings.regions.createRegion')}
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
              {t('settings.regions.cancel')}
            </button>
            <button
              type="submit"
              form="region-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('settings.regions.processing')}
                </span>
              ) : (
                editingRegion ? t('settings.regions.update') : t('settings.regions.create')
              )}
            </button>
          </>
        }
      >
        <form id="region-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              {t('settings.regions.regionName')} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder={t('settings.regions.enterRegionName')}
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
        title={t('settings.regions.confirmDeleteTitle')}
        description={`${t('settings.regions.confirmDelete')} "${deletingRegion?.name}"? ${t('settings.regions.actionCannotBeUndone')}`}
        confirmText={t('settings.regions.delete')}
        cancelText={t('settings.regions.cancel')}
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
        title={t('settings.regions.confirmBulkDeleteTitle')}
        description={`${t('settings.regions.confirmBulkDelete')} ${bulkDeleteIds.length} ${t('settings.regions.regions')}? ${t('settings.regions.actionCannotBeUndone')}`}
        confirmText={t('settings.regions.delete')}
        cancelText={t('settings.regions.cancel')}
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}
