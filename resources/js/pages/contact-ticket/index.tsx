import { Link, router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableRowAction } from "@/components/DataTable";
import PublicLayout from "@/layouts/public-layout";
import PageMeta from "@/components/PageMeta";
import { Plus, RefreshCw } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { regions } from "@/routes";

type Status = {
  id: number;
  name: string;
};

type Region = {
  id: number;
  name: string;
};

type TicketRecord = {
  id: number;
  uid: string;
  subject: string;
  region: string | null;
  priority: string | null;
  status: string | null;
  status_slug: string | null;
  assigned_to: string | null;
  assigned_to_photo: string | null;
  created_at: string;
  updated_at: string;
};

type TicketPaginator = {
  data: TicketRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type TicketFilters = {
  search?: string | null;
  status_id?: string | null;
  region_id?: string | null;
  type?: string | null;
};

type PageProps = {
  title: string;
  tickets: TicketPaginator;
  statuses: Status[];
  regions: Region[];
  filters: TicketFilters;
  footer?: any;
};

export default function ContactTicketIndex({
  title,
  tickets,
  statuses,
  regions,
  filters,
  footer,
}: PageProps) {
  const safeTickets: TicketPaginator = {
    data: tickets?.data ?? [],
    current_page: tickets?.current_page ?? 1,
    per_page: tickets?.per_page ?? 10,
    total: tickets?.total ?? 0,
    last_page: tickets?.last_page ?? 1,
    from: tickets?.from ?? 0,
    to: tickets?.to ?? 0,
  };

  const safeFilters: TicketFilters = {
    search: filters?.search ?? "",
    status_id: filters?.status_id ?? "",
    region_id: filters?.region_id ?? "",
    type: filters?.type ?? "open",
  };

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>(
    filters?.type === 'closed' ? 'closed' : 'open'
  );

  // Helper for status badge colors
  const getStatusVariant = (status: string | null): 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'default' => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s.includes('closed') || s.includes('resolved')) return 'success';
    if (s.includes('open') || s.includes('new') || s.includes('active')) return 'info';
    if (s.includes('pending')) return 'warning';
    if (s.includes('progress')) return 'primary';
    return 'default';
  };

  const handleTabChange = useCallback((tab: 'open' | 'closed') => {
    setActiveTab(tab);
    router.get('/contact/tickets', { type: tab, page: 1 }, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, []);

  const handleRefresh = useCallback(() => {
    router.reload({
      onStart: () => setIsLoading(true),
      onFinish: () => setIsLoading(false),
    });
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ 
      search: string; 
      status_id: string; 
      region_id: string; 
      page: number; 
      perPage: number; 
    }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        status_id: partial.status_id ?? safeFilters.status_id ?? "",
        region_id: partial.region_id ?? safeFilters.region_id ?? "",
        type: activeTab,
        page: partial.page ?? safeTickets.current_page,
        limit: partial.perPage ?? safeTickets.per_page,
      };

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if ((key === "search" || key === "status_id" || key === "region_id") && value === "") {
            return false;
          }
          if (key === "page" && value === 1) {
            return false;
          }
          if (key === "limit" && value === 10) {
            return false;
          }
          return true;
        })
      );

      router.get("/contact/tickets", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeTickets.current_page, safeTickets.per_page, safeFilters.search, safeFilters.status_id, safeFilters.region_id, activeTab]
  );

  const columns = useMemo<ColumnDef<TicketRecord, unknown>[]>(
    () => [
      {
        accessorKey: "uid",
        header: "Ticket ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-default-600">#{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ getValue, row }) => (
          <div className="min-w-[200px]">
            <Link href={`/contact/tickets/${row.original.uid}`}>
              <span className="font-medium text-default-800 hover:text-primary hover:underline line-clamp-1">
                {getValue<string>()}
              </span>
            </Link>
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ getValue }) => {
          const region = getValue<string | null>();
          return region ? (
            <span className="text-sm text-default-700">{region}</span>
          ) : (
            <span className="text-sm text-default-400 italic">-</span>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "assigned_to",
        header: "Staff Member",
        cell: ({ getValue, row }) => {
          const assignedTo = getValue<string | null>();
          const photo = row.original.assigned_to_photo;
          return assignedTo && assignedTo !== 'Unassigned' ? (
            <div className="flex items-center gap-2 min-w-[120px]">
              {photo ? (
                <img src={photo} alt={assignedTo} className="size-7 rounded-full object-cover shrink-0" />
              ) : (
                <div className="size-7 rounded-full bg-success/10 flex items-center justify-center text-success font-medium text-xs uppercase shrink-0">
                  {assignedTo.charAt(0)}
                </div>
              )}
              <span className="text-sm text-default-700 truncate">{assignedTo}</span>
            </div>
          ) : (
            <span className="text-sm text-default-400">Unassigned</span>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "updated_at",
        header: "Last Activity",
        cell: ({ getValue }) => (
          <span className="text-sm text-default-600 whitespace-nowrap">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string | null>();
          return status ? (
            <Badge variant={getStatusVariant(status)}>
              {status}
            </Badge>
          ) : (
            <Badge variant="default">Unknown</Badge>
          );
        },
        enableSorting: false
      }
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<TicketRecord>[]>(
    () => [
      {
        label: "View",
        value: "view",
        href: (ticket) => `/contact/tickets/${ticket.uid}`
      }
    ],
    []
  );

  return (
    <>
      <PageMeta title={title} />
      
      <PublicLayout currentPage="/contact/tickets" footer={footer} showToast>

        {/* Page Content */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <div className="mb-3">
                <Breadcrumb
                    items={[
                    { label: 'Tickets', href: '/contact/tickets' },
                    { label: 'My Tickets', href: '/contact/tickets' },
                    ]}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-default-900">MY TICKETS</h1>
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-default-200 mb-6">
              <nav className="flex gap-6" aria-label="Ticket status tabs">
                <button
                  onClick={() => handleTabChange('open')}
                  className={`py-3 px-1 relative font-medium text-sm transition-colors ${
                    activeTab === 'open'
                      ? 'text-primary border-b-2 border-primary -mb-px'
                      : 'text-default-500 hover:text-default-700'
                  }`}
                >
                  OPENED TICKETS
                  {activeTab === 'open' && safeFilters.type === 'open' && safeTickets.total > 0 && !isLoading && (
                    <span className="ml-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                      {safeTickets.total}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('closed')}
                  className={`py-3 px-1 relative font-medium text-sm transition-colors ${
                    activeTab === 'closed'
                      ? 'text-primary border-b-2 border-primary -mb-px'
                      : 'text-default-500 hover:text-default-700'
                  }`}
                >
                  CLOSED TICKETS
                  {activeTab === 'closed' && safeFilters.type === 'closed' && safeTickets.total > 0 && !isLoading && (
                    <span className="ml-2 bg-success text-white text-xs px-2 py-0.5 rounded-full">
                      {safeTickets.total}
                    </span>
                  )}
                </button>
              </nav>
            </div>

            {/* DataTable */}
            <DataTable<TicketRecord>
              data={safeTickets.data}
              columns={columns}
              pagination={{
                page: safeTickets.current_page,
                perPage: safeTickets.per_page,
                total: safeTickets.total
              }}
              searchValue={safeFilters.search ?? ""}
              onSearchChange={(search) => {
                // Only submit if search value actually changed
                if (search === (safeFilters.search ?? "")) return;
                submitQuery({ search, page: 1 });
              }}
              searchPlaceholder="Search by ticket ID, subject..."
              filters={[
                {
                  id: "region_id",
                  label: "Region",
                  placeholder: "All regions",
                  options: (regions ?? []).map(d => ({
                    label: d.name,
                    value: String(d.id)
                  }))
                },
                {
                  id: "status_id",
                  label: "Status",
                  placeholder: "All statuses",
                  options: (statuses ?? []).map(s => ({
                    label: s.name,
                    value: String(s.id)
                  }))
                }
              ]}
              filterValues={{
                region_id: safeFilters.region_id ?? "",
                status_id: safeFilters.status_id ?? ""
              }}
              onFilterChange={(filterId, value) => {
                // Only submit if value actually changed
                if (filterId === "region_id") {
                  if (value === (safeFilters.region_id ?? "")) return;
                  submitQuery({ region_id: value, page: 1 });
                } else if (filterId === "status_id") {
                  if (value === (safeFilters.status_id ?? "")) return;
                  submitQuery({ status_id: value, page: 1 });
                }
              }}
              onPageChange={(page) => submitQuery({ page })}
              onPerPageChange={(perPage) => submitQuery({ perPage, page: 1 })}
              renderCreate={({ isBusy }) => (
                <Link href="/contact/tickets/create">
                  <button
                    disabled={isBusy}
                    className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
                  >
                    <Plus className="size-4" />
                    Create New Ticket
                  </button>
                </Link>
              )}
              rowActions={rowActions}
              isLoading={isLoading}
              getRowId={(row) => String(row.id)}
              emptyState={{
                title: "No tickets found",
                description: activeTab === 'open' 
                  ? "You don't have any open tickets. Create one to get started!"
                  : "You don't have any closed tickets yet."
              }}
            />
          </div>
        </section>
      </PublicLayout>
    </>
  );
}
