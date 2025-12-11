import { router } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import { Download, Printer, ChevronDown } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import DatePicker from "@/components/DatePicker";
import ComboboxComponent, { SelectOption } from "@/components/Combobox";

type StatusBreakdown = {
  status: string;
  count: number;
  total_value: number;
  percentage: number;
};

type CategoryBreakdown = {
  category: string;
  count: number;
  total_value: number;
};

type LocationBreakdown = {
  location: string;
  count: number;
  total_value: number;
};

type StaffBreakdown = {
  staff: string;
  id: number | null;
  count: number;
  total_value: number;
};

type FilterOption = {
  id: number;
  name: string;
};

type AssetSummaryPageProps = {
  summary: {
    generated_at: string;
  };
  breakdown: {
    by_status: StatusBreakdown[];
    by_category: CategoryBreakdown[];
    by_location: LocationBreakdown[];
    by_staff: StaffBreakdown[];
  };
  filters: {
    status: string | string[] | null;
    category_id: number | null;
    location_id: number | null;
    staff_id: number | null;
    start_date: string | null;
    end_date: string | null;
  };
  filter_options: {
    categories: FilterOption[];
    locations: FilterOption[];
    staff: FilterOption[];
  };
};

const STATUS_OPTIONS: SelectOption[] = [
  { label: "Available", value: "1" },
  { label: "In Use", value: "2" },
  { label: "Under Maintenance", value: "3" },
  { label: "Retired", value: "4" },
];

