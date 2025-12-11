import { router, Link } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import { Download, Printer, ChevronDown } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import DatePicker from "@/components/DatePicker";
import ComboboxComponent, { SelectOption } from "@/components/Combobox";

type WorkOrder = {
  id: number;
  title: string;
  description: string | null;
  completed_at: string;
  priority: string;
  priority_value: number;
  asset: {
    id: number;
    name: string;
    serial_number: string | null;
    location: {
      id: number;
      name: string;
    } | null;
  } | null;
};

type StaffActivity = {
  id: number;
  name: string;
  total_completed: number;
  work_orders: WorkOrder[];
};

type StaffOption = {
  id: number;
  name: string;
};

type MaintenanceActivityPageProps = {
  staff_activity: StaffActivity[];
  staff_list: StaffOption[];
  filters: {
    staff_id: number | null;
    start_date: string | null;
    end_date: string | null;
  };
  summary: {
    generated_at: string;
  };
};

const PRIORITY_COLORS: Record<number, string> = {
  0: "bg-default/15 text-default-800", // Low
  1: "bg-warning/15 text-warning",     // Medium
  2: "bg-danger/15 text-danger"        // High
};

export default function MaintenanceActivity({
  staff_activity,
  staff_list,
  filters,
  summary,
}: MaintenanceActivityPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    staff_id: filters.staff_id ? String(filters.staff_id) : "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  // Calculate totals
  const totals = useMemo(() => {
    const totalStaff = staff_activity.length;
    const totalWorkOrders = staff_activity.reduce((sum, staff) => sum + staff.total_completed, 0);
    return { totalStaff, totalWorkOrders };
  }, [staff_activity]);

  // Staff options for select
  const staffOptions: SelectOption[] = useMemo(
    () => staff_list.map((s) => ({ label: s.name, value: String(s.id) })),
    [staff_list]
  );

  // Get filter label helpers
  const getStaffLabel = (value: string) => staff_list.find((s) => String(s.id) === value)?.name || "All";

  // Check if any filters are applied
  const hasFilters = filters.staff_id || filters.start_date || filters.end_date;

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const query: Record<string, string | number | null> = {};

    if (localFilters.staff_id) query.staff_id = parseInt(localFilters.staff_id);
    if (localFilters.start_date) query.start_date = localFilters.start_date;
    if (localFilters.end_date) query.end_date = localFilters.end_date;

    router.get("/reports/maintenance-activity", query, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, [localFilters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      staff_id: "",
      start_date: "",
      end_date: "",
    });
    router.get("/reports/maintenance-activity", {}, {
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
    if (localFilters.staff_id) params.append("staff_id", localFilters.staff_id);
    if (localFilters.start_date) params.append("start_date", localFilters.start_date);
    if (localFilters.end_date) params.append("end_date", localFilters.end_date);

    window.location.href = `/reports/maintenance-activity/export?${params.toString()}`;
  }, [localFilters]);

  return (
    <AppLayout>
      <PageMeta title="Maintenance Activity Report" />
      <main>
        {/* Page Header & Filters - Hidden on print */}
        <Disclosure as="div" className="mb-4 print:hidden" defaultOpen={!!hasFilters}>
          {({ open }) => (
            <>
              <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4">
                <h4 className="text-default-900 text-lg font-semibold">Maintenance Activity Report</h4>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">Staff</label>
                      <ComboboxComponent
                        options={staffOptions}
                        value={staffOptions.find((opt) => opt.value === localFilters.staff_id) || null}
                        onChange={(val) => setLocalFilters((prev) => ({ ...prev, staff_id: val ? String((val as SelectOption).value) : "" }))}
                        placeholder="All staff"
                        isClearable
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
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
                  MAINTENANCE ACTIVITY REPORT
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
                    {filters.staff_id && (
                      <div>
                        <span className="text-xs text-default-500">Staff:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {getStaffLabel(String(filters.staff_id))}
                        </span>
                      </div>
                    )}
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
                  <p className="text-xs text-default-500 uppercase tracking-wider">Staff Members</p>
                  <p className="text-2xl font-bold text-default-800 mt-1">{totals.totalStaff.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Completed Tasks</p>
                  <p className="text-2xl font-bold text-primary mt-1">{totals.totalWorkOrders.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Staff Activity Sections */}
            {staff_activity.length === 0 ? (
              <div className="p-8 text-center bg-default-50 rounded-lg border border-default-200">
                <p className="text-default-500">
                  No maintenance activity found for the selected filters.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {staff_activity.map((staff) => (
                  <div key={staff.id} className="border border-default-200 rounded-lg overflow-hidden">
                    {/* Staff Header */}
                    <div className="px-4 py-3 bg-default-50 border-b border-default-200">
                      <div className="flex items-center gap-3">
                        <h6 className="text-sm font-semibold text-default-800">{staff.name}</h6>
                        <span className="py-0.5 px-2.5 inline-flex items-center text-xs font-medium rounded bg-info/15 text-info">
                          {staff.total_completed} {staff.total_completed === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                    </div>

                    {/* Work Orders Table */}
                    <div className="overflow-x-auto">
                      <div className="min-w-full inline-block align-middle">
                        <table className="min-w-full divide-y divide-default-200 dark:divide-white/14">
                          <thead className="bg-default-150">
                            <tr className="text-default-600">
                              <th className="py-3 px-3.5 text-start text-sm font-medium">Work Order</th>
                              <th className="py-3 px-3.5 text-start text-sm font-medium">Asset</th>
                              <th className="py-3 px-3.5 text-start text-sm font-medium">Serial Number</th>
                              <th className="py-3 px-3.5 text-start text-sm font-medium">Location</th>
                              <th className="py-3 px-3.5 text-start text-sm font-medium">Completed Date</th>
                              <th className="py-3 px-3.5 text-center text-sm font-medium">Priority</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-default-200 dark:divide-white/14">
                            {staff.work_orders.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-3.5 py-10 text-center">
                                  <p className="text-sm text-default-500">No work orders found</p>
                                </td>
                              </tr>
                            ) : (
                              staff.work_orders.map((workOrder) => (
                                <tr key={workOrder.id} className="text-default-800">
                                  <td className="py-2.5 px-3.5 text-sm">
                                    <div>
                                      <Link
                                        href={`/work-orders/${workOrder.id}`}
                                        className="font-medium text-default-800 hover:text-primary hover:underline"
                                      >
                                        {workOrder.title}
                                      </Link>
                                      {workOrder.description && (
                                        <p className="text-xs text-default-500 mt-1 line-clamp-2">
                                          {workOrder.description}
                                        </p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3.5 text-sm">
                                    {workOrder.asset?.name || "-"}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-sm text-default-600">
                                    {workOrder.asset?.serial_number || "-"}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-sm">
                                    {workOrder.asset?.location?.name || "-"}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-sm">
                                    {workOrder.completed_at || "-"}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-center">
                                    <span className={`py-0.5 px-2.5 inline-flex items-center text-xs font-medium rounded ${PRIORITY_COLORS[workOrder.priority_value] || "bg-default/15 text-default-800"}`}>
                                      {workOrder.priority}
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
                ))}
              </div>
            )}
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

