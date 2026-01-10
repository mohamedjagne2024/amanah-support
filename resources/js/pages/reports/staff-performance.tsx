import { router } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import { Printer, ChevronDown } from "lucide-react";
import { Menu, MenuButton, MenuItem, MenuItems, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import ComboboxComponent, { SelectOption } from "@/components/Combobox";
import { useLanguageContext } from "@/context/useLanguageContext";

type RecentActivity = {
  type: "ticket" | "comment" | "message";
  id: number;
  uid?: string;
  title: string;
  status?: string;
  priority?: string;
  preview?: string;
  ticket_uid?: string;
  conversation_id?: number;
  formatted_date: string;
};

type ChartDataItem = {
  month?: string;
  status?: string;
  priority?: string;
  count: number;
};

type StaffInfo = {
  id: number;
  name: string;
  email: string;
  title: string;
  avatar: string | null;
};

type SummaryMetrics = {
  tickets_created: number;
  tickets_assigned: number;
  tickets_open: number;
  tickets_closed: number;
  total_comments: number;
  avg_comments_per_ticket: number;
  total_messages: number;
  conversations_participated: number;
  public_conversations: number;
  total_mentions: number;
  mentions_in_comments: number;
  mentions_in_messages: number;
};

type PerformanceMetrics = {
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
  resolution_rate: number;
  satisfaction_score: number;
};

type ReportData = {
  staff: StaffInfo;
  summary: SummaryMetrics;
  performance: PerformanceMetrics;
  charts: {
    ticket_trends: ChartDataItem[];
    tickets_by_status: ChartDataItem[];
    tickets_by_priority: ChartDataItem[];
  };
  recent_activity: RecentActivity[];
};

type StaffMember = {
  id: number;
  name: string;
};

type StaffPerformancePageProps = {
  staffMembers: StaffMember[];
  reportData: ReportData | null;
  filters: {
    staff_id: number | null;
    date_from: string | null;
    date_to: string | null;
  };
};

export default function StaffPerformance({
  staffMembers,
  reportData,
  filters,
}: StaffPerformancePageProps) {
  const { t } = useLanguageContext();
  const [isLoading, setIsLoading] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    staff_id: filters.staff_id ? String(filters.staff_id) : "",
    date_from: filters.date_from || "",
    date_to: filters.date_to || "",
  });

  // Staff options for select
  const staffOptions: SelectOption[] = useMemo(
    () => staffMembers.map((staff) => ({ label: staff.name, value: String(staff.id) })),
    [staffMembers]
  );

  // Get filter label helper
  const getStaffLabel = (value: string) =>
    staffMembers.find((s) => String(s.id) === value)?.name || "All";

  // Check if any filters are applied
  const hasFilters = filters.staff_id || filters.date_from || filters.date_to;

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const query: Record<string, string | number | null> = {};

    if (localFilters.staff_id) query.staff_id = parseInt(localFilters.staff_id);
    if (localFilters.date_from) query.date_from = localFilters.date_from;
    if (localFilters.date_to) query.date_to = localFilters.date_to;

    router.get("/reports/staff-performance", query, {
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
      date_from: "",
      date_to: "",
    });
    router.get("/reports/staff-performance", {}, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, []);

  // Print handler
  const handlePrint = () => {
    const reportContent = document.querySelector('.card.w-\\[297mm\\]');
    if (!reportContent) return;

    const contentClone = reportContent.cloneNode(true) as HTMLElement;
    const paginationButtons = contentClone.querySelectorAll('.print\\:hidden');
    paginationButtons.forEach(el => el.remove());

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the report.');
      return;
    }

    const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
      .map(link => link.outerHTML)
      .join('\n');

    const styleTags = Array.from(document.querySelectorAll('style'))
      .map(style => style.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${t('reports.staffPerformance.title')}</title>
          ${stylesheetLinks}
          ${styleTags}
          <style>
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 20px;
              background: white !important;
            }
            .print-container {
              width: 100%;
              max-width: 100%;
              margin: 0 auto;
            }
            .print-container > * {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              box-shadow: none !important;
            }
            @media print {
              body {
                padding: 0;
              }
              .print-container {
                width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${contentClone.outerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onafterprint = function () {
      printWindow.close();
    };

    printWindow.onload = function () {
      setTimeout(function () {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };

    setTimeout(function () {
      if (!printWindow.closed && printWindow.document.readyState === 'complete') {
        printWindow.focus();
        printWindow.print();
      }
    }, 1000);
  };

  // Helper functions
  const formatHours = (hours: number): string => {
    if (hours === 0) return "N/A";
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'bg-blue-100 text-blue-800';
      case 'comment':
        return 'bg-purple-100 text-purple-800';
      case 'message':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-default-100 text-default-700';
    }
  };

  const formatDateRange = (): string => {
    if (filters.date_from && filters.date_to) {
      return `${new Date(filters.date_from).toLocaleDateString()} - ${new Date(filters.date_to).toLocaleDateString()}`;
    }
    if (filters.date_from) return `${t('reports.staffPerformance.from')} ${new Date(filters.date_from).toLocaleDateString()}`;
    if (filters.date_to) return `${t('reports.staffPerformance.to')} ${new Date(filters.date_to).toLocaleDateString()}`;
    return t('reports.staffPerformance.allTime');
  };

  const generatedAt = new Date().toLocaleString();

  return (
    <AppLayout>
      <PageMeta title={t('reports.staffPerformance.title')} />
      <main>
        {/* Page Header & Filters - Hidden on print */}
        <Disclosure as="div" className="mb-4 print:hidden" defaultOpen={!!hasFilters}>
          {({ open }) => (
            <>
              <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4">
                <h4 className="text-default-900 text-lg font-semibold">{t('reports.staffPerformance.title')}</h4>
                <div className="flex items-center gap-3">
                  <DisclosureButton className="btn border btn-outline-dashed border-primary text-primary hover:bg-primary/10 btn-sm">
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    {t('reports.staffPerformance.filters')} {hasFilters && <span className="text-primary text-xs">({t('reports.staffPerformance.applied')})</span>}
                  </DisclosureButton>
                  <Menu as="div" className="relative inline-flex">
                    <MenuButton className="btn border btn-outline-dashed border-primary text-primary hover:bg-primary/10 btn-sm">
                      {t('reports.staffPerformance.actions')}
                    </MenuButton>
                    <MenuItems
                      anchor="bottom end"
                      className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
                    >
                      <MenuItem>
                        {({ focus }) => (
                          <button
                            onClick={handlePrint}
                            className={`w-full text-left flex items-center gap-2 py-1.5 font-medium px-3 text-default-500 rounded cursor-pointer ${focus ? "bg-default-150" : ""
                              }`}
                          >
                            <Printer className="size-4" /> {t('reports.staffPerformance.print')}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">{t('reports.staffPerformance.staffMember')}</label>
                      <ComboboxComponent
                        options={staffOptions}
                        value={staffOptions.find((opt) => opt.value === localFilters.staff_id) || null}
                        onChange={(val) => setLocalFilters((prev) => ({ ...prev, staff_id: val ? String((val as SelectOption).value) : "" }))}
                        placeholder={t('reports.staffPerformance.selectStaff')}
                        isClearable
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">{t('reports.staffPerformance.fromDate')}</label>
                      <input
                        type="date"
                        value={localFilters.date_from}
                        onChange={(e) => setLocalFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                        className="form-input form-input-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">{t('reports.staffPerformance.toDate')}</label>
                      <input
                        type="date"
                        value={localFilters.date_to}
                        onChange={(e) => setLocalFilters((prev) => ({ ...prev, date_to: e.target.value }))}
                        className="form-input form-input-sm w-full"
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
                        {t('reports.staffPerformance.clear')}
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
                          {t('reports.staffPerformance.applying')}
                        </span>
                      ) : (
                        t('reports.staffPerformance.applyFilters')
                      )}
                    </button>
                  </div>
                </div>
              </DisclosurePanel>
            </>
          )}
        </Disclosure>

        {/* A4 Report Container */}
        <div className="card w-[297mm] min-h-[210mm] mx-auto print:shadow-none print:rounded-none print:w-full print:max-w-full print:m-0 print:border-none print:bg-transparent">
          {/* Report Header */}
          <div className="!py-8 !px-10 print:px-0">
            <div className="flex justify-between items-start w-full">
              {/* Logo */}
              <div className="flex-shrink-0">
                <img
                  src="/assets/images/logo-dark.png"
                  alt="Company Logo"
                  className="h-20 w-auto object-contain"
                />
              </div>

              {/* Report Title */}
              <div className="text-right">
                <h1 className="text-4xl font-bold text-primary tracking-wide">
                  {t('reports.staffPerformance.title').toUpperCase()}
                </h1>
                <p className="text-sm text-default-600 mt-1">
                  {t('reports.staffPerformance.generated')}: {generatedAt}
                </p>
              </div>
            </div>
          </div>

          {/* Staff Info Section */}
          {reportData && (
            <div className="!px-10 !pb-6 print:px-0">
              <div className="flex justify-between items-start">
                {/* Staff Details */}
                <div>
                  <h2 className="text-lg font-bold text-primary mb-1">
                    {reportData.staff.name}
                  </h2>
                  <p className="text-sm text-default-600 leading-relaxed">
                    {reportData.staff.title} • {reportData.staff.email}
                  </p>
                </div>

                {/* Total Summary Box */}
                <div className="text-right">
                  <p className="text-sm text-default-500 mb-1">{t('reports.staffPerformance.period')}</p>
                  <p className="text-xl font-bold text-default-900">
                    {formatDateRange()}
                  </p>
                  <p className="text-sm text-default-500 mt-1">{reportData.summary.tickets_assigned} {t('reports.staffPerformance.totalTicketsAssigned')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Report Content */}
          <div className="card-body !p-8 print:p-0">
            {/* Applied Filters Section */}
            {hasFilters && (
              <div className="mb-6">
                <p className="text-sm font-medium text-default-600 mb-3">
                  {t('reports.staffPerformance.filterCriteria')}
                </p>
                <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filters.staff_id && (
                      <div>
                        <span className="text-xs text-default-500">{t('reports.staffPerformance.staffMember')}:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {getStaffLabel(String(filters.staff_id))}
                        </span>
                      </div>
                    )}
                    {filters.date_from && (
                      <div>
                        <span className="text-xs text-default-500">{t('reports.staffPerformance.from')}:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {new Date(filters.date_from).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {filters.date_to && (
                      <div>
                        <span className="text-xs text-default-500">{t('reports.staffPerformance.to')}:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {new Date(filters.date_to).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Staff Selected */}
            {!reportData ? (
              <div className="text-center py-12 text-default-500 border border-default-200 rounded-lg">
                {t('reports.staffPerformance.selectStaffPrompt')}
              </div>
            ) : (
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {/* TICKETS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.staffPerformance.tickets')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.totalAssigned')}:</span> {reportData.summary.tickets_assigned}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.resolutionRate')}:</span> {reportData.performance.resolution_rate}%
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Tickets Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.staffPerformance.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.count')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.count')}</th>
                    </tr>

                    {/* Tickets Data */}
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.staffPerformance.ticketsCreated')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{reportData.summary.tickets_created}</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.staffPerformance.ticketsAssigned')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{reportData.summary.tickets_assigned}</td>
                    </tr>
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.staffPerformance.ticketsOpen')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-yellow-600">{reportData.summary.tickets_open}</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.staffPerformance.ticketsClosed')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-green-600">{reportData.summary.tickets_closed}</td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* COMMENTS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.staffPerformance.comments')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.total')}:</span> {reportData.summary.total_comments}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.avgPerTicket')}:</span> {reportData.summary.avg_comments_per_ticket}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* MESSAGES SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.staffPerformance.messages')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.totalSent')}:</span> {reportData.summary.total_messages}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* CONVERSATIONS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.staffPerformance.conversations')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.participated')}:</span> {reportData.summary.conversations_participated}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.publicWidget')}:</span> {reportData.summary.public_conversations}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* MENTIONS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.staffPerformance.mentions')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.total')}:</span> {reportData.summary.total_mentions}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.inComments')}:</span> {reportData.summary.mentions_in_comments}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.staffPerformance.inMessages')}:</span> {reportData.summary.mentions_in_messages}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* PERFORMANCE METRICS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.staffPerformance.performanceMetrics')}</span>
                      </td>
                    </tr>

                    {/* Performance Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.staffPerformance.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.value')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.value')}</th>
                    </tr>

                    {/* Performance Data */}
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.staffPerformance.avgResponseTime')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{formatHours(reportData.performance.avg_response_time_hours)}</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.staffPerformance.avgResolutionTime')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{formatHours(reportData.performance.avg_resolution_time_hours)}</td>
                    </tr>
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.staffPerformance.resolutionRate')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-green-600">{reportData.performance.resolution_rate}%</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.staffPerformance.satisfactionScore')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-amber-600">
                        {reportData.performance.satisfaction_score > 0 ? `${reportData.performance.satisfaction_score}/5` : 'N/A'}
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* TICKETS BY STATUS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.staffPerformance.ticketsByStatus')}</span>
                      </td>
                    </tr>

                    {/* Status Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.staffPerformance.status')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.count')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2" colSpan={2}>{t('reports.staffPerformance.percentage')}</th>
                    </tr>

                    {/* Status Data */}
                    {reportData.charts.tickets_by_status.length > 0 ? (
                      reportData.charts.tickets_by_status.map((item, index) => {
                        const total = reportData.charts.tickets_by_status.reduce((acc, i) => acc + i.count, 0);
                        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={index} className="border-t border-default-100 hover:bg-default-50/50">
                            <td className="px-6 py-2 text-sm text-default-700">{item.status}</td>
                            <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{item.count}</td>
                            <td className="px-4 py-2 text-sm text-default-700 text-center" colSpan={2}>{percentage}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-default-100">
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.staffPerformance.noDataAvailable')}</td>
                      </tr>
                    )}

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* TICKETS BY PRIORITY SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.staffPerformance.ticketsByPriority')}</span>
                      </td>
                    </tr>

                    {/* Priority Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.staffPerformance.priority')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.count')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2" colSpan={2}>{t('reports.staffPerformance.percentage')}</th>
                    </tr>

                    {/* Priority Data */}
                    {reportData.charts.tickets_by_priority.length > 0 ? (
                      reportData.charts.tickets_by_priority.map((item, index) => {
                        const total = reportData.charts.tickets_by_priority.reduce((acc, i) => acc + i.count, 0);
                        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={index} className="border-t border-default-100 hover:bg-default-50/50">
                            <td className="px-6 py-2 text-sm text-default-700">{item.priority}</td>
                            <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{item.count}</td>
                            <td className="px-4 py-2 text-sm text-default-700 text-center" colSpan={2}>{percentage}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-default-100">
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.staffPerformance.noDataAvailable')}</td>
                      </tr>
                    )}

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* RECENT ACTIVITY SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.staffPerformance.recentActivity')}</span>
                      </td>
                    </tr>

                    {/* Activity Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.staffPerformance.dateTime')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.type')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.description')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.staffPerformance.reference')}</th>
                    </tr>

                    {/* Activity Data */}
                    {reportData.recent_activity.length > 0 ? (
                      reportData.recent_activity.map((activity, index) => (
                        <tr key={`${activity.type}-${activity.id}-${index}`} className="border-t border-default-100 hover:bg-default-50/50">
                          <td className="px-6 py-2 text-xs text-default-700 whitespace-nowrap">{activity.formatted_date}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getActivityTypeBadge(activity.type)}`}>
                              {activity.type}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="text-xs text-default-700 line-clamp-1">{activity.title}</div>
                            {activity.preview && (
                              <div className="text-xs text-default-500 line-clamp-1 mt-0.5">{activity.preview}</div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-default-700 text-center">
                            {activity.uid ? `#${activity.uid}` : activity.ticket_uid ? `Ticket #${activity.ticket_uid}` : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-t border-default-100">
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.staffPerformance.noRecentActivity')}</td>
                      </tr>
                    )}

                    {/* GRAND TOTAL ROW */}
                    <tr className="bg-default-200 border-t-2 border-default-400">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-default-800">{t('reports.staffPerformance.summaryTotals')}</span>
                          <div className="flex gap-8">
                            <span className="font-bold text-default-800">
                              {t('reports.staffPerformance.tickets')}: {reportData.summary.tickets_assigned}
                            </span>
                            <span className="font-bold text-default-800">
                              {t('reports.staffPerformance.comments')}: {reportData.summary.total_comments}
                            </span>
                            <span className="font-bold text-default-800">
                              {t('reports.staffPerformance.messages')}: {reportData.summary.total_messages}
                            </span>
                            <span className="font-bold text-default-800">
                              {t('reports.staffPerformance.resolution')}: {reportData.performance.resolution_rate}%
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Report Footer */}
          <div className="card-footer !py-3.5 !px-8 print:border-none print:px-0 flex-col gap-4">
            {/* Page Number */}
            <div className="text-center text-sm text-default-500">
              {t('reports.staffPerformance.pageOf')}
            </div>

            {/* Footer Info */}
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-default-500">
                {t('reports.staffPerformance.generated')}: {generatedAt}
              </span>
              <span className="text-xs text-default-500">
                {t('reports.staffPerformance.systemFooter')}
              </span>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
