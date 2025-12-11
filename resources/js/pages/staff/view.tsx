import { Link, router } from "@inertiajs/react";
import { useState } from "react";
import { Folder, ClipboardCheck, ArrowLeft } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/DataTable";

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
  purchase_order: {
    id: number;
    po_number: string;
  } | null;
  created_at: string | null;
};

type WorkOrder = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: number;
  status: number;
  asset: {
    id: number;
    name: string;
    serial_number: string | null;
    location: {
      id: number;
      name: string;
    } | null;
  } | null;
  created_user: {
    id: number;
    name: string;
  } | null;
  approved_user: {
    id: number;
    name: string;
  } | null;
  rejected_user: {
    id: number;
    name: string;
  } | null;
  completed_user: {
    id: number;
    name: string;
  } | null;
  approved_at: string | null;
  rejected_at: string | null;
  completed_at: string | null;
  attachments_count: number;
  expenses_total: string;
  expenses_count: number;
  created_at: string | null;
  updated_at: string | null;
};

type Staff = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  department_id: number | null;
  department: {
    id: number;
    name: string;
  } | null;
  status: number;
  created_at: string | null;
  assets: Asset[];
  work_orders: WorkOrder[];
};

type ViewStaffPageProps = {
  staff: Staff;
};

const STATUS_LOOKUP: Record<number, { label: string; variant: 'success' | 'default' }> = {
  1: { label: "Active", variant: "success" },
  0: { label: "Inactive", variant: "default" }
};

