import { Link, router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type DataTableBulkAction, type DataTableFilter, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";

type PurchaseOrderRecord = {
  id: number;
  po_number: string;
  title: string;
  purchase_date: string;
  staff: {
    id: number;
    name: string;
  } | null;
  items_count: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  grand_total: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
};

type PurchaseOrderPaginator = {
  data: PurchaseOrderRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type PurchaseOrderFilters = {
  search?: string | null;
  status?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type PurchaseOrderPageProps = {
  purchaseOrders: PurchaseOrderPaginator;
  filters: PurchaseOrderFilters;
};

const STATUS_LOOKUP: Record<number, { label: string; className: string }> = {
  0: { label: "Pending", className: "bg-warning/15 text-warning" },
  2: { label: "Approved", className: "bg-success/15 text-success" },
  3: { label: "Rejected", className: "bg-danger/15 text-danger" },
  4: { label: "Received", className: "bg-info/15 text-info" }
};

export default function Index({ purchaseOrders, filters }: PurchaseOrderPageProps) {
  const safePurchaseOrders: PurchaseOrderPaginator = {
    data: purchaseOrders?.data ?? [],
    current_page: purchaseOrders?.current_page ?? 1,
    per_page: purchaseOrders?.per_page ?? 10,
    total: purchaseOrders?.total ?? 0,
    last_page: purchaseOrders?.last_page ?? 1,
    from: purchaseOrders?.from ?? 0,
    to: purchaseOrders?.to ?? 0,
  };
  
  const safeFilters: PurchaseOrderFilters = {
    search: filters?.search ?? "",
    status: filters?.status ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPurchaseOrder, setDeletingPurchaseOrder] = useState<PurchaseOrderRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<{
    type: 'approve' | 'reject' | 'receive' | 'delete';
    rows: PurchaseOrderRecord[];
    onConfirm: () => Promise<void>;
  } | null>(null);
  const [isExecutingBulkAction, setIsExecutingBulkAction] = useState(false);

  const handleOpenDeleteDialog = useCallback((purchaseOrder: PurchaseOrderRecord) => {
    setDeletingPurchaseOrder(purchaseOrder);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    // Delay clearing the state to allow the dialog animation to complete
    setTimeout(() => {
      setDeletingPurchaseOrder(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingPurchaseOrder) return;

    router.delete(`/purchase-orders/${deletingPurchaseOrder.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingPurchaseOrder, handleCloseDeleteDialog]);

  const handleCloseBulkActionDialog = useCallback(() => {
    setIsBulkActionDialogOpen(false);
    // Delay clearing the state to allow the dialog animation to complete
    setTimeout(() => {
      setPendingBulkAction(null);
    }, 300);
  }, []);

  const handleConfirmBulkAction = useCallback(async () => {
    if (!pendingBulkAction) return;

    setIsExecutingBulkAction(true);
    try {
      await pendingBulkAction.onConfirm();
      handleCloseBulkActionDialog();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsExecutingBulkAction(false);
    }
  }, [pendingBulkAction, handleCloseBulkActionDialog]);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; status: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        status: partial.status ?? safeFilters.status ?? "",
        page: partial.page ?? safePurchaseOrders.current_page,
        perPage: partial.perPage ?? safePurchaseOrders.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.status !== (safeFilters.status ?? "") ||
        query.page !== safePurchaseOrders.current_page ||
        query.perPage !== safePurchaseOrders.per_page ||
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

      router.get("/purchase-orders", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safePurchaseOrders.current_page, safePurchaseOrders.per_page, safeFilters.search, safeFilters.status, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<PurchaseOrderRecord, unknown>[]>(
    () => [
      {
        accessorKey: "po_number",
        header: "PO Number",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ getValue }) => <span className="text-default-700">{getValue<string>()}</span>,
        enableSorting: true
      },
      {
        accessorKey: "purchase_date",
        header: "Purchase Date",
        cell: ({ getValue }) => (
          <span className="text-default-700">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "grand_total",
        header: "Grand Total",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">${Number(getValue<number>()).toFixed(2)}</span>
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
            <span className={`py-0.5 px-2.5 inline-flex items-center gap-x-1 text-xs font-medium rounded ${status.className}`}>
              {status.label}
            </span>
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
        options: [
          { label: "Pending", value: "0" },
          { label: "Approved", value: "2" },
          { label: "Rejected", value: "3" },
          { label: "Received", value: "4" }
        ]
      }
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<PurchaseOrderRecord>[]>(
    () => [
      {
        label: "View",
        value: "view",
        href: (purchaseOrder) => `/purchase-orders/${purchaseOrder.id}`
      },
      {
        label: "Edit",
        value: "edit",
        href: (purchaseOrder) => `/purchase-orders/${purchaseOrder.id}/edit`
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (purchaseOrder) => {
          handleOpenDeleteDialog(purchaseOrder);
        }
      },
    ],
    [handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<PurchaseOrderRecord>[]>(
    () => [
      {
        label: "Approve selected",
        value: "approve",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);

          setPendingBulkAction({
            type: 'approve',
            rows: selectedRows,
            onConfirm: () => new Promise<void>((resolve, reject) => {
              router.post(
                '/purchase-orders/bulk-approve',
                { ids },
                {
                  preserveScroll: true,
                  onSuccess: () => {
                    resolve();
                  },
                  onError: () => {
                    reject(new Error("Failed to approve purchase orders"));
                  }
                }
              );
            })
          });
          setIsBulkActionDialogOpen(true);
        }
      },
      {
        label: "Receive selected",
        value: "receive",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);

          setPendingBulkAction({
            type: 'receive',
            rows: selectedRows,
            onConfirm: () => new Promise<void>((resolve, reject) => {
              router.post(
                '/purchase-orders/bulk-receive',
                { ids },
                {
                  preserveScroll: true,
                  onSuccess: () => {
                    resolve();
                  },
                  onError: () => {
                    reject(new Error("Failed to receive purchase orders"));
                  }
                }
              );
            })
          });
          setIsBulkActionDialogOpen(true);
        }
      },
      {
        label: "Reject selected",
        value: "reject",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);

          setPendingBulkAction({
            type: 'reject',
            rows: selectedRows,
            onConfirm: () => new Promise<void>((resolve, reject) => {
              router.post(
                '/purchase-orders/bulk-reject',
                { ids },
                {
                  preserveScroll: true,
                  onSuccess: () => {
                    resolve();
                  },
                  onError: () => {
                    reject(new Error("Failed to reject purchase orders"));
                  }
                }
              );
            })
          });
          setIsBulkActionDialogOpen(true);
        }
      },
      {
        label: "Delete selected",
        value: "delete",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);

          setPendingBulkAction({
            type: 'delete',
            rows: selectedRows,
            onConfirm: () => new Promise<void>((resolve, reject) => {
              // Delete each purchase order sequentially
              const deletePromises = ids.map(id => 
                new Promise<void>((deleteResolve, deleteReject) => {
                  router.delete(`/purchase-orders/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => deleteResolve(),
                    onError: () => deleteReject()
                  });
                })
              );

              Promise.all(deletePromises)
                .then(() => resolve())
                .catch(() => reject(new Error("Failed to delete some purchase orders")));
            })
          });
          setIsBulkActionDialogOpen(true);
        }
      }
    ],
    []
  );

  const getBulkActionTitle = () => {
    if (!pendingBulkAction) return 'Confirm Action';
    switch (pendingBulkAction.type) {
      case 'approve': return 'Confirm Approve';
      case 'receive': return 'Confirm Receive';
      case 'reject': return 'Confirm Reject';
      case 'delete': return 'Confirm Delete';
      default: return 'Confirm Action';
    }
  };

  const getBulkActionDescription = () => {
    if (!pendingBulkAction) return '';
    const count = pendingBulkAction.rows.length;
    switch (pendingBulkAction.type) {
      case 'approve':
        return `Are you sure you want to approve ${count} purchase order(s)?`;
      case 'receive':
        return `Are you sure you want to receive ${count} purchase order(s)? This will create assets from the purchase order items.`;
      case 'reject':
        return `Are you sure you want to reject ${count} purchase order(s)?`;
      case 'delete':
        return `Are you sure you want to delete ${count} purchase order(s)? This action cannot be undone.`;
      default:
        return '';
    }
  };

  const getBulkActionConfirmText = () => {
    if (!pendingBulkAction) return 'Confirm';
    switch (pendingBulkAction.type) {
      case 'approve': return 'Approve';
      case 'receive': return 'Receive';
      case 'reject': return 'Reject';
      case 'delete': return 'Delete';
      default: return 'Confirm';
    }
  };

  const getBulkActionVariant = (): 'danger' | 'primary' | 'success' => {
    if (!pendingBulkAction) return 'primary';
    switch (pendingBulkAction.type) {
      case 'approve':
      case 'receive':
        return 'success';
      case 'reject':
      case 'delete':
        return 'danger';
      default:
        return 'primary';
    }
  };

  return (
    <AppLayout>
      <PageMeta title="Purchase Orders" />
      <main>
        <PageBreadcrumb title="Purchase Orders" subtitle="Asset Management" />
        <div className="space-y-6">
          <DataTable<PurchaseOrderRecord>
            data={safePurchaseOrders.data}
            columns={columns}
            pagination={{
              page: safePurchaseOrders.current_page,
              perPage: safePurchaseOrders.per_page,
              total: safePurchaseOrders.total
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
              <Link href="/purchase-orders/create">
                <button
                  disabled={isBusy}
                  className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
                >
                  Create Purchase Order
                </button>
              </Link>
            )}
            rowActions={rowActions}
            isLoading={isLoading}
          />
        </div>
      </main>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteDialog();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the purchase order "${deletingPurchaseOrder?.po_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />

      <ConfirmDialog
        open={isBulkActionDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseBulkActionDialog();
          }
        }}
        onConfirm={handleConfirmBulkAction}
        title={getBulkActionTitle()}
        description={getBulkActionDescription()}
        confirmText={getBulkActionConfirmText()}
        cancelText="Cancel"
        confirmVariant={getBulkActionVariant()}
        isLoading={isExecutingBulkAction}
        size="lg"
      />
    </AppLayout>
  );
}
