import { router } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import { Download, Printer, ChevronDown } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import DatePicker from "@/components/DatePicker";

type Asset = {
  id: number;
  name: string;
  serial_number: string | null;
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
};

type WorkOrderItem = {
  id: number;
  title: string;
  due_date?: string | null;
  completed_at?: string | null;
  priority: string;
  priority_value: number;
  status?: string;
  status_value?: number;
  asset: {
    id: number;
    name: string;
    location: {
      id: number;
      name: string;
    } | null;
  } | null;
  staff: {
    id: number;
    name: string;
  } | null;
};

type StatusBreakdown = {
  status: string;
  count: number;
  percentage: number;
};

type PriorityBreakdown = {
  priority: string;
  priority_value: number;
  count: number;
};

type AssetBreakdown = {
  asset: string;
  serial_number: string | null;
  count: number;
  total_expense: number;
};

type StaffBreakdown = {
  staff: string;
  count: number;
};

type MaintenanceInsightsPageProps = {
  summary: {
    generated_at: string;
  };
  breakdown: {
    by_status: StatusBreakdown[];
    by_priority: PriorityBreakdown[];
    by_asset: AssetBreakdown[];
    by_staff: StaffBreakdown[];
  };
  assets_under_maintenance: Asset[];
  upcoming_maintenance: WorkOrderItem[];
  recent_completed: WorkOrderItem[];
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
};

const STATUS_COLORS: Record<number, string> = {
  0: "bg-yellow-100 text-yellow-800",   // Pending
  1: "bg-blue-100 text-blue-800",       // Approved
  2: "bg-cyan-100 text-cyan-800",       // In Progress
  3: "bg-green-100 text-green-800",     // Completed
  4: "bg-red-100 text-red-800"          // Rejected
};

const PRIORITY_COLORS: Record<number, string> = {
  0: "bg-gray-100 text-gray-800",       // Low
  1: "bg-orange-100 text-orange-800",   // Medium
  2: "bg-red-100 text-red-800"          // High
};