const ASSET_STATUS_LOOKUP: Record<number, { label: string; variant: 'success' | 'default' | 'warning' }> = {
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

export default function View({ staff }: ViewStaffPageProps) {
  const status = STATUS_LOOKUP[staff.status] ?? STATUS_LOOKUP[0];
  const [activeTab, setActiveTab] = useState<'assets' | 'work-orders'>('assets');

  return (
    <AppLayout>
      <PageMeta title="Staff Details" />
      <main>
        {/* Header with breadcrumb and actions */}
        <div className="flex items-center md:justify-between flex-wrap gap-2 mb-6">
          <PageBreadcrumb 
            title="Staff Details" 
            subtitle="Staff"
            subtitleUrl="/staffs"
          />
        </div>

        <div className="space-y-6">
          {/* Staff Information Card */}
          <div className="card">
            <div className="card-body">
              <div className="space-y-4">
                {/* Header with name and status */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-default-800 mb-2">
                      {staff.name}
                    </h2>
                    <Badge variant={status.variant}>
                      {status.label}
                    </Badge>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Email
                    </p>
                    <p className="text-sm text-default-800">{staff.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Phone
                    </p>
                    <p className="text-sm text-default-800">{staff.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      City
                    </p>
                    <p className="text-sm text-default-800">{staff.city || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Department
                    </p>
                    <p className="text-sm text-default-800">{staff.department?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-default-600 mb-1">
                      Created At
                    </p>
                    <p className="text-sm text-default-800">{staff.created_at || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="card">
            <div className="card-header border-b border-default-200">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setActiveTab('assets')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t -mb-px ${
                    activeTab === 'assets' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-default-500 hover:text-default-700'
                  }`}
                >
                  <Folder className="size-4" />
                  Assets ({staff.assets?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveTab('work-orders')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t -mb-px ${
                    activeTab === 'work-orders' 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-default-500 hover:text-default-700'
                  }`}
                >
                  <ClipboardCheck className="size-4" />
                  Work Orders ({staff.work_orders?.length || 0})
                </button>
              </div>
            </div>
            <div className="card-body">
              {/* Assets Tab */}
              {activeTab === 'assets' && (
                <>
                  {!staff.assets || staff.assets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-default-500">No assets assigned to this staff member.</p>
                    </div>
                  ) : (
                    <div className="border border-default-200 rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-default-50">
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Image</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Name</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Serial Number</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Category</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Location</th>
                            <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Purchase Cost</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Status</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.assets.map((asset) => {
                            const assetStatus = ASSET_STATUS_LOOKUP[asset.status] ?? ASSET_STATUS_LOOKUP[0];
                            return (
                              <tr key={asset.id} className="border-t border-default-200">
                                <td className="px-4 py-3">
                                  {asset.image ? (
                                    <img 
                                      src={asset.image} 
                                      alt={asset.name} 
                                      className="size-10 object-cover rounded-md"
                                    />
                                  ) : (
                                    <div className="size-10 bg-default-100 rounded-md" />
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-medium text-sm text-default-800">{asset.name}</p>
                                  {asset.description && (
                                    <p className="text-xs text-default-600 mt-1">
                                      {asset.description}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-default-700">{asset.serial_number || "-"}</p>
                                </td>
                                <td className="px-4 py-3">
                                  {asset.subcategory ? (
                                    <p className="text-sm text-default-700">
                                      {asset.subcategory.category?.name 
                                        ? `${asset.subcategory.category.name} / ${asset.subcategory.name}`
                                        : asset.subcategory.name
                                      }
                                    </p>
                                  ) : (
                                    <p className="text-sm text-default-500">-</p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-default-700">{asset.location?.name || "-"}</p>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <p className="text-sm text-default-700">
                                    {asset.purchase_cost 
                                      ? `$${Number(asset.purchase_cost).toFixed(2)}`
                                      : "-"
                                    }
                                  </p>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={assetStatus.variant}>
                                    {assetStatus.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => router.visit(`/asset-management/${asset.id}`)}
                                    className="btn btn-sm btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Work Orders Tab */}
              {activeTab === 'work-orders' && (
                <>
                  {!staff.work_orders || staff.work_orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-default-500">No work orders assigned to this staff member.</p>
                    </div>
                  ) : (
                    <div className="border border-default-200 rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-default-50">
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Title</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Asset</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Due Date</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Priority</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Status</th>
                            <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Expenses</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Created By</th>
                            <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {staff.work_orders.map((workOrder) => {
                            const workOrderStatus = WORK_ORDER_STATUS_LOOKUP[workOrder.status] ?? WORK_ORDER_STATUS_LOOKUP[0];
                            const priority = PRIORITY_LOOKUP[workOrder.priority] ?? PRIORITY_LOOKUP[0];
                            return (
                              <tr key={workOrder.id} className="border-t border-default-200">
                                <td className="px-4 py-3">
                                  <p className="font-medium text-sm text-default-800">{workOrder.title}</p>
                                  {workOrder.description && (
                                    <p className="text-xs text-default-600 mt-1 line-clamp-2">
                                      {workOrder.description}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {workOrder.asset ? (
                                    <div>
                                      <p className="text-sm font-medium text-default-800">{workOrder.asset.name}</p>
                                      {workOrder.asset.serial_number && (
                                        <p className="text-xs text-default-600">
                                          {workOrder.asset.serial_number}
                                        </p>
                                      )}
                                      {workOrder.asset.location && (
                                        <p className="text-xs text-default-500 mt-0.5">
                                          {workOrder.asset.location.name}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-default-500">-</p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-default-700">{workOrder.due_date || "-"}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={priority.variant}>
                                    {priority.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant={workOrderStatus.variant}>
                                    {workOrderStatus.label}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <p className="text-sm text-default-700">
                                    {workOrder.expenses_total && Number(workOrder.expenses_total) > 0
                                      ? `$${Number(workOrder.expenses_total).toFixed(2)}`
                                      : "-"
                                    }
                                  </p>
                                  {workOrder.expenses_count > 0 && (
                                    <p className="text-xs text-default-500">
                                      ({workOrder.expenses_count} expense{workOrder.expenses_count !== 1 ? 's' : ''})
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="text-sm text-default-700">{workOrder.created_user?.name || "-"}</p>
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
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

