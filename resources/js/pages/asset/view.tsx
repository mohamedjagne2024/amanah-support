import { Link, router } from "@inertiajs/react";
import { useCallback, useState } from "react";
import { Pencil, Package, RotateCcw, ClipboardCheck } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import DatePicker from "@/components/DatePicker";

type WorkOrder = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: number;
  status: number;
  staff: {
    id: number;
    name: string;
  } | null;
  expenses_total: number;
  expenses_count: number;
  created_at: string | null;
  completed_at: string | null;
};

type Asset = {
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

type ViewAssetPageProps = {
  asset: Asset;
  workOrders: WorkOrder[];
  totalExpenses: number;
};

const STATUS_LOOKUP: Record<number, { label: string; variant: 'success' | 'default' | 'warning' }> = {
  1: { label: "Active", variant: "success" },
  0: { label: "Inactive", variant: "default" },
  3: { label: "Under Maintenance", variant: "warning" }
};

const WORK_ORDER_STATUS_LOOKUP: Record<number, { label: string; variant: 'warning' | 'info' | 'primary' | 'success' | 'danger' }> = {
  0: { label: "Pending", variant: "warning" },
  1: { label: "Approved", variant: "info" },
  2: { label: "In Progress", variant: "primary" },
  3: { label: "Completed", variant: "success" },
  4: { label: "Rejected", variant: "danger" }
};

const PRIORITY_LOOKUP: Record<number, { label: string; variant: 'default' | 'warning' | 'danger' }> = {
  0: { label: "Low", variant: "default" },
  1: { label: "Medium", variant: "warning" },
  2: { label: "High", variant: "danger" }
};

export default function View({ asset, workOrders, totalExpenses }: ViewAssetPageProps) {
  const status = STATUS_LOOKUP[asset.status] ?? STATUS_LOOKUP[0];
  
  // Retire drawer state
  const [isRetireDrawerOpen, setIsRetireDrawerOpen] = useState(false);
  const [retirementReason, setRetirementReason] = useState<string>("");
  const [retirementDate, setRetirementDate] = useState<Date | null>(new Date());
  const [isRetiring, setIsRetiring] = useState(false);
  
  // Restore dialog state
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Retire drawer handlers
  const handleOpenRetireDrawer = useCallback(() => {
    setRetirementReason("");
    setRetirementDate(new Date());
    setIsRetireDrawerOpen(true);
  }, []);

  const handleCloseRetireDrawer = useCallback(() => {
    setIsRetireDrawerOpen(false);
    setTimeout(() => {
      setRetirementReason("");
      setRetirementDate(null);
    }, 300);
  }, []);

  const handleSubmitRetire = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    router.post(`/asset-management/${asset.id}/retire`, {
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
  }, [asset.id, retirementDate, retirementReason, handleCloseRetireDrawer]);

  // Restore dialog handlers
  const handleOpenRestoreDialog = useCallback(() => {
    setIsRestoreDialogOpen(true);
  }, []);

  const handleCloseRestoreDialog = useCallback(() => {
    setIsRestoreDialogOpen(false);
  }, []);

  const handleConfirmRestore = useCallback(() => {
    router.post(`/asset-management/${asset.id}/restore`, {}, {
      preserveScroll: true,
      onStart: () => setIsRestoring(true),
      onFinish: () => {
        setIsRestoring(false);
        handleCloseRestoreDialog();
      }
    });
  }, [asset.id, handleCloseRestoreDialog]);

  // Calculate net asset value
  const assetValue = asset.purchase_cost ? Number(asset.purchase_cost) : 0;
  const netValue = assetValue - totalExpenses;

  return (
    <AppLayout>
      <PageMeta title="Asset Details" />
      <main>
        {/* Header with breadcrumb and actions */}
        <div className="flex items-center md:justify-between flex-wrap gap-2 mb-6">
          <PageBreadcrumb 
            title="Asset Details" 
            subtitle="Asset Management"
            subtitleUrl="/asset-management"
          />
          <div className="flex items-center gap-3">
            <Menu as="div" className="relative inline-flex">
              <MenuButton className="btn btn-sm btn-outline-dashed border-primary text-primary hover:bg-primary/10">
                Actions
              </MenuButton>
              <MenuItems
                anchor="bottom end"
                className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
              >
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      href={`/asset-management/${asset.id}/edit`}
                      className={`flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                        focus ? 'bg-default-150' : ''
                      }`}
                    >
                      <Pencil className="size-4" /> Edit
                    </Link>
                  )}
                </MenuItem>
                {asset.status === 1 && (
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleOpenRetireDrawer}
                        className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-warning rounded cursor-pointer ${
                          focus ? 'bg-warning/10' : ''
                        }`}
                      >
                        <Package className="size-4" /> Retire Asset
                      </button>
                    )}
                  </MenuItem>
                )}
                {asset.status === 0 && (
                  <MenuItem>
                    {({ focus }) => (
                      <button
                        onClick={handleOpenRestoreDialog}
                        className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-success rounded cursor-pointer ${
                          focus ? 'bg-success/10' : ''
                        }`}
                      >
                        <RotateCcw className="size-4" /> Restore Asset
                      </button>
                    )}
                  </MenuItem>
                )}
              </MenuItems>
            </Menu>
          </div>
        </div>

        <div className="space-y-6">
          {/* Asset Information Card */}
          <div className="card">
            <div className="card-body">
              <div className="space-y-4">
                {/* Header with image and name */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-start">
                    {asset.image ? (
                      <img 
                        src={asset.image} 
                        alt={asset.name} 
                        className="size-20 object-cover rounded-md"
                      />
                    ) : (
                      <div className="size-20 bg-default-100 rounded-md" />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-default-800 mb-2">
                        {asset.name}
                      </h2>
                      {asset.description && (
                        <p className="text-sm text-default-600 mb-2">
                          {asset.description}
                        </p>
                      )}
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Serial Number
                    </p>
                    <p className="text-sm text-default-800">{asset.serial_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Purchase Date
                    </p>
                    <p className="text-sm text-default-800">{asset.purchase_date || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Purchase Cost
                    </p>
                    <p className="text-sm font-semibold text-default-800">
                      {asset.purchase_cost 
                        ? `$${Number(asset.purchase_cost).toFixed(2)}`
                        : "-"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Category
                    </p>
                    <p className="text-sm text-default-800">
                      {asset.subcategory 
                        ? (asset.subcategory.category 
                            ? `${asset.subcategory.category.name} / ${asset.subcategory.name}`
                            : asset.subcategory.name)
                        : "-"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Location
                    </p>
                    <p className="text-sm text-default-800">{asset.location?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Assigned Staff
                    </p>
                    <p className="text-sm text-default-800">{asset.staff?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Purchase Order
                    </p>
                    <p className="text-sm text-default-800">{asset.purchase_order?.po_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Created At
                    </p>
                    <p className="text-sm text-default-800">{asset.created_at || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Summary Card */}
          <div className="card">
            <div className="card-body">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-default-800">
                  Financial Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Asset Value
                    </p>
                    <p className="text-xl font-bold text-success">
                      {asset.purchase_cost 
                        ? `$${Number(asset.purchase_cost).toFixed(2)}`
                        : "$0.00"
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Total Maintenance Expenses
                    </p>
                    <p className="text-xl font-bold text-danger">
                      ${Number(totalExpenses).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-default-200">
                  <p className="text-sm font-medium text-default-600 mb-1">
                    Net Asset Value
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ${netValue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Work Orders Tab Section */}
          <div className="card">
            <div className="card-header border-b border-default-200">
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary border-b-2 border-primary -mb-px">
                  <ClipboardCheck className="size-4" />
                  Work Orders ({workOrders.length})
                </button>
              </div>
            </div>
            <div className="card-body">
              {workOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-default-500">No work orders found for this asset.</p>
                </div>
              ) : (
                <div className="border border-default-200 rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-default-50">
                        <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Title</th>
                        <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Status</th>
                        <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Priority</th>
                        <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Assigned Staff</th>
                        <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Due Date</th>
                        <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Expenses</th>
                        <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workOrders.map((workOrder) => {
                        const workOrderStatus = WORK_ORDER_STATUS_LOOKUP[workOrder.status] ?? WORK_ORDER_STATUS_LOOKUP[0];
                        const priority = PRIORITY_LOOKUP[workOrder.priority] ?? PRIORITY_LOOKUP[0];
                        return (
                          <tr key={workOrder.id} className="border-t border-default-200">
                            <td className="px-4 py-3">
                              <p className="font-medium text-sm text-default-800">{workOrder.title}</p>
                              {workOrder.description && (
                                <p className="text-xs text-default-600 mt-1">
                                  {workOrder.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={workOrderStatus.variant}>
                                {workOrderStatus.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={priority.variant}>
                                {priority.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-default-700">{workOrder.staff?.name || "-"}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-default-700">{workOrder.due_date || "-"}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <p className="font-semibold text-sm text-danger">
                                ${Number(workOrder.expenses_total).toFixed(2)}
                              </p>
                              {workOrder.expenses_count > 0 && (
                                <p className="text-xs text-default-500">
                                  ({workOrder.expenses_count} expense{workOrder.expenses_count !== 1 ? 's' : ''})
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/work-orders/${workOrder.id}`}>
                                <button className="btn btn-sm btn-outline-dashed border-primary text-primary hover:bg-primary/10">
                                  View
                                </button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Retire Asset Drawer */}
      <Drawer
        isOpen={isRetireDrawerOpen}
        onClose={handleCloseRetireDrawer}
        title="Retire Asset"
        size="xl"
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
            <p className="text-sm font-medium text-default-600 mb-2">
              Asset to Retire
            </p>
            <p className="text-base font-semibold text-default-800">
              {asset.name}
            </p>
            {asset.serial_number && (
              <p className="text-sm text-default-500">
                Serial: {asset.serial_number}
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
        description={`Are you sure you want to restore the asset "${asset.name}"? This will reactivate the asset.`}
        confirmText="Restore"
        cancelText="Cancel"
        confirmVariant="success"
        isLoading={isRestoring}
        size="lg"
      />
    </AppLayout>
  );
}

