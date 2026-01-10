import { router } from "@inertiajs/react";
import { useCallback, useMemo, useState } from "react";
import { Printer, ChevronDown, Building2, Users, Mail, Phone, MapPin } from "lucide-react";
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
  contact?: string;
  user?: string;
  formatted_date: string;
};

type ChartDataItem = {
  status?: string;
  priority?: string;
  category?: string;
  contact?: string;
  email?: string;
  count: number;
};

type OrganizationInfo = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

type ContactInfo = {
  id: number;
  name: string;
  email: string;
};

type SummaryMetrics = {
  total_contacts: number;
  tickets_submitted: number;
  tickets_open: number;
  tickets_closed: number;
  tickets_pending: number;
  total_comments: number;
  comments_from_contacts: number;
  comments_from_staff: number;
  total_messages: number;
  total_conversations: number;
};

type PerformanceMetrics = {
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
  resolution_rate: number;
  satisfaction_score: number;
};

type ReportData = {
  organization: OrganizationInfo;
  contacts: ContactInfo[];
  summary: SummaryMetrics;
  performance: PerformanceMetrics;
  charts: {
    tickets_by_status: ChartDataItem[];
    tickets_by_priority: ChartDataItem[];
    tickets_by_category: ChartDataItem[];
    tickets_by_contact: ChartDataItem[];
  };
  recent_activity: RecentActivity[];
};

type Organization = {
  id: number;
  name: string;
};

type SupportByOrganizationPageProps = {
  organizations: Organization[];
  reportData: ReportData | null;
  filters: {
    organization_id: number | null;
    date_from: string | null;
    date_to: string | null;
  };
};