export default function AssetSummary({
  summary,
  breakdown,
  filters,
  filter_options,
}: AssetSummaryPageProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    status: filters.status ? (Array.isArray(filters.status) ? filters.status[0] : filters.status) : "",
    category_id: filters.category_id ? String(filters.category_id) : "",
    location_id: filters.location_id ? String(filters.location_id) : "",
    staff_id: filters.staff_id ? String(filters.staff_id) : "",
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
  });

  // Calculate totals
  const totals = useMemo(() => {
    const totalAssets = breakdown.by_status.reduce((sum, item) => sum + item.count, 0);
    const totalValue = breakdown.by_status.reduce((sum, item) => sum + item.total_value, 0);
    return { totalAssets, totalValue };
  }, [breakdown]);

  // Category options for select
  const categoryOptions: SelectOption[] = useMemo(
    () => filter_options.categories.map((cat) => ({ label: cat.name, value: String(cat.id) })),
    [filter_options.categories]
  );

  // Location options for select
  const locationOptions: SelectOption[] = useMemo(
    () => filter_options.locations.map((loc) => ({ label: loc.name, value: String(loc.id) })),
    [filter_options.locations]
  );

  // Staff options for select
  const staffOptions: SelectOption[] = useMemo(
    () => filter_options.staff.map((s) => ({ label: s.name, value: String(s.id) })),
    [filter_options.staff]
  );

  // Get filter label helpers
  const getStatusLabel = (value: string) => STATUS_OPTIONS.find((opt) => opt.value === value)?.label || "All";
  const getCategoryLabel = (value: string) => filter_options.categories.find((cat) => String(cat.id) === value)?.name || "All";
  const getLocationLabel = (value: string) => filter_options.locations.find((loc) => String(loc.id) === value)?.name || "All";
  const getStaffLabel = (value: string) => filter_options.staff.find((s) => String(s.id) === value)?.name || "All";

  // Check if any filters are applied
  const hasFilters = filters.status || filters.category_id || filters.location_id || filters.staff_id || filters.start_date || filters.end_date;

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const query: Record<string, string | number | null> = {};

    if (localFilters.status) query.status = localFilters.status;
    if (localFilters.category_id) query.category_id = parseInt(localFilters.category_id);
    if (localFilters.location_id) query.location_id = parseInt(localFilters.location_id);
    if (localFilters.staff_id) query.staff_id = parseInt(localFilters.staff_id);
    if (localFilters.start_date) query.start_date = localFilters.start_date;
    if (localFilters.end_date) query.end_date = localFilters.end_date;

    router.get("/reports/asset-summary", query, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, [localFilters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      status: "",
      category_id: "",
      location_id: "",
      staff_id: "",
      start_date: "",
      end_date: "",
    });
    router.get("/reports/asset-summary", {}, {
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
    if (localFilters.status) params.append("status", localFilters.status);
    if (localFilters.category_id) params.append("category_id", localFilters.category_id);
    if (localFilters.location_id) params.append("location_id", localFilters.location_id);
    if (localFilters.staff_id) params.append("staff_id", localFilters.staff_id);
    if (localFilters.start_date) params.append("start_date", localFilters.start_date);
    if (localFilters.end_date) params.append("end_date", localFilters.end_date);

    window.location.href = `/reports/asset-summary/export?${params.toString()}`;
  }, [localFilters]);

  return (
    <AppLayout>
      <PageMeta title="Asset Summary Report" />
      <main>
        {/* Page Header & Filters - Hidden on print */}
        <Disclosure as="div" className="mb-4 print:hidden" defaultOpen={!!hasFilters}>
          {({ open }) => (
            <>
              <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4">
                <h4 className="text-default-900 text-lg font-semibold">Asset Summary Report</h4>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">Status</label>
                      <ComboboxComponent
                        options={STATUS_OPTIONS}
                        value={STATUS_OPTIONS.find((opt) => opt.value === localFilters.status) || null}
                        onChange={(val) => setLocalFilters((prev) => ({ ...prev, status: val ? String((val as SelectOption).value) : "" }))}
                        placeholder="All statuses"
                        isClearable
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">Category</label>
                      <ComboboxComponent
                        options={categoryOptions}
                        value={categoryOptions.find((opt) => opt.value === localFilters.category_id) || null}
                        onChange={(val) => setLocalFilters((prev) => ({ ...prev, category_id: val ? String((val as SelectOption).value) : "" }))}
                        placeholder="All categories"
                        isClearable
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">Location</label>
                      <ComboboxComponent
                        options={locationOptions}
                        value={locationOptions.find((opt) => opt.value === localFilters.location_id) || null}
                        onChange={(val) => setLocalFilters((prev) => ({ ...prev, location_id: val ? String((val as SelectOption).value) : "" }))}
                        placeholder="All locations"
                        isClearable
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">Assigned Staff</label>
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
                  ASSET SUMMARY REPORT
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
                    {filters.status && (
                      <div>
                        <span className="text-xs text-default-500">Status:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {getStatusLabel(Array.isArray(filters.status) ? filters.status[0] : filters.status)}
                        </span>
                      </div>
                    )}
                    {filters.category_id && (
                      <div>
                        <span className="text-xs text-default-500">Category:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {getCategoryLabel(String(filters.category_id))}
                        </span>
                      </div>
                    )}
                    {filters.location_id && (
                      <div>
                        <span className="text-xs text-default-500">Location:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {getLocationLabel(String(filters.location_id))}
                        </span>
                      </div>
                    )}
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
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Assets</p>
                  <p className="text-2xl font-bold text-default-800 mt-1">{totals.totalAssets.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-default-50 rounded-lg border border-default-200">
                  <p className="text-xs text-default-500 uppercase tracking-wider">Total Value</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Assets by Status */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Assets by Status</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Status</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Total Value</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_status.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_status.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.status}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">
                            ${item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">{item.percentage}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {breakdown.by_status.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-default-300 bg-default-50">
                        <td className="px-4 py-3 font-semibold text-sm text-default-800">Total</td>
                        <td className="px-4 py-3 text-center font-semibold text-sm text-default-800">{totals.totalAssets}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-default-800">
                          ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-default-800">100%</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Assets by Category */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Assets by Category</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Category</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_category.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_category.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.category}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">
                            ${item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {breakdown.by_category.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-default-300 bg-default-50">
                        <td className="px-4 py-3 font-semibold text-sm text-default-800">Total</td>
                        <td className="px-4 py-3 text-center font-semibold text-sm text-default-800">{totals.totalAssets}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-default-800">
                          ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Assets by Location */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Assets by Location</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Location</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_location.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_location.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.location}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">
                            ${item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {breakdown.by_location.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-default-300 bg-default-50">
                        <td className="px-4 py-3 font-semibold text-sm text-default-800">Total</td>
                        <td className="px-4 py-3 text-center font-semibold text-sm text-default-800">{totals.totalAssets}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-default-800">
                          ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Assets by Staff */}
            <div className="mb-6">
              <h6 className="text-sm font-semibold text-default-800 mb-3">Assets by Staff</h6>
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-default-50">
                      <th className="text-left text-sm font-medium text-default-700 px-4 py-3">Staff Member</th>
                      <th className="text-center text-sm font-medium text-default-700 px-4 py-3">Count</th>
                      <th className="text-right text-sm font-medium text-default-700 px-4 py-3">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.by_staff.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-default-500">
                          No data available
                        </td>
                      </tr>
                    ) : (
                      breakdown.by_staff.map((item, index) => (
                        <tr key={index} className="border-t border-default-200">
                          <td className="px-4 py-3 font-medium text-sm text-default-800">{item.staff}</td>
                          <td className="px-4 py-3 text-center text-sm text-default-700">{item.count}</td>
                          <td className="px-4 py-3 text-right text-sm text-default-700">
                            ${item.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {breakdown.by_staff.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-default-300 bg-default-50">
                        <td className="px-4 py-3 font-semibold text-sm text-default-800">Total</td>
                        <td className="px-4 py-3 text-center font-semibold text-sm text-default-800">{totals.totalAssets}</td>
                        <td className="px-4 py-3 text-right font-semibold text-sm text-default-800">
                          ${totals.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  )}
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
