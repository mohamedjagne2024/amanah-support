import { Link, router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableBulkAction, type DataTableFilter, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import DatePicker from "@/components/DatePicker";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Download, Upload, FileSpreadsheet, ChevronDown } from "lucide-react";

type SubCategoryOption = {
  id: number;
  name: string;
  category_name: string | null;
};

type LocationOption = {
  id: number;
  name: string;
};

type AssetRecord = {
  id: number;
  name: string;
  description: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_cost: number | null;
  image: string | null;
  status: number;
  subcategory: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
    } | null;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
  staff: {
    id: number;
    name: string;
  } | null;
  purchase_order: {
    id: number;
    po_number: string;
  } | null;
  created_at: string | null;
};

type AssetPaginator = {
  data: AssetRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type AssetFilters = {
  search?: string | null;
  status?: string | null;
  sub_category_id?: string | null;
  location_id?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type AssetPageProps = {
  assets: AssetPaginator;
  subCategories: SubCategoryOption[];
  locations: LocationOption[];
  filters: AssetFilters;
};

const STATUS_LOOKUP: Record<number, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  1: { label: "Active", variant: "success" },
  0: { label: "Inactive", variant: "default" },
  3: { label: "Under Maintenance", variant: "warning" }
};

export default function Index({ assets, subCategories, locations, filters }: AssetPageProps) {
  const safeAssets: AssetPaginator = {
    data: assets?.data ?? [],
    current_page: assets?.current_page ?? 1,
    per_page: assets?.per_page ?? 10,
    total: assets?.total ?? 0,
    last_page: assets?.last_page ?? 1,
    from: assets?.from ?? 0,
    to: assets?.to ?? 0,
  };

  const safeFilters: AssetFilters = {
    search: filters?.search ?? "",
    status: filters?.status ?? "",
    sub_category_id: filters?.sub_category_id ?? "",
    location_id: filters?.location_id ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<AssetRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Restore dialog state
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [restoringAsset, setRestoringAsset] = useState<AssetRecord | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  
  // Bulk restore dialog state
  const [isBulkRestoreDialogOpen, setIsBulkRestoreDialogOpen] = useState(false);
  const [bulkRestoreIds, setBulkRestoreIds] = useState<number[]>([]);
  const [isBulkRestoring, setIsBulkRestoring] = useState(false);
  
  // Retire drawer state
  const [isRetireDrawerOpen, setIsRetireDrawerOpen] = useState(false);
  const [retiringAsset, setRetiringAsset] = useState<AssetRecord | null>(null);
  const [retirementReason, setRetirementReason] = useState<string>("");
  const [retirementDate, setRetirementDate] = useState<Date | null>(new Date());
  const [isRetiring, setIsRetiring] = useState(false);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((asset: AssetRecord) => {
    setDeletingAsset(asset);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingAsset(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingAsset) return;

    router.delete(`/asset-management/${deletingAsset.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingAsset, handleCloseDeleteDialog]);

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

    router.post('/asset-management/bulk-delete', {
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

  // Restore handlers
  const handleOpenRestoreDialog = useCallback((asset: AssetRecord) => {
    setRestoringAsset(asset);
    setIsRestoreDialogOpen(true);
  }, []);

  const handleCloseRestoreDialog = useCallback(() => {
    setIsRestoreDialogOpen(false);
    setTimeout(() => {
      setRestoringAsset(null);
    }, 300);
  }, []);

  const handleConfirmRestore = useCallback(() => {
    if (!restoringAsset) return;

    router.post(`/asset-management/${restoringAsset.id}/restore`, {}, {
      preserveScroll: true,
      onStart: () => setIsRestoring(true),
      onFinish: () => {
        setIsRestoring(false);
        handleCloseRestoreDialog();
      }
    });
  }, [restoringAsset, handleCloseRestoreDialog]);

  // Bulk restore handlers
  const handleOpenBulkRestoreDialog = useCallback((ids: number[]) => {
    setBulkRestoreIds(ids);
    setIsBulkRestoreDialogOpen(true);
  }, []);

  const handleCloseBulkRestoreDialog = useCallback(() => {
    setIsBulkRestoreDialogOpen(false);
    setTimeout(() => {
      setBulkRestoreIds([]);
    }, 300);
  }, []);

  const handleConfirmBulkRestore = useCallback(() => {
    if (bulkRestoreIds.length === 0) return;

    router.post('/asset-management/bulk-restore', {
      ids: bulkRestoreIds
    }, {
      preserveScroll: true,
      onStart: () => setIsBulkRestoring(true),
      onFinish: () => {
        setIsBulkRestoring(false);
        handleCloseBulkRestoreDialog();
      }
    });
  }, [bulkRestoreIds, handleCloseBulkRestoreDialog]);

  // Retire drawer handlers
  const handleOpenRetireDrawer = useCallback((asset: AssetRecord) => {
    setRetiringAsset(asset);
    setRetirementReason("");
    setRetirementDate(new Date());
    setIsRetireDrawerOpen(true);
  }, []);

  const handleCloseRetireDrawer = useCallback(() => {
    setIsRetireDrawerOpen(false);
    setTimeout(() => {
      setRetiringAsset(null);
      setRetirementReason("");
      setRetirementDate(null);
    }, 300);
  }, []);

  const handleSubmitRetire = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!retiringAsset) return;

    router.post(`/asset-management/${retiringAsset.id}/retire`, {
      retirement_date: retirementDate ? retirementDate.toISOString().split('T')[0] : "",
      reason: retirementReason
    }, {
      preserveScroll: true,
      onStart: () => setIsRetiring(true),
      onFinish: () => {
        setIsRetiring(false);
        handleCloseRetireDrawer();
      }
    });
  }, [retiringAsset, retirementDate, retirementReason, handleCloseRetireDrawer]);

  // Export handler
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    
    if (safeFilters.search) params.append('search', safeFilters.search);
    if (safeFilters.status) params.append('status', safeFilters.status);
    if (safeFilters.sub_category_id) params.append('sub_category_id', safeFilters.sub_category_id);
    if (safeFilters.location_id) params.append('location_id', safeFilters.location_id);

    window.location.href = `/asset-management/export?${params.toString()}`;
  }, [safeFilters]);

  // Import handler
  const handleImportClick = useCallback(() => {
    router.visit('/asset-management/import');
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; status: string; sub_category_id: string; location_id: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        status: partial.status ?? safeFilters.status ?? "",
        sub_category_id: partial.sub_category_id ?? safeFilters.sub_category_id ?? "",
        location_id: partial.location_id ?? safeFilters.location_id ?? "",
        page: partial.page ?? safeAssets.current_page,
        perPage: partial.perPage ?? safeAssets.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.status !== (safeFilters.status ?? "") ||
        query.sub_category_id !== (safeFilters.sub_category_id ?? "") ||
        query.location_id !== (safeFilters.location_id ?? "") ||
        query.page !== safeAssets.current_page ||
        query.perPage !== safeAssets.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if ((key === "search" || key === "status" || key === "sub_category_id" || key === "location_id") && value === "") {
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

      router.get("/asset-management", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeAssets.current_page, safeAssets.per_page, safeFilters.search, safeFilters.status, safeFilters.sub_category_id, safeFilters.location_id, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<AssetRecord, unknown>[]>(
    () => [
      {
        accessorKey: "image",
        header: "Image",
        cell: ({ getValue }) => {
          const imageUrl = getValue<string | null>();
          return imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Asset" 
              className="size-10 object-cover rounded-md"
            />
          ) : (
            <div className="size-10 bg-default-100 rounded-md" />
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue, row }) => (
          <Link href={`/asset-management/${row.original.id}`}>
            <span className="font-medium text-default-800 hover:text-primary hover:underline">
              {getValue<string>()}
            </span>
          </Link>
        ),
        enableSorting: true
      },
      {
        accessorKey: "serial_number",
        header: "Serial Number",
        cell: ({ getValue }) => (
          <span className="text-default-700">{getValue<string | null>() || "-"}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "subcategory",
        header: "Category",
        cell: ({ getValue }) => {
          const subcategory = getValue<AssetRecord['subcategory']>();
          if (!subcategory) return <span className="text-default-500">-</span>;
          return (
            <span className="text-default-700">
              {subcategory.category?.name ? `${subcategory.category.name} - ${subcategory.name}` : subcategory.name}
            </span>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ getValue }) => {
          const location = getValue<AssetRecord['location']>();
          return <span className="text-default-700">{location?.name || "-"}</span>;
        },
        enableSorting: false
      },
      {
        accessorKey: "purchase_cost",
        header: "Cost",
        cell: ({ getValue }) => {
          const cost = getValue<number | null>();
          return <span className="text-default-700">{cost ? `$${Number(cost).toFixed(2)}` : "-"}</span>;
        },
        enableSorting: true
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const statusValue = Number(getValue<number>());
          const status = STATUS_LOOKUP[statusValue] ?? STATUS_LOOKUP[0];

          return (
            <Badge variant={status.variant}>
              {status.label}
            </Badge>
          );
        },
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
        options: [
          { label: "Active", value: "1" },
          { label: "Inactive", value: "0" },
          { label: "Under Maintenance", value: "3" }
        ]
      },
      {
        id: "sub_category_id",
        label: "Category",
        placeholder: "All categories",
        options: (subCategories ?? []).map(sc => ({
          label: sc.category_name ? `${sc.category_name} - ${sc.name}` : sc.name,
          value: String(sc.id)
        }))
      },
      {
        id: "location_id",
        label: "Location",
        placeholder: "All locations",
        options: (locations ?? []).map(loc => ({
          label: loc.name,
          value: String(loc.id)
        }))
      }
    ],
    [subCategories, locations]
  );

  const rowActions = useMemo<DataTableRowAction<AssetRecord>[]>(
    () => [
      {
        label: "View",
        value: "view",
        href: (asset) => `/asset-management/${asset.id}`
      },
      {
        label: "Edit",
        value: "edit",
        href: (asset) => `/asset-management/${asset.id}/edit`
      },
      {
        label: "Retire",
        value: "retire",
        onSelect: (asset) => {
          handleOpenRetireDrawer(asset);
        },
        condition: (asset) => asset.status === 1
      },
      {
        label: "Restore",
        value: "restore",
        onSelect: (asset) => {
          handleOpenRestoreDialog(asset);
        },
        condition: (asset) => asset.status === 0
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (asset) => {
          handleOpenDeleteDialog(asset);
        }
      },
    ],
    [handleOpenDeleteDialog, handleOpenRetireDrawer, handleOpenRestoreDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<AssetRecord>[]>(
    () => [
      {
        label: "Delete selection",
        value: "delete",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);
          handleOpenBulkDeleteDialog(ids);
        }
      },
      {
        label: "Restore selection",
        value: "restore",
        onSelect: async (selectedRows) => {
          // Only include inactive assets
          const ids = selectedRows
            .filter(row => row.status === 0)
            .map(row => row.id);
          if (ids.length > 0) {
            handleOpenBulkRestoreDialog(ids);
          }
        }
      }
    ],
    [handleOpenBulkDeleteDialog, handleOpenBulkRestoreDialog]
  );

  return (
    <AppLayout>
      <PageMeta title="Assets" />
      <main>
        <PageBreadcrumb title="Assets" subtitle="Asset Management" />
        <div className="space-y-6">
          <DataTable<AssetRecord>
            data={safeAssets.data}
            columns={columns}
            pagination={{
              page: safeAssets.current_page,
              perPage: safeAssets.per_page,
              total: safeAssets.total
            }}
            searchValue={safeFilters.search ?? ""}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            filters={tableFilters}
            filterValues={{
              status: safeFilters.status ?? "",
              sub_category_id: safeFilters.sub_category_id ?? "",
              location_id: safeFilters.location_id ?? ""
            }}
            onFilterChange={(filterId, value) => {
              if (filterId === "status") {
                submitQuery({ status: value, page: 1 });
              } else if (filterId === "sub_category_id") {
                submitQuery({ sub_category_id: value, page: 1 });
              } else if (filterId === "location_id") {
                submitQuery({ location_id: value, page: 1 });
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
                <Link href="/asset-management/create">
                  <button
                    disabled={isBusy}
                    className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
                  >
                    Create Asset
                  </button>
                </Link>
              </div>
            )}
            rowActions={rowActions}
            isLoading={isLoading}
          />
        </div>
      </main>

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
        description={`Are you sure you want to delete the asset "${deletingAsset?.name}"? This action cannot be undone.`}
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
        description={`Are you sure you want to delete ${bulkDeleteIds.length} asset(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        open={isRestoreDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseRestoreDialog();
          }
        }}
        onConfirm={handleConfirmRestore}
        title="Confirm Restore"
        description={`Are you sure you want to restore the asset "${restoringAsset?.name}"? This will reactivate the asset.`}
        confirmText="Restore"
        cancelText="Cancel"
        confirmVariant="success"
        isLoading={isRestoring}
        size="lg"
      />

      {/* Bulk Restore Confirmation Dialog */}
      <ConfirmDialog
        open={isBulkRestoreDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseBulkRestoreDialog();
          }
        }}
        onConfirm={handleConfirmBulkRestore}
        title="Confirm Bulk Restore"
        description={`Are you sure you want to restore ${bulkRestoreIds.length} asset(s)? This will reactivate the selected assets.`}
        confirmText="Restore"
        cancelText="Cancel"
        confirmVariant="success"
        isLoading={isBulkRestoring}
        size="lg"
      />

      {/* Retire Asset Drawer */}
      <Drawer
        isOpen={isRetireDrawerOpen}
        onClose={handleCloseRetireDrawer}
        title="Retire Asset"
        size="lg"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseRetireDrawer}
              disabled={isRetiring}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="retire-form"
              className="btn bg-warning text-white hover:bg-warning/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isRetiring}
            >
              {isRetiring ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Retire Asset"
              )}
            </button>
          </>
        }
      >
        <form id="retire-form" onSubmit={handleSubmitRetire} className="space-y-4">
          {/* Asset Info */}
          <div>
            <label className="block text-sm font-medium text-default-600 mb-2">
              Asset to Retire
            </label>
            <p className="text-base font-semibold text-default-800">
              {retiringAsset?.name}
            </p>
            {retiringAsset?.serial_number && (
              <p className="text-sm text-default-500">
                Serial: {retiringAsset.serial_number}
              </p>
            )}
          </div>

          {/* Retirement Date */}
          <div>
            <DatePicker
              label="Retirement Date"
              value={retirementDate ?? undefined}
              onChange={(dates) => setRetirementDate(dates[0] ?? null)}
              placeholder="Select retirement date"
              disabled={isRetiring}
              required
            />
          </div>

          {/* Retirement Reason */}
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Retirement Reason
            </label>
            <textarea
              name="reason"
              placeholder="Enter reason for retiring this asset..."
              value={retirementReason}
              onChange={(e) => setRetirementReason(e.target.value)}
              disabled={isRetiring}
              rows={4}
              className="form-input w-full"
            />
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
}

