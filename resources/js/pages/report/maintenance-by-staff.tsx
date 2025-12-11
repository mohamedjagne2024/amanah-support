import { router } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import { Download, Printer, ChevronDown } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import DatePicker from "@/components/DatePicker";

type StaffData = {
  staff_id: number | null;
  staff_name: string;
  maintenance_jobs_count: number;
  total_expenses: number;
};

type MaintenanceByStaffPageProps = {
  staff_data: StaffData[];
  filters: {
    start_date: string | null;
    end_date: string | null;
  };
  summary: {
    total_staff: number;
    total_maintenance_jobs: number;
    total_expenses: number;
    generated_at: string;
  };
};

export default function MaintenanceByStaff({
  staff_data,
  filters,
  summary,
}: MaintenanceByStaffPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  // Calculate totals from data
  const totals = useMemo(() => {
    const totalStaff = staff_data.length;
    const totalJobs = staff_data.reduce((sum, staff) => sum + staff.maintenance_jobs_count, 0);
    const totalExpenses = staff_data.reduce((sum, staff) => sum + staff.total_expenses, 0);
    return { totalStaff, totalJobs, totalExpenses };
  }, [staff_data]);

  // Check if any filters are applied
  const hasFilters = filters.start_date || filters.end_date;

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const query: Record<string, string | number | null> = {};

    if (localFilters.start_date) query.start_date = localFilters.start_date;
    if (localFilters.end_date) query.end_date = localFilters.end_date;

    router.get("/reports/maintenance-by-staff", query, {
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
    router.get("/reports/maintenance-by-staff", {}, {
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

    window.location.href = `/reports/maintenance-by-staff/export?${params.toString()}`;
  }, [localFilters]);

  return (
    <AppLayout>
      <PageMeta title="Maintenance by Staff Report" />
      <main>
        {/* Page Header & Filters - Hidden on print */}
        <Disclosure as="div" className="mb-4 print:hidden" defaultOpen={!!hasFilters}>
          {({ open }) => (
            <>
              <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4">
                <h4 className="text-default-900 text-lg font-semibold">Maintenance by Staff Report</h4>
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
                  MAINTENANCE BY STAFF REPORT
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
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Staff Members</p>
                  <p className="text-2xl font-bold text-default-800 mt-1">{summary.total_staff.toLocaleString()}</p>
                </div>
                <div className="flex-1 p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Maintenance Jobs</p>
                  <p className="text-2xl font-bold text-info mt-1">{summary.total_maintenance_jobs.toLocaleString()}</p>
                </div>
                <div className="flex-1 p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Expenses</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ${summary.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Maintenance Table */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Maintenance Jobs by Staff</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full divide-y divide-default-200 dark:divide-white/14">
                      <thead className="bg-default-150">
                        <tr className="text-default-600">
                          <th className="py-3 px-4 text-start text-sm font-medium">Staff Name</th>
                          <th className="py-3 px-4 text-center text-sm font-medium">Number of Maintenance Jobs</th>
                          <th className="py-3 px-4 text-end text-sm font-medium">Total Expenses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-default-200 dark:divide-white/14">
                        {staff_data.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-10 text-center">
                              <p className="text-sm text-default-500">No maintenance data found for the selected date range.</p>
                            </td>
                          </tr>
                        ) : (
                          staff_data.map((staff) => (
                            <tr key={staff.staff_id || 'unassigned'} className="text-default-800">
                              <td className="py-3 px-4 text-sm font-medium">
                                {staff.staff_name}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="py-0.5 px-2.5 inline-flex items-center text-xs font-medium rounded bg-info/15 text-info">
                                  {staff.maintenance_jobs_count}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-end text-sm font-medium">
                                ${staff.total_expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {staff_data.length > 0 && (
                        <tfoot>
                          <tr className="border-t-2 border-default-300 bg-default-50">
                            <td className="px-4 py-3 font-semibold text-sm text-default-800">Total</td>
                            <td className="px-4 py-3 text-center">
                              <span className="py-0.5 px-2.5 inline-flex items-center text-xs font-medium rounded bg-info text-white">
                                {totals.totalJobs}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-end font-semibold text-sm text-default-800">
                              ${totals.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
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