export default function MaintenanceInsights({
  summary,
  breakdown,
  assets_under_maintenance,
  upcoming_maintenance,
  recent_completed,
  filters,
}: MaintenanceInsightsPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  // Calculate totals
  const totals = useMemo(() => {
    const totalWorkOrders = breakdown.by_status.reduce((sum, item) => sum + item.count, 0);
    const totalExpense = breakdown.by_asset.reduce((sum, item) => sum + (item.total_expense || 0), 0);
    return { totalWorkOrders, totalExpense };
  }, [breakdown]);

  // Check if any filters are applied
  const hasFilters = filters.start_date || filters.end_date;

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const query: Record<string, string | null> = {};

    if (localFilters.start_date) query.start_date = localFilters.start_date;
    if (localFilters.end_date) query.end_date = localFilters.end_date;

    router.get("/reports/maintenance-insights", query, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, [localFilters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      start_date: "",
      end_date: "",
    });
    router.get("/reports/maintenance-insights", {}, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, []);

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export handler
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    if (localFilters.start_date) params.append("start_date", localFilters.start_date);
    if (localFilters.end_date) params.append("end_date", localFilters.end_date);

    window.location.href = `/reports/maintenance-insights/export?${params.toString()}`;
  }, [localFilters]);

  return (
    <AppLayout>
      <PageMeta title="Maintenance Insights Report" />
      <main>
        {/* Page Header & Filters - Hidden on print */}
        <Disclosure as="div" className="mb-4 print:hidden" defaultOpen={!!hasFilters}>
          {({ open }) => (
            <>
              <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4">
                <h4 className="text-default-900 text-lg font-semibold">Maintenance Insights Report</h4>
                <div className="flex items-center gap-3">
                  <DisclosureButton className="btn border btn-outline-dashed border-primary text-primary hover:bg-primary/10 btn-sm">
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    Filters {hasFilters && <span className="text-primary text-xs">(Applied)</span>}
                  </DisclosureButton>
                  <Menu as="div" className="relative inline-flex">
                    <MenuButton className="btn border btn-outline-dashed border-primary text-primary hover:bg-primary/10 btn-sm">
                      Actions
                    </MenuButton>
                    <MenuItems
                      anchor="bottom end"
                      className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
                    >
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={handleExport}
                            className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                              focus ? "bg-default-150" : ""
                            }`}
                          >
                            <Download className="size-4" /> Export to Excel
                          </button>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={handlePrint}
                            className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${
                              focus ? "bg-default-150" : ""
                            }`}
                          >
                            <Printer className="size-4" /> Print
                          </button>
                        )}
                      </MenuItem>
                    </MenuItems>
                  </Menu>
                </div>
              </div>

              {/* Filters Panel */}
              <DisclosurePanel className="card">
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <DatePicker
                        label="Start Date"
                        value={localFilters.start_date || undefined}
                        onChange={(dates, dateStr) => setLocalFilters((prev) => ({ ...prev, start_date: dateStr }))}
                        placeholder="From date"
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                    <div>
                      <DatePicker
                        label="End Date"
                        value={localFilters.end_date || undefined}
                        onChange={(dates, dateStr) => setLocalFilters((prev) => ({ ...prev, end_date: dateStr }))}
                        placeholder="To date"
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    {hasFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="btn btn-sm bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
                        disabled={isLoading}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      onClick={handleApplyFilters}
                      className="btn btn-sm bg-primary text-white hover:bg-primary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Applying...
                        </span>
                      ) : (
                        "Apply Filters"
                      )}
                    </button>
                  </div>
                </div>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>

        {/* A4 Report Container */}
        <div className="card w-[210mm] min-h-[297mm] mx-auto print:shadow-none print:rounded-none print:w-full print:max-w-full print:m-0 print:border-none print:bg-transparent">
          {/* Report Header */}
          <div className="card-header !min-h-0 !py-6 !px-8 print:border-none print:px-0">
            <div className="flex justify-between items-start w-full">
              <div>
                <h1 className="text-3xl font-bold text-default-800">
                  MAINTENANCE INSIGHTS REPORT
                </h1>
                <p className="text-sm text-default-600 mt-1">
                  Amanah Insurance Assets
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-default-600">Report Generated</p>
                <p className="text-sm font-medium text-default-800">{summary.generated_at}</p>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="card-body !p-8 print:p-0">
            {/* Applied Filters Section */}
            {hasFilters && (
              <div className="mb-6">
                <p className="text-sm font-medium text-default-600 mb-3">
                  Filter Criteria
                </p>
                <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filters.start_date && (
                      <div>
                        <span className="text-xs text-default-500">From:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">{filters.start_date}</span>
                      </div>
                    )}
                    {filters.end_date && (
                      <div>
                        <span className="text-xs text-default-500">To:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">{filters.end_date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Summary Section */}
            <div className="mb-8">
              <p className="text-sm font-medium text-default-600 mb-3">
                Summary Overview
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Work Orders</p>
                  <p className="text-2xl font-bold text-default-800 mt-1">{totals.totalWorkOrders.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Expense</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ${totals.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Work Orders by Status */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Work Orders by Status</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Status</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_status.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_status.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.status}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">{item.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {breakdown.by_status.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-default-300 bg-default-50">
                        <td className="px-4 py-3 font-semibold text-sm text-default-800">Total</td>
                        <td className="px-4 py-3 text-center font-semibold text-sm text-default-800">{totals.totalWorkOrders}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-default-800">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Work Orders by Priority */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Work Orders by Priority</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Priority</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_priority.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_priority.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[item.priority_value] || "bg-gray-100 text-gray-800"}`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top 10 Assets by Work Orders */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Top 10 Assets by Work Orders</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Asset</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Serial Number</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Total Expense</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_asset.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_asset.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.asset}</td>
                          <td className="px-4 py-3 text-sm text-default-600">{item.serial_number || "-"}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-default-700">
                            ${item.total_expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Work Orders by Staff */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Work Orders by Staff</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Staff Member</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_staff.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_staff.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.staff}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Assets Currently Under Maintenance */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Assets Currently Under Maintenance</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">#</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Asset Name</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Serial Number</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Category</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Location</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Assigned To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets_under_maintenance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-default-500">
                          No assets currently under maintenance
                        </td>
                      </tr>
                    ) : (
                      assets_under_maintenance.map((asset, index) => (
                        <tr key={asset.id} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{index + 1}</td>
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{asset.name}</td>
                          <td className="px-4 py-3 text-sm text-default-600">{asset.serial_number || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">
                            {asset.subcategory
                              ? asset.subcategory.category?.name
                                ? `${asset.subcategory.category.name} / ${asset.subcategory.name}`
                                : asset.subcategory.name
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-default-700">{asset.location?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{asset.staff?.name || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Upcoming Maintenance (Next 7 Days) */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Upcoming Maintenance (Next 7 Days)</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Title</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Due Date</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Asset</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Location</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Assigned To</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Priority</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming_maintenance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-default-500">
                          No upcoming maintenance scheduled
                        </td>
                      </tr>
                    ) : (
                      upcoming_maintenance.map((wo) => (
                        <tr key={wo.id} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{wo.title}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.due_date || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.asset?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.asset?.location?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.staff?.name || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[wo.priority_value] || "bg-gray-100 text-gray-800"}`}>
                              {wo.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[wo.status_value ?? 0] || "bg-gray-100 text-gray-800"}`}>
                              {wo.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recently Completed Work Orders */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Recently Completed Work Orders (Last 10)</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Title</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Completed At</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Asset</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Location</th>
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Staff</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent_completed.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-default-500">
                          No completed work orders
                        </td>
                      </tr>
                    ) : (
                      recent_completed.map((wo) => (
                        <tr key={wo.id} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{wo.title}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.completed_at || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.asset?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.asset?.location?.name || "-"}</td>
                          <td className="px-4 py-3 text-sm text-default-700">{wo.staff?.name || "-"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[wo.priority_value] || "bg-gray-100 text-gray-800"}`}>
                              {wo.priority}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Report Footer */}
          <div className="card-footer !py-3.5 !px-8 print:border-none print:px-0">
            <span className="text-xs text-default-500">
              Generated: {summary.generated_at}
            </span>
            <span className="text-xs text-default-500">
              Amanah Insurance Asset Management System
            </span>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}