export default function SupportByOrganization({
  organizations,
  reportData,
  filters,
}: SupportByOrganizationPageProps) {
  const { t } = useLanguageContext();
  const [isLoading, setIsLoading] = useState(false);

  // Local filter state
  const [localFilters, setLocalFilters] = useState({
    organization_id: filters.organization_id ? String(filters.organization_id) : "",
    date_from: filters.date_from || "",
    date_to: filters.date_to || "",
  });

  // Organization options for select
  const organizationOptions: SelectOption[] = useMemo(
    () => organizations.map((org) => ({ label: org.name, value: String(org.id) })),
    [organizations]
  );

  // Get filter label helper
  const getOrganizationLabel = (value: string) =>
    organizations.find((o) => String(o.id) === value)?.name || "All";

  // Check if any filters are applied
  const hasFilters = filters.organization_id || filters.date_from || filters.date_to;

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    const query: Record<string, string | number | null> = {};

    if (localFilters.organization_id) query.organization_id = parseInt(localFilters.organization_id);
    if (localFilters.date_from) query.date_from = localFilters.date_from;
    if (localFilters.date_to) query.date_to = localFilters.date_to;

    router.get("/reports/support-by-organization", query, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, [localFilters]);

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setLocalFilters({
      organization_id: "",
      date_from: "",
      date_to: "",
    });
    router.get("/reports/support-by-organization", {}, {
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
          <title>${t('reports.supportByOrg.title')}</title>
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
    if (filters.date_from) return `${t('reports.supportByOrg.from')} ${new Date(filters.date_from).toLocaleDateString()}`;
    if (filters.date_to) return `${t('reports.supportByOrg.to')} ${new Date(filters.date_to).toLocaleDateString()}`;
    return t('reports.supportByOrg.allTime');
  };

  const formatAddress = (org: OrganizationInfo): string => {
    const parts = [org.address, org.city, org.region, org.country].filter(Boolean);
    return parts.join(', ') || t('reports.supportByOrg.noAddressProvided');
  };

  const generatedAt = new Date().toLocaleString();

  return (
    <AppLayout>
      <PageMeta title={t('reports.supportByOrg.title')} />
      <main>
        {/* Page Header & Filters - Hidden on print */}
        <Disclosure as="div" className="mb-4 print:hidden" defaultOpen={!!hasFilters}>
          {({ open }) => (
            <>
              <div className="flex items-center md:justify-between flex-wrap gap-2 mb-4">
                <h4 className="text-default-900 text-lg font-semibold">{t('reports.supportByOrg.title')}</h4>
                <div className="flex items-center gap-3">
                  <DisclosureButton className="btn border btn-outline-dashed border-primary text-primary hover:bg-primary/10 btn-sm">
                    <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
                    {t('reports.supportByOrg.filters')} {hasFilters && <span className="text-primary text-xs">({t('reports.supportByOrg.applied')})</span>}
                  </DisclosureButton>
                  <Menu as="div" className="relative inline-flex">
                    <MenuButton className="btn border btn-outline-dashed border-primary text-primary hover:bg-primary/10 btn-sm">
                      {t('reports.supportByOrg.actions')}
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
                            <Printer className="size-4" /> {t('reports.supportByOrg.print')}
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
                      <label className="block text-sm font-medium text-default-700 mb-1.5">{t('reports.supportByOrg.organization')}</label>
                      <ComboboxComponent
                        options={organizationOptions}
                        value={organizationOptions.find((opt) => opt.value === localFilters.organization_id) || null}
                        onChange={(val) => setLocalFilters((prev) => ({ ...prev, organization_id: val ? String((val as SelectOption).value) : "" }))}
                        placeholder={t('reports.supportByOrg.selectOrganization')}
                        isClearable
                        inputClassName="form-input form-input-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">{t('reports.supportByOrg.fromDate')}</label>
                      <input
                        type="date"
                        value={localFilters.date_from}
                        onChange={(e) => setLocalFilters((prev) => ({ ...prev, date_from: e.target.value }))}
                        className="form-input form-input-sm w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-default-700 mb-1.5">{t('reports.supportByOrg.toDate')}</label>
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
                        {t('reports.supportByOrg.clear')}
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
                          {t('reports.supportByOrg.applying')}
                        </span>
                      ) : (
                        t('reports.supportByOrg.applyFilters')
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
                  {t('reports.supportByOrg.title').toUpperCase()}
                </h1>
                <p className="text-sm text-default-600 mt-1">
                  {t('reports.supportByOrg.generated')}: {generatedAt}
                </p>
              </div>
            </div>
          </div>

          {/* Organization Info Section */}
          {reportData && (
            <div className="!px-10 !pb-6 print:px-0">
              <div className="flex justify-between items-start">
                {/* Organization Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-5 text-primary" />
                    <h2 className="text-lg font-bold text-primary">
                      {reportData.organization.name}
                    </h2>
                  </div>
                  <div className="space-y-1 text-sm text-default-600 ml-7">
                    {reportData.organization.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="size-4" />
                        <span>{reportData.organization.email}</span>
                      </div>
                    )}
                    {reportData.organization.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" />
                        <span>{reportData.organization.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4" />
                      <span>{formatAddress(reportData.organization)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="size-4" />
                      <span>{reportData.summary.total_contacts} {t('reports.supportByOrg.contact')}(s)</span>
                    </div>
                  </div>
                </div>

                {/* Total Summary Box */}
                <div className="text-right">
                  <p className="text-sm text-default-500 mb-1">{t('reports.supportByOrg.period')}</p>
                  <p className="text-xl font-bold text-default-900">
                    {formatDateRange()}
                  </p>
                  <p className="text-sm text-default-500 mt-1">{reportData.summary.tickets_submitted} {t('reports.supportByOrg.totalTicketsSubmitted')}</p>
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
                  {t('reports.supportByOrg.filterCriteria')}
                </p>
                <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filters.organization_id && (
                      <div>
                        <span className="text-xs text-default-500">{t('reports.supportByOrg.organization')}:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {getOrganizationLabel(String(filters.organization_id))}
                        </span>
                      </div>
                    )}
                    {filters.date_from && (
                      <div>
                        <span className="text-xs text-default-500">{t('reports.supportByOrg.from')}:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {new Date(filters.date_from).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {filters.date_to && (
                      <div>
                        <span className="text-xs text-default-500">{t('reports.supportByOrg.to')}:</span>
                        <span className="text-sm font-medium text-default-800 ml-2">
                          {new Date(filters.date_to).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* No Organization Selected */}
            {!reportData ? (
              <div className="text-center py-12 text-default-500 border border-default-200 rounded-lg">
                {t('reports.supportByOrg.selectOrgPrompt')}
              </div>
            ) : (
              <div className="border border-default-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    {/* TICKETS SUMMARY SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.supportByOrg.ticketsSummary')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.totalSubmitted')}:</span> {reportData.summary.tickets_submitted}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.resolutionRate')}:</span> {reportData.performance.resolution_rate}%
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Tickets Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.count')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.count')}</th>
                    </tr>

                    {/* Tickets Data */}
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.supportByOrg.ticketsSubmitted')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{reportData.summary.tickets_submitted}</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.supportByOrg.ticketsOpen')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-yellow-600">{reportData.summary.tickets_open}</td>
                    </tr>
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.supportByOrg.ticketsClosed')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-green-600">{reportData.summary.tickets_closed}</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.supportByOrg.ticketsPending')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-orange-600">{reportData.summary.tickets_pending}</td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* COMMENTS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.supportByOrg.comments')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.total')}:</span> {reportData.summary.total_comments}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.fromContacts')}:</span> {reportData.summary.comments_from_contacts}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.fromStaff')}:</span> {reportData.summary.comments_from_staff}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* MESSAGES & CONVERSATIONS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-primary">{t('reports.supportByOrg.messagesConversations')}</span>
                          <div className="flex gap-6 text-sm">
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.totalMessages')}:</span> {reportData.summary.total_messages}
                            </span>
                            <span className="text-primary">
                              <span className="font-medium">{t('reports.supportByOrg.totalConversations')}:</span> {reportData.summary.total_conversations}
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
                        <span className="font-semibold text-primary">{t('reports.supportByOrg.performanceMetrics')}</span>
                      </td>
                    </tr>

                    {/* Performance Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.value')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.metric')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.value')}</th>
                    </tr>

                    {/* Performance Data */}
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.supportByOrg.avgResponseTime')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{formatHours(reportData.performance.avg_response_time_hours)}</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.supportByOrg.avgResolutionTime')}</td>
                      <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{formatHours(reportData.performance.avg_resolution_time_hours)}</td>
                    </tr>
                    <tr className="border-t border-default-100 hover:bg-default-50/50">
                      <td className="px-6 py-2 text-sm text-default-700">{t('reports.supportByOrg.resolutionRate')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-green-600">{reportData.performance.resolution_rate}%</td>
                      <td className="px-4 py-2 text-sm text-default-700">{t('reports.supportByOrg.satisfactionScore')}</td>
                      <td className="px-4 py-2 text-sm text-center font-semibold text-amber-600">
                        {reportData.performance.satisfaction_score > 0 ? `${reportData.performance.satisfaction_score}/5` : 'N/A'}
                      </td>
                    </tr>

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* TICKETS BY STATUS SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.supportByOrg.ticketsByStatus')}</span>
                      </td>
                    </tr>

                    {/* Status Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.status')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.count')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2" colSpan={2}>{t('reports.supportByOrg.percentage')}</th>
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
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.supportByOrg.noDataAvailable')}</td>
                      </tr>
                    )}

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* TICKETS BY PRIORITY SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.supportByOrg.ticketsByPriority')}</span>
                      </td>
                    </tr>

                    {/* Priority Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.priority')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.count')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2" colSpan={2}>{t('reports.supportByOrg.percentage')}</th>
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
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.supportByOrg.noDataAvailable')}</td>
                      </tr>
                    )}

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* TICKETS BY CATEGORY SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.supportByOrg.ticketsByCategory')}</span>
                      </td>
                    </tr>

                    {/* Category Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.category')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.count')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2" colSpan={2}>{t('reports.supportByOrg.percentage')}</th>
                    </tr>

                    {/* Category Data */}
                    {reportData.charts.tickets_by_category.length > 0 ? (
                      reportData.charts.tickets_by_category.map((item, index) => {
                        const total = reportData.charts.tickets_by_category.reduce((acc, i) => acc + i.count, 0);
                        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={index} className="border-t border-default-100 hover:bg-default-50/50">
                            <td className="px-6 py-2 text-sm text-default-700">{item.category}</td>
                            <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{item.count}</td>
                            <td className="px-4 py-2 text-sm text-default-700 text-center" colSpan={2}>{percentage}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-default-100">
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.supportByOrg.noDataAvailable')}</td>
                      </tr>
                    )}

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* TICKETS BY CONTACT SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.supportByOrg.ticketsByContact')}</span>
                      </td>
                    </tr>

                    {/* Contact Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.contact')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.email')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.ticketsCount')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.percentage')}</th>
                    </tr>

                    {/* Contact Data */}
                    {reportData.charts.tickets_by_contact.length > 0 ? (
                      reportData.charts.tickets_by_contact.map((item, index) => {
                        const total = reportData.charts.tickets_by_contact.reduce((acc, i) => acc + i.count, 0);
                        const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                        return (
                          <tr key={index} className="border-t border-default-100 hover:bg-default-50/50">
                            <td className="px-6 py-2 text-sm text-default-700">{item.contact}</td>
                            <td className="px-4 py-2 text-sm text-default-600">{item.email}</td>
                            <td className="px-4 py-2 text-sm text-default-900 text-center font-semibold">{item.count}</td>
                            <td className="px-4 py-2 text-sm text-default-700 text-center">{percentage}%</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-t border-default-100">
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.supportByOrg.noDataAvailable')}</td>
                      </tr>
                    )}

                    {/* Separator */}
                    <tr><td colSpan={4} className="h-0 border-t-2 border-default-300"></td></tr>

                    {/* RECENT ACTIVITY SECTION */}
                    <tr className="bg-primary/10">
                      <td colSpan={4} className="px-4 py-3">
                        <span className="font-semibold text-primary">{t('reports.supportByOrg.recentActivity')}</span>
                      </td>
                    </tr>

                    {/* Activity Header */}
                    <tr className="bg-default-50 border-t border-default-100">
                      <th className="text-left text-xs font-medium text-default-600 px-6 py-2">{t('reports.supportByOrg.dateTime')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.type')}</th>
                      <th className="text-left text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.description')}</th>
                      <th className="text-center text-xs font-medium text-default-600 px-4 py-2">{t('reports.supportByOrg.reference')}</th>
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
                        <td colSpan={4} className="px-6 py-3 text-sm text-default-500 text-center">{t('reports.supportByOrg.noRecentActivity')}</td>
                      </tr>
                    )}

                    {/* GRAND TOTAL ROW */}
                    <tr className="bg-default-200 border-t-2 border-default-400">
                      <td colSpan={4} className="px-4 py-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-default-800">{t('reports.supportByOrg.summaryTotals')}</span>
                          <div className="flex gap-8">
                            <span className="font-bold text-default-800">
                              {t('reports.supportByOrg.ticketsCount')}: {reportData.summary.tickets_submitted}
                            </span>
                            <span className="font-bold text-default-800">
                              {t('reports.supportByOrg.open')}: {reportData.summary.tickets_open}
                            </span>
                            <span className="font-bold text-default-800">
                              {t('reports.supportByOrg.closed')}: {reportData.summary.tickets_closed}
                            </span>
                            <span className="font-bold text-default-800">
                              {t('reports.supportByOrg.resolution')}: {reportData.performance.resolution_rate}%
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
              {t('reports.supportByOrg.pageOf')}
            </div>

            {/* Footer Info */}
            <div className="flex justify-between items-center w-full">
              <span className="text-xs text-default-500">
                {t('reports.supportByOrg.generated')}: {generatedAt}
              </span>
              <span className="text-xs text-default-500">
                {t('reports.supportByOrg.systemFooter')}
              </span>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
