import { Link, router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableBulkAction, type DataTableFilter, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Download, Upload, FileSpreadsheet, ChevronDown, CircleCheck, AlertTriangle, UserX, Clock, Ticket } from "lucide-react";
import PageHeader from "@/components/Pageheader";
import Breadcrumb from "@/components/BreadCrumb";

type Priority = {
  id: number;
  name: string;
};

type Status = {
  id: number;
  name: string;
};

type Type = {
  id: number;
  name: string;
};

type Category = {
  id: number;
  name: string;
};

type Department = {
  id: number;
  name: string;
};

type TicketRecord = {
  id: number;
  uid: string;
  subject: string;
  contact: string | null;
  priority: string | null;
  category: string | null;
  sub_category: string | null;
  rating: number;
  status: string | null;
  due: string | null;
  assigned_to: string | null;
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
  priority_id?: string | null;
  status_id?: string | null;
  type_id?: string | null;
  category_id?: string | null;
  department_id?: string | null;
  type?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type TicketPageProps = {
  title: string;
  tickets: TicketPaginator;
  priorities: Priority[];
  types: Type[];
  categories: Category[];
  departments: Department[];
  statuses: Status[];
  filters: TicketFilters;
};

export default function Index({ 
  title,
  tickets, 
  priorities, 
  types, 
  categories, 
  departments, 
  statuses, 
  filters 
}: TicketPageProps) {
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
    priority_id: filters?.priority_id ?? "",
    status_id: filters?.status_id ?? "",
    type_id: filters?.type_id ?? "",
    category_id: filters?.category_id ?? "",
    department_id: filters?.department_id ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<TicketRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Derive active quick filter from actual filter values
  const activeQuickFilter = useMemo(() => {
    // Check if type filter is set
    if (filters?.type === 'open') {
      return 'open';
    }
    if (filters?.type === 'high_priority') {
      return 'highPriority';
    }
    if (filters?.type === 'un_assigned') {
      return 'unassigned';
    }
    if (filters?.type === 'new') {
      return 'recent';
    }
    return null;
  }, [filters?.type]);

  // Compute quick filter counts
  const quickFilterCounts = useMemo(() => {
    return {
      open: safeTickets.data.filter(t => t.status?.toLowerCase().includes('open')).length,
      highPriority: safeTickets.data.filter(t => t.priority?.toLowerCase().includes('high')).length,
      unassigned: safeTickets.data.filter(t => !t.assigned_to).length,
      recent: safeTickets.data.filter(t => {
        const createdDate = new Date(t.created_at);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return createdDate >= today;
      }).length,
    };
  }, [safeTickets.data]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((ticket: TicketRecord) => {
    setDeletingTicket(ticket);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingTicket(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingTicket) return;

    router.delete(`/tickets/${deletingTicket.uid}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingTicket, handleCloseDeleteDialog]);

  // Bulk delete handlers
  const handleOpenBulkDeleteDialog = useCallback((ids: number[]) => {
    setBulkDeleteIds(ids);
    setIsBulkDeleteDialogOpen(true);
  }, []);

  const handleCloseBulkDeleteDialog = useCallback(() => {
    setIsBulkDeleteDialogOpen(false);
    setTimeout(() => {
      setBulkDeleteIds([]);
    }, 300);
  }, []);

  const handleConfirmBulkDelete = useCallback(() => {
    if (bulkDeleteIds.length === 0) return;

    router.post('/tickets/bulk-delete', {
      ids: bulkDeleteIds
    }, {
      preserveScroll: true,
      onStart: () => setIsBulkDeleting(true),
      onFinish: () => {
        setIsBulkDeleting(false);
        handleCloseBulkDeleteDialog();
      }
    });
  }, [bulkDeleteIds, handleCloseBulkDeleteDialog]);

  // Helper functions for badge colors
  const getPriorityVariant = (priority: string | null): 'danger' | 'warning' | 'info' | 'success' | 'default' => {
    if (!priority) return 'default';
    const p = priority.toLowerCase();
    if (p.includes('critical') || p.includes('urgent')) return 'danger';
    if (p.includes('high')) return 'warning';
    if (p.includes('medium')) return 'info';
    if (p.includes('low')) return 'success';
    return 'default';
  };

  const getStatusVariant = (status: string | null): 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'default' => {
    if (!status) return 'default';
    const s = status.toLowerCase();
    if (s.includes('closed') || s.includes('resolved')) return 'success';
    if (s.includes('open') || s.includes('new')) return 'info';
    if (s.includes('pending')) return 'warning';
    if (s.includes('progress')) return 'primary';
    return 'default';
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export handler
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    
    if (safeFilters.search) params.append('search', safeFilters.search);
    if (safeFilters.priority_id) params.append('priority_id', safeFilters.priority_id);
    if (safeFilters.status_id) params.append('status_id', safeFilters.status_id);
    if (safeFilters.type_id) params.append('type_id', safeFilters.type_id);
    if (safeFilters.category_id) params.append('category_id', safeFilters.category_id);
    if (safeFilters.department_id) params.append('department_id', safeFilters.department_id);

    window.location.href = `/tickets/export?${params.toString()}`;
  }, [safeFilters]);

  // Import handler
  const handleImportClick = useCallback(() => {
    router.visit('/tickets/import');
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ 
      search: string; 
      priority_id: string; 
      status_id: string; 
      type_id: string; 
      category_id: string; 
      department_id: string; 
      page: number; 
      perPage: number; 
      sort_by: string | null; 
      sort_direction: 'asc' | 'desc' | null 
    }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        priority_id: partial.priority_id ?? safeFilters.priority_id ?? "",
        status_id: partial.status_id ?? safeFilters.status_id ?? "",
        type_id: partial.type_id ?? safeFilters.type_id ?? "",
        category_id: partial.category_id ?? safeFilters.category_id ?? "",
        department_id: partial.department_id ?? safeFilters.department_id ?? "",
        page: partial.page ?? safeTickets.current_page,
        perPage: partial.perPage ?? safeTickets.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.priority_id !== (safeFilters.priority_id ?? "") ||
        query.status_id !== (safeFilters.status_id ?? "") ||
        query.type_id !== (safeFilters.type_id ?? "") ||
        query.category_id !== (safeFilters.category_id ?? "") ||
        query.department_id !== (safeFilters.department_id ?? "") ||
        query.page !== safeTickets.current_page ||
        query.perPage !== safeTickets.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if ((key === "search" || key === "priority_id" || key === "status_id" || key === "type_id" || key === "category_id" || key === "department_id") && value === "") {
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

      router.get("/tickets", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeTickets.current_page, safeTickets.per_page, safeFilters.search, safeFilters.priority_id, safeFilters.status_id, safeFilters.type_id, safeFilters.category_id, safeFilters.department_id, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<TicketRecord, unknown>[]>(
    () => [
      {
        accessorKey: "uid",
        header: "ID",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-default-600">#{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ getValue, row }) => (
          <div className="flex flex-col gap-1 min-w-[250px]">
            <Link href={`/tickets/${row.original.uid}`}>
              <span className="font-medium text-default-800 hover:text-primary hover:underline line-clamp-1">
                {getValue<string>()}
              </span>
            </Link>
            {row.original.rating > 0 && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`size-3 ${i < row.original.rating ? 'text-warning fill-warning' : 'text-default-300'}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            )}
          </div>
        ),
        enableSorting: true
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ getValue }) => {
          const contact = getValue<string | null>();
          return contact ? (
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs uppercase shrink-0">
                {contact.charAt(0)}
              </div>
              <span className="text-sm text-default-700 truncate">{contact}</span>
            </div>
          ) : (
            <span className="text-sm text-default-400 italic">-</span>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <div className="min-w-[120px]">
            {row.original.category ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-default-700">{row.original.category}</span>
                {row.original.sub_category && (
                  <span className="text-xs text-default-500">{row.original.sub_category}</span>
                )}
              </div>
            ) : (
              <span className="text-sm text-default-400">-</span>
            )}
          </div>
        ),
        enableSorting: false
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ getValue }) => {
          const priority = getValue<string | null>();
          return priority ? (
            <Badge variant={getPriorityVariant(priority)}>
              {priority}
            </Badge>
          ) : (
            <Badge variant="default">None</Badge>
          );
        },
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
        enableSorting: true
      },
      {
        accessorKey: "assigned_to",
        header: "Assigned To",
        cell: ({ getValue }) => {
          const assignedTo = getValue<string | null>();
          return assignedTo ? (
            <div className="flex items-center gap-2 min-w-[140px]">
              <div className="size-7 rounded-full bg-success/10 flex items-center justify-center text-success font-medium text-xs uppercase shrink-0">
                {assignedTo.charAt(0)}
              </div>
              <span className="text-sm text-default-700 truncate">{assignedTo}</span>
            </div>
          ) : (
            <span className="text-sm text-default-400">-</span>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "updated_at",
        header: "Updated",
        cell: ({ getValue }) => (
          <span className="text-sm text-default-600 whitespace-nowrap">
            {formatDate(getValue<string>())}
          </span>
        ),
        enableSorting: true
      }
    ],
    [getPriorityVariant, getStatusVariant]
  );

  const tableFilters = useMemo<DataTableFilter[]>(
    () => [
      {
        id: "priority_id",
        label: "Priority",
        placeholder: "All priorities",
        options: (priorities ?? []).map(p => ({
          label: p.name,
          value: String(p.id)
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
      },
      {
        id: "type_id",
        label: "Type",
        placeholder: "All types",
        options: (types ?? []).map(t => ({
          label: t.name,
          value: String(t.id)
        }))
      },
      {
        id: "category_id",
        label: "Category",
        placeholder: "All categories",
        options: (categories ?? []).map(c => ({
          label: c.name,
          value: String(c.id)
        }))
      },
      {
        id: "department_id",
        label: "Department",
        placeholder: "All departments",
        options: (departments ?? []).map(d => ({
          label: d.name,
          value: String(d.id)
        }))
      }
    ],
    [priorities, statuses, types, categories, departments]
  );

  const rowActions = useMemo<DataTableRowAction<TicketRecord>[]>(
    () => [
      {
        label: "View",
        value: "view",
        href: (ticket) => `/tickets/${ticket.uid}`
      },
      {
        label: "Edit",
        value: "edit",
        href: (ticket) => `/tickets/${ticket.uid}/edit`
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (ticket) => {
          handleOpenDeleteDialog(ticket);
        }
      }
    ],
    [handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<TicketRecord>[]>(
    () => [
      {
        label: "Delete selection",
        value: "delete",
        onSelect: async (selectedRows) => {
          const ids = selectedRows.map(row => row.id);
          handleOpenBulkDeleteDialog(ids);
        }
      }
    ],
    [handleOpenBulkDeleteDialog]
  );

  return (
    <AppLayout>
      <PageMeta title={title} />
      <main>
        <Breadcrumb 
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tickets', href: '/tickets' },
          ]}
          className="mb-4"
        />
        <PageHeader title={title} count={safeTickets.total} icon={Ticket} subtitle="Manage and track support tickets efficiently" />
        <div className="space-y-6">
          {/* Quick Filter Badges */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                router.get('/tickets', { type: 'open', page: 1 }, {
                  preserveScroll: true,
                  preserveState: true,
                  onStart: () => setIsLoading(true),
                  onFinish: () => setIsLoading(false)
                });
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeQuickFilter === 'open'
                  ? 'bg-info text-white shadow-md'
                  : 'bg-default-100 text-default-700 hover:bg-default-200'
              }`}
            >
              <CircleCheck className="size-4" />
              Open
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                activeQuickFilter === 'open' ? 'bg-white/20' : 'bg-default-200'
              }`}>
                {quickFilterCounts.open}
              </span>
            </button>

            <button
              onClick={() => {
                router.get('/tickets', { type: 'high_priority', page: 1 }, {
                  preserveScroll: true,
                  preserveState: true,
                  onStart: () => setIsLoading(true),
                  onFinish: () => setIsLoading(false)
                });
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeQuickFilter === 'highPriority'
                  ? 'bg-warning text-white shadow-md'
                  : 'bg-default-100 text-default-700 hover:bg-default-200'
              }`}
            >
              <AlertTriangle className="size-4" />
              High Priority
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                activeQuickFilter === 'highPriority' ? 'bg-white/20' : 'bg-default-200'
              }`}>
                {quickFilterCounts.highPriority}
              </span>
            </button>

            <button
              onClick={() => {
                router.get('/tickets', { type: 'un_assigned', page: 1 }, {
                  preserveScroll: true,
                  preserveState: true,
                  onStart: () => setIsLoading(true),
                  onFinish: () => setIsLoading(false)
                });
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeQuickFilter === 'unassigned'
                  ? 'bg-danger text-white shadow-md'
                  : 'bg-default-100 text-default-700 hover:bg-default-200'
              }`}
            >
              <UserX className="size-4" />
              Unassigned
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                activeQuickFilter === 'unassigned' ? 'bg-white/20' : 'bg-default-200'
              }`}>
                {quickFilterCounts.unassigned}
              </span>
            </button>

            <button
              onClick={() => {
                router.get('/tickets', { type: 'new', page: 1 }, {
                  preserveScroll: true,
                  preserveState: true,
                  onStart: () => setIsLoading(true),
                  onFinish: () => setIsLoading(false)
                });
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeQuickFilter === 'recent'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-default-100 text-default-700 hover:bg-default-200'
              }`}
            >
              <Clock className="size-4" />
              Recent
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                activeQuickFilter === 'recent' ? 'bg-white/20' : 'bg-default-200'
              }`}>
                {quickFilterCounts.recent}
              </span>
            </button>

            {activeQuickFilter && (
              <button
                onClick={() => {
                  router.get('/tickets', {}, {
                    preserveScroll: true,
                    preserveState: true,
                    onStart: () => setIsLoading(true),
                    onFinish: () => setIsLoading(false)
                  });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-default-100 text-default-600 hover:bg-default-200 transition-all"
              >
                Clear Filter
              </button>
            )}
          </div>

          <DataTable<TicketRecord>
            data={safeTickets.data}
            columns={columns}
            pagination={{
              page: safeTickets.current_page,
              perPage: safeTickets.per_page,
              total: safeTickets.total
            }}
            searchValue={safeFilters.search ?? ""}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            searchPlaceholder="Search by ticket ID, subject, or requester..."
            filters={tableFilters}
            filterValues={{
              priority_id: safeFilters.priority_id ?? "",
              status_id: safeFilters.status_id ?? "",
              type_id: safeFilters.type_id ?? "",
              category_id: safeFilters.category_id ?? "",
              department_id: safeFilters.department_id ?? ""
            }}
            onFilterChange={(filterId, value) => {
              if (filterId === "priority_id") {
                submitQuery({ priority_id: value, page: 1 });
              } else if (filterId === "status_id") {
                submitQuery({ status_id: value, page: 1 });
              } else if (filterId === "type_id") {
                submitQuery({ type_id: value, page: 1 });
              } else if (filterId === "category_id") {
                submitQuery({ category_id: value, page: 1 });
              } else if (filterId === "department_id") {
                submitQuery({ department_id: value, page: 1 });
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
              <div className="flex gap-2">
                <Menu as="div" className="relative inline-flex">
                  <MenuButton
                    className="btn btn-sm bg-transparent btn-outline-dashed border-primary text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isBusy}
                  >
                    <FileSpreadsheet className="size-4" />
                    Import/Export
                    <ChevronDown className="size-4" />
                  </MenuButton>
                  <MenuItems
                    anchor="bottom end"
                    className="w-48 origin-top-right rounded border border-default-200 bg-card shadow-lg p-1 [--anchor-gap:4px] z-50 focus:outline-none"
                  >
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-default-500 rounded cursor-pointer ${
                            focus ? 'bg-default-150' : ''
                          }`}
                          onClick={handleExport}
                        >
                          <Download className="size-4" />
                          Export to CSV
                        </button>
                      )}
                    </MenuItem>
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          className={`w-full text-left flex items-center gap-2 py-1.5 px-3 text-sm font-medium text-default-500 rounded cursor-pointer ${
                            focus ? 'bg-default-150' : ''
                          }`}
                          onClick={handleImportClick}
                        >
                          <Upload className="size-4" />
                          Import from CSV
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
                <Link href="/tickets/create">
                  <button
                    disabled={isBusy}
                    className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
                  >
                    Create Ticket
                  </button>
                </Link>
              </div>
            )}
            rowActions={rowActions}
            isLoading={isLoading}
            getRowId={(row) => String(row.id)}
          />
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDeleteDialog();
          }
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the ticket "${deletingTicket?.subject}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        open={isBulkDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseBulkDeleteDialog();
          }
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Confirm Bulk Delete"
        description={`Are you sure you want to delete ${bulkDeleteIds.length} ticket(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}
