import { Link, router } from "@inertiajs/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  List,
  Calendar,
  Lock,
  RefreshCw,
  Check,
  X,
  Pencil,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Eye,
  User,
  Clock,
  MapPin,
  Package,
  Trash2,
  DollarSign,
  Paperclip,
  Plus
} from "lucide-react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Badge } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import ComboboxComponent, { SelectOption } from "@/components/Combobox";
import Drawer from "@/components/Drawer";
import clsx from "clsx";

type AssetOption = {
  id: number;
  name: string;
  serial_number: string | null;
};

type StaffOption = {
  id: number;
  name: string;
};

type WorkOrderRecord = {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  due_date_raw: string | null;
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
  staff: {
    id: number;
    name: string;
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
  attachments: {
    id: number;
    file: string;
    file_name: string;
  }[];
  expenses_total: number | string;
  expenses_count: number;
  expenses: {
    id: number;
    description: string;
    amount: string;
    created_user: {
      id: number;
      name: string;
    } | null;
    updated_user: {
      id: number;
      name: string;
    } | null;
    created_at: string | null;
    updated_at: string | null;
  }[];
  created_at: string | null;
  updated_at: string | null;
};

type WorkOrderPaginator = {
  data: WorkOrderRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type WorkOrderFilters = {
  search?: string | null;
  status?: string | null;
  priority?: string | null;
  asset_id?: string | null;
  staff_id?: string | null;
  sort_by?: string | null;
  sort_direction?: "asc" | "desc" | null;
};

type WorkOrderPageProps = {
  workOrders: WorkOrderPaginator;
  assets: AssetOption[];
  staff: StaffOption[];
  filters: WorkOrderFilters;
  selectedId?: number | null;
};

const STATUS_LOOKUP: Record<number, { label: string; variant: "warning" | "info" | "primary" | "success" | "danger"; icon: typeof Lock }> = {
  0: { label: "Pending", variant: "warning", icon: Lock },
  1: { label: "Approved", variant: "info", icon: Check },
  2: { label: "In Progress", variant: "primary", icon: RefreshCw },
  3: { label: "Completed", variant: "success", icon: Check },
  4: { label: "Rejected", variant: "danger", icon: X }
};

const PRIORITY_LOOKUP: Record<number, { label: string; variant: "default" | "warning" | "danger" }> = {
  0: { label: "Low", variant: "default" },
  1: { label: "Medium", variant: "warning" },
  2: { label: "High", variant: "danger" }
};

const STATUS_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  0: { bg: "bg-warning/10", border: "border-warning", text: "text-warning" },
  1: { bg: "bg-info/10", border: "border-info", text: "text-info" },
  2: { bg: "bg-primary/10", border: "border-primary", text: "text-primary" },
  3: { bg: "bg-success/10", border: "border-success", text: "text-success" },
  4: { bg: "bg-danger/10", border: "border-danger", text: "text-danger" }
};

// Calendar event color map
const STATUS_CALENDAR_COLORS: Record<number, string> = {
  0: "#f59e0b", // warning - amber
  1: "#06b6d4", // info - cyan
  2: "#600433", // primary
  3: "#22c55e", // success - green
  4: "#ef4444"  // danger - red
};

type ViewMode = "list" | "calendar";
type TabFilter = "todo" | "done";

// Date formatting helper
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    if (dateString.includes(" ") && dateString.includes(":")) {
      options.hour = 'numeric';
      options.minute = '2-digit';
      options.hour12 = true;
    }
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch {
    return dateString;
  }
};

const formatDateShort = (dateString: string | null): string => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return dateString;
  }
};

export default function Index({ workOrders, assets, staff, filters, selectedId }: WorkOrderPageProps) {
  const safeWorkOrders: WorkOrderPaginator = {
    data: workOrders?.data ?? [],
    current_page: workOrders?.current_page ?? 1,
    per_page: workOrders?.per_page ?? 10,
    total: workOrders?.total ?? 0,
    last_page: workOrders?.last_page ?? 1,
    from: workOrders?.from ?? 0,
    to: workOrders?.to ?? 0
  };

  const safeFilters: WorkOrderFilters = {
    search: filters?.search ?? "",
    status: filters?.status ?? "",
    priority: filters?.priority ?? "",
    asset_id: filters?.asset_id ?? "",
    staff_id: filters?.staff_id ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tabFilter, setTabFilter] = useState<TabFilter>("todo");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderRecord | null>(null);
  
  // Search state
  const [searchInput, setSearchInput] = useState(safeFilters.search ?? "");
  const isUserTypingRef = useRef(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingWorkOrder, setDeletingWorkOrder] = useState<WorkOrderRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Status changing state
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    workOrderId: number;
    currentStatus: number;
    newStatus: number;
  } | null>(null);
  
  // Expense drawer state
  const [isExpenseDrawerOpen, setIsExpenseDrawerOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<{
    id: number;
    description: string;
    amount: string;
  } | null>(null);
  const [expenseFormData, setExpenseFormData] = useState({ description: "", amount: "" });
  const [isExpenseSubmitting, setIsExpenseSubmitting] = useState(false);
  
  // Delete expense dialog state
  const [isDeleteExpenseDialogOpen, setIsDeleteExpenseDialogOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<WorkOrderRecord['expenses'][0] | null>(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);
  
  // Calendar options state
  const [showBusinessHours, setShowBusinessHours] = useState(false);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  
  const selectedWorkOrderRef = useRef<HTMLDivElement | null>(null);

  const filteredWorkOrders = useMemo(() => {
    let filtered = safeWorkOrders.data;
    if (tabFilter === "todo") {
      filtered = filtered.filter((wo) => wo.status !== 3);
    } else if (tabFilter === "done") {
      filtered = filtered.filter((wo) => wo.status === 3);
    }
    return filtered;
  }, [safeWorkOrders.data, tabFilter]);

  // Calendar events
  const calendarEvents = useMemo(() => {
    return filteredWorkOrders
      .filter((wo): wo is typeof wo & { due_date_raw: string } => !!wo.due_date_raw)
      .map(wo => ({
        id: String(wo.id),
        title: wo.title,
        start: wo.due_date_raw,
        backgroundColor: STATUS_CALENDAR_COLORS[wo.status] ?? STATUS_CALENDAR_COLORS[0],
        borderColor: STATUS_CALENDAR_COLORS[wo.status] ?? STATUS_CALENDAR_COLORS[0],
        extendedProps: { workOrder: wo }
      }));
  }, [filteredWorkOrders]);

  // Select work order by ID if provided
  useEffect(() => {
    if (selectedId) {
      const workOrder = safeWorkOrders.data.find((wo) => wo.id === selectedId);
      if (workOrder) {
        setSelectedWorkOrder(workOrder);
        setViewMode("list");
        if (workOrder.status === 3) {
          setTabFilter("done");
        } else {
          setTabFilter("todo");
        }
      }
    }
  }, [selectedId, safeWorkOrders.data]);

  // Auto-select first work order
  useEffect(() => {
    if (!selectedWorkOrder && !selectedId && filteredWorkOrders.length > 0) {
      setSelectedWorkOrder(filteredWorkOrders[0]);
    }
  }, [filteredWorkOrders, selectedWorkOrder, selectedId]);

  // Update selected work order when data changes
  useEffect(() => {
    if (selectedWorkOrder) {
      const updatedWorkOrder = safeWorkOrders.data.find(
        (wo) => wo.id === selectedWorkOrder.id
      );
      if (updatedWorkOrder) {
        setSelectedWorkOrder(updatedWorkOrder);
      }
    }
  }, [safeWorkOrders.data, selectedWorkOrder]);

  // Scroll to selected work order
  useEffect(() => {
    if (selectedWorkOrder && selectedWorkOrderRef.current && viewMode === "list") {
      setTimeout(() => {
        selectedWorkOrderRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [selectedWorkOrder, viewMode]);

  // Search debounce
  useEffect(() => {
    if (!isUserTypingRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      isUserTypingRef.current = false;
      if (searchInput !== (safeFilters.search ?? "")) {
        submitQuery({ search: searchInput, page: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, safeFilters.search]);

  // Sync search input with filters
  useEffect(() => {
    if (!isUserTypingRef.current && searchInput !== (safeFilters.search ?? "")) {
      setSearchInput(safeFilters.search ?? "");
    }
  }, [safeFilters.search, searchInput]);

  // Filter options
  const statusFilterOptions = useMemo<SelectOption[]>(() => [
    { label: "Pending", value: "0" },
    { label: "Approved", value: "1" },
    { label: "In Progress", value: "2" },
    { label: "Completed", value: "3" },
    { label: "Rejected", value: "4" }
  ], []);

  const priorityFilterOptions = useMemo<SelectOption[]>(() => [
    { label: "Low", value: "0" },
    { label: "Medium", value: "1" },
    { label: "High", value: "2" }
  ], []);

  const assetFilterOptions = useMemo<SelectOption[]>(() => 
    assets.map((asset) => ({
      label: asset.serial_number ? `${asset.name} (${asset.serial_number})` : asset.name,
      value: String(asset.id)
    })),
    [assets]
  );

  const staffFilterOptions = useMemo<SelectOption[]>(() => 
    staff.map((s) => ({
      label: s.name,
      value: String(s.id)
    })),
    [staff]
  );

  const submitQuery = useCallback(
    (partial: Partial<{
      search: string;
      status: string;
      priority: string;
      asset_id: string;
      staff_id: string;
      page: number;
      perPage: number;
      sort_by: string | null;
      sort_direction: "asc" | "desc" | null;
    }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        status: partial.status ?? safeFilters.status ?? "",
        priority: partial.priority ?? safeFilters.priority ?? "",
        asset_id: partial.asset_id ?? safeFilters.asset_id ?? "",
        staff_id: partial.staff_id ?? safeFilters.staff_id ?? "",
        page: partial.page ?? safeWorkOrders.current_page,
        perPage: partial.perPage ?? safeWorkOrders.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged =
        query.search !== (safeFilters.search ?? "") ||
        query.status !== (safeFilters.status ?? "") ||
        query.priority !== (safeFilters.priority ?? "") ||
        query.asset_id !== (safeFilters.asset_id ?? "") ||
        query.staff_id !== (safeFilters.staff_id ?? "") ||
        query.page !== safeWorkOrders.current_page ||
        query.perPage !== safeWorkOrders.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if (["search", "status", "priority", "asset_id", "staff_id"].includes(key) && value === "") {
            return false;
          }
          if (key === "page" && value === 1) return false;
          if (key === "perPage" && value === 10) return false;
          return true;
        })
      );

      router.get("/work-orders", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeWorkOrders.current_page, safeWorkOrders.per_page, safeFilters]
  );

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((workOrder: WorkOrderRecord) => {
    setDeletingWorkOrder(workOrder);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setDeletingWorkOrder(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingWorkOrder) return;

    router.delete(`/work-orders/${deletingWorkOrder.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
        if (selectedWorkOrder?.id === deletingWorkOrder.id) {
          setSelectedWorkOrder(null);
        }
      }
    });
  }, [deletingWorkOrder, handleCloseDeleteDialog, selectedWorkOrder]);

  // Status change confirmation handlers
  const handleStatusChangeClick = useCallback((workOrderId: number, newStatus: number) => {
    // If clicking the current status, no need to show confirmation
    if (selectedWorkOrder?.id === workOrderId && selectedWorkOrder.status === newStatus) {
      return;
    }
    const currentStatus = selectedWorkOrder?.id === workOrderId 
      ? selectedWorkOrder.status 
      : safeWorkOrders.data.find(wo => wo.id === workOrderId)?.status ?? 0;
    setPendingStatusChange({ workOrderId, currentStatus, newStatus });
    setIsStatusChangeDialogOpen(true);
  }, [selectedWorkOrder, safeWorkOrders.data]);

  const handleCloseStatusChangeDialog = useCallback(() => {
    setIsStatusChangeDialogOpen(false);
    setPendingStatusChange(null);
  }, []);

  // Status change handler (actual change after confirmation)
  const handleStatusChange = useCallback(() => {
    if (!pendingStatusChange) return;

    const { workOrderId, newStatus } = pendingStatusChange;
    setIsStatusChanging(true);
    
    router.post(
      "/work-orders/bulk-status-change",
      { ids: [workOrderId], status: newStatus },
      {
        preserveScroll: true,
        onSuccess: () => {
          // Update the selected work order state only after API succeeds
          if (selectedWorkOrder?.id === workOrderId) {
            setSelectedWorkOrder({
              ...selectedWorkOrder,
              status: newStatus
            });
          }
          // Reload to get fresh data
          router.reload({ only: ['workOrders'] });
        },
        onFinish: () => {
          setIsStatusChanging(false);
          handleCloseStatusChangeDialog();
        }
      }
    );
  }, [pendingStatusChange, selectedWorkOrder, handleCloseStatusChangeDialog]);

  // Expense handlers
  const handleOpenExpenseDrawer = useCallback((expense?: WorkOrderRecord['expenses'][0]) => {
    if (expense) {
      setEditingExpense({
        id: expense.id,
        description: expense.description,
        amount: expense.amount
      });
      setExpenseFormData({
        description: expense.description,
        amount: expense.amount
      });
    } else {
      setEditingExpense(null);
      setExpenseFormData({ description: "", amount: "" });
    }
    setIsExpenseDrawerOpen(true);
  }, []);

  const handleCloseExpenseDrawer = useCallback(() => {
    setIsExpenseDrawerOpen(false);
    setTimeout(() => {
      setEditingExpense(null);
      setExpenseFormData({ description: "", amount: "" });
    }, 300);
  }, []);

  const handleSaveExpense = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkOrder) return;
    if (!expenseFormData.description.trim() || !expenseFormData.amount.trim()) return;

    const url = editingExpense
      ? `/work-orders/${selectedWorkOrder.id}/expenses/${editingExpense.id}`
      : `/work-orders/${selectedWorkOrder.id}/expenses`;

    const method = editingExpense ? "put" : "post";

    router[method](url, {
      description: expenseFormData.description,
      amount: parseFloat(expenseFormData.amount)
    }, {
      preserveScroll: true,
      onStart: () => setIsExpenseSubmitting(true),
      onSuccess: () => {
        router.reload({ only: ['workOrders'] });
        handleCloseExpenseDrawer();
      },
      onFinish: () => setIsExpenseSubmitting(false)
    });
  }, [selectedWorkOrder, expenseFormData, editingExpense, handleCloseExpenseDrawer]);

  // Delete expense handlers
  const handleOpenDeleteExpenseDialog = useCallback((expense: WorkOrderRecord['expenses'][0]) => {
    setDeletingExpense(expense);
    setIsDeleteExpenseDialogOpen(true);
  }, []);

  const handleCloseDeleteExpenseDialog = useCallback(() => {
    setIsDeleteExpenseDialogOpen(false);
    setDeletingExpense(null);
  }, []);

  const handleConfirmDeleteExpense = useCallback(() => {
    if (!selectedWorkOrder || !deletingExpense) return;

    router.delete(`/work-orders/${selectedWorkOrder.id}/expenses/${deletingExpense.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeletingExpense(true),
      onSuccess: () => {
        router.reload({ only: ['workOrders'] });
        handleCloseDeleteExpenseDialog();
      },
      onFinish: () => setIsDeletingExpense(false)
    });
  }, [selectedWorkOrder, deletingExpense, handleCloseDeleteExpenseDialog]);

  // Calendar event click handler
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCalendarEventClick = useCallback((info: any) => {
    const workOrder = info.event.extendedProps?.workOrder as WorkOrderRecord | undefined;
    if (workOrder) {
      setSelectedWorkOrder(workOrder);
      setViewMode("list");
    }
  }, []);

  // Calendar event drop handler (drag and drop)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCalendarEventDrop = useCallback((info: any) => {
    const workOrderId = parseInt(info.event.id as string, 10);
    const newDate = info.event.startStr as string;

    const getCsrfToken = (): string => {
      const name = "XSRF-TOKEN";
      const cookies = document.cookie.split(";");
      for (const cookie of cookies) {
        const [key, value] = cookie.trim().split("=");
        if (key === name) {
          return decodeURIComponent(value);
        }
      }
      return "";
    };

    fetch(`/work-orders/${workOrderId}/update-due-date`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "X-XSRF-TOKEN": getCsrfToken()
      },
      credentials: "same-origin",
      body: JSON.stringify({ due_date: newDate })
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to update due date");
        return response.json();
      })
      .then(() => {
        router.reload();
      })
      .catch(() => {
        router.reload();
      });
  }, []);

  // Get filter value helper
  const getFilterValue = (options: SelectOption[], value: string | null | undefined): SelectOption | null => {
    if (!value) return null;
    return options.find(opt => opt.value === value) ?? null;
  };

  return (
    <AppLayout>
      <PageMeta title="Work Orders" />
      <main>
        <PageBreadcrumb title="Work Orders" subtitle="Maintenance" />
        
        <div className="card min-h-[calc(100vh-220px)]">
          {/* Header */}
          <div className="border-b border-default-200 p-4">
            <div className="flex flex-col gap-4">
              {/* Title and View Toggle */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <h2 className="text-lg md:text-xl font-bold text-default-800">Work Orders</h2>
                  <div className="flex items-center gap-1 p-1 bg-default-100 rounded">
                    <button
                      onClick={() => setViewMode("list")}
                      className={clsx(
                        "btn btn-sm btn-icon",
                        viewMode === "list" ? "bg-card shadow-sm text-primary" : "bg-transparent text-default-600 hover:text-default-800"
                      )}
                    >
                      <List className="size-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("calendar")}
                      className={clsx(
                        "btn btn-sm btn-icon",
                        viewMode === "calendar" ? "bg-card shadow-sm text-primary" : "bg-transparent text-default-600 hover:text-default-800"
                      )}
                    >
                      <Calendar className="size-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-48 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-default-400" />
                  <input
                    type="search"
                    placeholder="Search work orders..."
                    value={searchInput}
                    onChange={(e) => {
                      isUserTypingRef.current = true;
                      setSearchInput(e.target.value);
                    }}
                    className="form-input pl-9 w-full"
                  />
                </div>

                {/* Status Filter */}
                <div className="w-36">
                  <ComboboxComponent
                    options={statusFilterOptions}
                    value={getFilterValue(statusFilterOptions, safeFilters.status)}
                    onChange={(val) => submitQuery({ status: val ? String((val as SelectOption).value) : "", page: 1 })}
                    placeholder="Status"
                    isClearable
                    disabled={isLoading}
                  />
                </div>

                {/* Priority Filter */}
                <div className="w-36">
                  <ComboboxComponent
                    options={priorityFilterOptions}
                    value={getFilterValue(priorityFilterOptions, safeFilters.priority)}
                    onChange={(val) => submitQuery({ priority: val ? String((val as SelectOption).value) : "", page: 1 })}
                    placeholder="Priority"
                    isClearable
                    disabled={isLoading}
                  />
                </div>

                {/* Asset Filter */}
                <div className="w-44">
                  <ComboboxComponent
                    options={assetFilterOptions}
                    value={getFilterValue(assetFilterOptions, safeFilters.asset_id)}
                    onChange={(val) => submitQuery({ asset_id: val ? String((val as SelectOption).value) : "", page: 1 })}
                    placeholder="Asset"
                    isClearable
                    disabled={isLoading}
                  />
                </div>

                {/* Staff Filter */}
                <div className="w-40">
                  <ComboboxComponent
                    options={staffFilterOptions}
                    value={getFilterValue(staffFilterOptions, safeFilters.staff_id)}
                    onChange={(val) => submitQuery({ staff_id: val ? String((val as SelectOption).value) : "", page: 1 })}
                    placeholder="Assigned To"
                    isClearable
                    disabled={isLoading}
                  />
                </div>

                {/* Create Button */}
                <div className="ml-auto">
                  <Link href="/work-orders/create">
                    <button className="btn bg-primary text-white btn-sm">
                      <Plus className="size-4" />
                      New Work Order
                    </button>
                  </Link>
                </div>
              </div>

              {/* Tabs */}
              {viewMode === "list" && (
                <div className="flex items-center gap-1 border-b border-default-200 -mx-4 px-4 -mb-4 mt-2">
                  <button
                    onClick={() => setTabFilter("todo")}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium -mb-px transition-colors",
                      tabFilter === "todo"
                        ? "text-primary border-b-2 border-primary"
                        : "text-default-500 hover:text-default-700"
                    )}
                  >
                    <List className="size-4" />
                    To Do
                  </button>
                  <button
                    onClick={() => setTabFilter("done")}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium -mb-px transition-colors",
                      tabFilter === "done"
                        ? "text-primary border-b-2 border-primary"
                        : "text-default-500 hover:text-default-700"
                    )}
                  >
                    <Check className="size-4" />
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left Panel - List/Calendar */}
            <div
              className={clsx(
                "bg-default-50 overflow-y-auto",
                viewMode === "list" 
                  ? "w-full lg:w-2/5 lg:border-r border-default-200 min-h-72 lg:min-h-0 max-h-96 lg:max-h-none" 
                  : "w-full"
              )}
            >
              {viewMode === "list" ? (
                <div className="divide-y divide-default-200">
                  {filteredWorkOrders.map((workOrder) => {
                    const status = STATUS_LOOKUP[workOrder.status] ?? STATUS_LOOKUP[0];
                    const priority = PRIORITY_LOOKUP[workOrder.priority] ?? PRIORITY_LOOKUP[0];
                    const isSelected = selectedWorkOrder?.id === workOrder.id;

                    return (
                      <div
                        key={workOrder.id}
                        ref={isSelected ? selectedWorkOrderRef : null}
                        onClick={() => setSelectedWorkOrder(workOrder)}
                        className={clsx(
                          "p-4 cursor-pointer transition-colors",
                          isSelected ? "bg-default-100 border-l-3 border-l-primary" : "bg-card hover:bg-default-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-sm text-default-800 truncate">
                            {workOrder.title}
                          </h4>
                          <Badge variant={priority.variant}>{priority.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {workOrder.attachments_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-default-500">
                              <Paperclip className="size-3" />
                              {workOrder.attachments_count}
                            </span>
                          )}
                        </div>
                        {workOrder.asset && (
                          <p className="text-xs text-default-600 mb-1">
                            {workOrder.asset.name}
                            {workOrder.asset.location && ` • ${workOrder.asset.location.name}`}
                          </p>
                        )}
                        {workOrder.staff && (
                          <p className="text-xs text-default-600 mb-1">
                            Assigned to: {workOrder.staff.name}
                          </p>
                        )}
                        {workOrder.due_date && (
                          <p className="text-xs text-default-600">
                            Due: {formatDateShort(workOrder.due_date)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {filteredWorkOrders.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-default-500">No work orders found</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid lg:grid-cols-4 gap-5 p-4">
                  {/* Calendar - 3 columns */}
                  <div className="lg:col-span-3">
                    <div className="card">
                      <div className="card-body">
                        <div id="calendar">
                          <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={calendarEvents}
                            eventClick={handleCalendarEventClick}
                            eventDrop={handleCalendarEventDrop}
                            editable={true}
                            droppable={true}
                            headerToolbar={{
                              left: 'prev,next today',
                              center: 'title',
                              right: 'dayGridMonth,dayGridWeek'
                            }}
                            height="auto"
                            dayMaxEvents={3}
                            eventDisplay="block"
                            businessHours={showBusinessHours ? {
                              daysOfWeek: [1, 2, 3, 4, 5],
                              startTime: '08:00',
                              endTime: '18:00',
                            } : false}
                            weekNumbers={showWeekNumbers}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar - 1 column */}
                  <div className="col-span-1">
                    <div className="card">
                      <div className="card-body">
                        <h6 className="mb-4 text-base font-semibold text-default-800">Work Orders by Status</h6>
                        <div id="external-events" className="flex flex-col gap-3">
                          <p className="text-default-400 text-sm">Click on a work order to view details</p>

                          {/* Pending Work Orders */}
                          {filteredWorkOrders.filter(wo => wo.status === 0).slice(0, 3).map((wo) => (
                            <div 
                              key={wo.id}
                              onClick={() => {
                                setSelectedWorkOrder(wo);
                                setViewMode("list");
                              }}
                              className="fc-event text-warning cursor-pointer py-2 px-4 rounded-sm flex items-center font-medium bg-warning/10 hover:bg-warning/25 hover:py-3 transition-all duration-200"
                            >
                              <i className="iconify tabler--circle-filled me-2 text-warning"></i>
                              <span className="truncate">{wo.title}</span>
                            </div>
                          ))}

                          {/* Approved Work Orders */}
                          {filteredWorkOrders.filter(wo => wo.status === 1).slice(0, 3).map((wo) => (
                            <div 
                              key={wo.id}
                              onClick={() => {
                                setSelectedWorkOrder(wo);
                                setViewMode("list");
                              }}
                              className="fc-event text-info cursor-pointer py-2 px-4 rounded-sm flex items-center font-medium bg-info/10 hover:bg-info/25 hover:py-3 transition-all duration-200"
                            >
                              <i className="iconify tabler--circle-filled me-2 text-info"></i>
                              <span className="truncate">{wo.title}</span>
                            </div>
                          ))}

                          {/* In Progress Work Orders */}
                          {filteredWorkOrders.filter(wo => wo.status === 2).slice(0, 3).map((wo) => (
                            <div 
                              key={wo.id}
                              onClick={() => {
                                setSelectedWorkOrder(wo);
                                setViewMode("list");
                              }}
                              className="fc-event text-primary cursor-pointer py-2 px-4 rounded-sm flex items-center font-medium bg-primary/10 hover:bg-primary/25 hover:py-3 transition-all duration-200"
                            >
                              <i className="iconify tabler--circle-filled me-2 text-primary"></i>
                              <span className="truncate">{wo.title}</span>
                            </div>
                          ))}

                          {/* Completed Work Orders */}
                          {filteredWorkOrders.filter(wo => wo.status === 3).slice(0, 3).map((wo) => (
                            <div 
                              key={wo.id}
                              onClick={() => {
                                setSelectedWorkOrder(wo);
                                setViewMode("list");
                              }}
                              className="fc-event text-success cursor-pointer py-2 px-4 rounded-sm flex items-center font-medium bg-success/10 hover:bg-success/25 hover:py-3 transition-all duration-200"
                            >
                              <i className="iconify tabler--circle-filled me-2 text-success"></i>
                              <span className="truncate">{wo.title}</span>
                            </div>
                          ))}

                          {/* Rejected Work Orders */}
                          {filteredWorkOrders.filter(wo => wo.status === 4).slice(0, 2).map((wo) => (
                            <div 
                              key={wo.id}
                              onClick={() => {
                                setSelectedWorkOrder(wo);
                                setViewMode("list");
                              }}
                              className="fc-event text-danger cursor-pointer py-2 px-4 rounded-sm flex items-center font-medium bg-danger/10 hover:bg-danger/25 hover:py-3 transition-all duration-200"
                            >
                              <i className="iconify tabler--circle-filled me-2 text-danger"></i>
                              <span className="truncate">{wo.title}</span>
                            </div>
                          ))}

                          {filteredWorkOrders.length === 0 && (
                            <p className="text-default-500 text-sm">No work orders found</p>
                          )}

                          <div className="border-t border-default-200 pt-3 mt-2 space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="form-checkbox"
                                checked={showBusinessHours}
                                onChange={(e) => setShowBusinessHours(e.target.checked)}
                              />
                              <span className="text-sm text-default-700">Business Hours & Week</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="form-checkbox"
                                checked={showWeekNumbers}
                                onChange={(e) => setShowWeekNumbers(e.target.checked)}
                              />
                              <span className="text-sm text-default-700">Week Number</span>
                            </label>
                          </div>

                          {/* Status Legend */}
                          <div className="border-t border-default-200 pt-3 mt-2">
                            <h6 className="text-sm font-medium text-default-700 mb-2">Legend</h6>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-warning"></span>
                                <span className="text-default-600">Pending</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-info"></span>
                                <span className="text-default-600">Approved</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-primary"></span>
                                <span className="text-default-600">In Progress</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-success"></span>
                                <span className="text-default-600">Completed</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="size-3 rounded-full bg-danger"></span>
                                <span className="text-default-600">Rejected</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Detail View */}
            {viewMode === "list" && selectedWorkOrder && (
              <div className="flex-1 bg-card overflow-y-auto p-4 md:p-6 min-h-72 lg:min-h-0">
                {/* Detail Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-2 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-default-800 truncate">
                      {selectedWorkOrder.title}
                    </h3>
                    <button
                      onClick={() => router.reload()}
                      className="btn btn-sm btn-icon bg-transparent text-default-500 hover:bg-default-100 shrink-0"
                    >
                      <RefreshCw className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/work-orders/${selectedWorkOrder.id}/edit`}>
                      <button className="btn btn-sm btn-outline-dashed border-primary text-primary hover:bg-primary/10">
                        <Pencil className="size-4" />
                        Edit
                      </button>
                    </Link>
                    <button
                      onClick={() => handleOpenDeleteDialog(selectedWorkOrder)}
                      className="btn btn-sm btn-outline-dashed border-danger text-danger hover:bg-danger/10"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Status Buttons */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-default-800 mb-3">Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3].map((statusValue) => {
                      const status = STATUS_LOOKUP[statusValue];
                      const isActive = selectedWorkOrder.status === statusValue;
                      const StatusIcon = status.icon;
                      
                      const validTransitions: Record<number, number[]> = {
                        0: [1, 4],
                        1: [2, 4],
                        2: [3, 4],
                        3: [4],
                        4: [1],
                      };
                      
                      const currentStatus = selectedWorkOrder.status;
                      const isValidTransition = 
                        statusValue === currentStatus ||
                        (validTransitions[currentStatus]?.includes(statusValue) ?? false);
                      
                      const isDisabled = isStatusChanging || !isValidTransition;

                      return (
                        <button
                          key={statusValue}
                          onClick={() => handleStatusChangeClick(selectedWorkOrder.id, statusValue)}
                          disabled={isDisabled}
                          className={clsx(
                            "flex flex-col items-center gap-1 px-3 md:px-4 py-3 md:py-4 rounded border transition-all min-w-20",
                            isActive
                              ? `${STATUS_COLORS[statusValue].bg} ${STATUS_COLORS[statusValue].border} ${STATUS_COLORS[statusValue].text}`
                              : "bg-card border-default-200 text-default-600 hover:bg-default-50",
                            isDisabled && !isActive && "opacity-50 cursor-not-allowed"
                          )}
                          title={
                            isDisabled && !isActive
                              ? `Cannot change to ${status.label}`
                              : undefined
                          }
                        >
                          <StatusIcon className="size-4" />
                          <span className="text-xs font-medium">{status.label}</span>
                        </button>
                      );
                    })}
                    {/* Rejected Button */}
                    {(() => {
                      const rejectedStatus = STATUS_LOOKUP[4];
                      const isRejected = selectedWorkOrder.status === 4;
                      const RejectedIcon = rejectedStatus.icon;
                      const canReject = selectedWorkOrder.status !== 4;
                      
                      return (
                        <button
                          onClick={() => handleStatusChangeClick(selectedWorkOrder.id, 4)}
                          disabled={isStatusChanging || !canReject}
                          className={clsx(
                            "flex flex-col items-center gap-1 px-3 md:px-4 py-3 md:py-4 rounded border transition-all min-w-20",
                            isRejected
                              ? `${STATUS_COLORS[4].bg} ${STATUS_COLORS[4].border} ${STATUS_COLORS[4].text}`
                              : "bg-card border-default-200 text-default-600 hover:bg-default-50",
                            !canReject && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <RejectedIcon className="size-4" />
                          <span className="text-xs font-medium">{rejectedStatus.label}</span>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-default-600 mb-1">Due Date</p>
                    <p className="font-medium text-default-800">{formatDate(selectedWorkOrder.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-default-600 mb-1">Priority</p>
                    <Badge variant={PRIORITY_LOOKUP[selectedWorkOrder.priority]?.variant ?? "default"}>
                      {PRIORITY_LOOKUP[selectedWorkOrder.priority]?.label ?? "Low"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-default-600 mb-1">Work Order ID</p>
                    <p className="font-medium text-default-800">#{selectedWorkOrder.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-default-600 mb-1">Status</p>
                    <Badge variant={STATUS_LOOKUP[selectedWorkOrder.status]?.variant ?? "warning"}>
                      {STATUS_LOOKUP[selectedWorkOrder.status]?.label ?? "Pending"}
                    </Badge>
                  </div>
                </div>

                {/* Assigned To */}
                {selectedWorkOrder.staff && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2 text-default-600">
                      <User className="size-4" />
                      <span className="text-xs font-medium">Assigned To</span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <div className="size-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                        {selectedWorkOrder.staff.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-default-800">{selectedWorkOrder.staff.name}</span>
                    </div>
                  </div>
                )}

                <hr className="border-default-200 mb-6" />

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-default-800 mb-2">Description</h4>
                  <p className="text-sm text-default-700 whitespace-pre-wrap">
                    {selectedWorkOrder.description || "No description provided."}
                  </p>
                </div>

                {/* Asset Info */}
                {selectedWorkOrder.asset && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-default-800 mb-3">Asset</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 text-default-600">
                          <Package className="size-4" />
                          <span className="text-xs font-medium">Asset Name</span>
                        </div>
                        <p className="text-sm pl-6">{selectedWorkOrder.asset.name}</p>
                      </div>
                      {selectedWorkOrder.asset.serial_number && (
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-default-600">
                            <FileText className="size-4" />
                            <span className="text-xs font-medium">Serial Number</span>
                          </div>
                          <p className="text-sm pl-6">{selectedWorkOrder.asset.serial_number}</p>
                        </div>
                      )}
                      {selectedWorkOrder.asset.location && (
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-default-600">
                            <MapPin className="size-4" />
                            <span className="text-xs font-medium">Location</span>
                          </div>
                          <p className="text-sm pl-6">{selectedWorkOrder.asset.location.name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedWorkOrder.attachments && selectedWorkOrder.attachments.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-default-800 mb-3 flex items-center gap-2">
                      <FileText className="size-4" />
                      Attachments ({selectedWorkOrder.attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedWorkOrder.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-3 border border-default-200 rounded-md hover:bg-default-50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="size-4 text-default-500 shrink-0" />
                            <span className="text-sm truncate">{attachment.file_name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => window.open(attachment.file, "_blank")}
                              className="btn btn-sm btn-icon bg-transparent text-default-500 hover:bg-default-100"
                            >
                              <Eye className="size-4" />
                            </button>
                            <button
                              onClick={() => {
                                const link = document.createElement("a");
                                link.href = attachment.file;
                                link.download = attachment.file_name;
                                link.click();
                              }}
                              className="btn btn-sm btn-icon bg-transparent text-default-500 hover:bg-default-100"
                            >
                              <Download className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expenses */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-default-800 flex items-center gap-2">
                      <DollarSign className="size-4" />
                      Expenses ({selectedWorkOrder.expenses_count || 0})
                    </h4>
                    <button
                      onClick={() => handleOpenExpenseDrawer()}
                      className="btn btn-sm btn-outline-dashed border-primary text-primary hover:bg-primary/10"
                    >
                      <Plus className="size-4" />
                      Add
                    </button>
                  </div>
                  {(selectedWorkOrder.expenses || []).length > 0 ? (
                    <div className="space-y-2">
                      {(selectedWorkOrder.expenses || []).map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-3 border border-default-200 rounded-md hover:bg-default-50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-default-800">{expense.description}</p>
                            <p className="text-xs text-default-600">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(parseFloat(expense.amount))}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleOpenExpenseDrawer(expense)}
                              className="btn btn-sm btn-icon bg-transparent text-default-500 hover:bg-default-100"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteExpenseDialog(expense)}
                              className="btn btn-sm btn-icon bg-transparent text-danger hover:bg-danger/10"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-default-50 rounded-md mt-2">
                        <span className="text-sm font-medium text-default-800">Total Expenses:</span>
                        <span className="text-sm font-bold text-default-800">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(
                            typeof selectedWorkOrder.expenses_total === "string"
                              ? parseFloat(selectedWorkOrder.expenses_total)
                              : (selectedWorkOrder.expenses_total || 0)
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-default-50 rounded-md">
                      <p className="text-sm text-default-600">No expenses recorded yet</p>
                    </div>
                  )}
                </div>

                <hr className="border-default-200 mb-6" />

                {/* Activity */}
                <div>
                  <h4 className="text-sm font-semibold text-default-800 mb-3">Activity</h4>
                  <div className="space-y-4">
                    {/* Created By */}
                    {selectedWorkOrder.created_user && (
                      <div>
                        <div className="flex items-center gap-2 mb-1 text-default-600">
                          <Clock className="size-4" />
                          <span className="text-xs font-medium">Created By</span>
                        </div>
                        <div className="pl-6">
                          <p className="text-sm text-default-800">{selectedWorkOrder.created_user.name}</p>
                          {selectedWorkOrder.created_at && (
                            <p className="text-xs text-default-600">{formatDate(selectedWorkOrder.created_at)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approved By */}
                    {selectedWorkOrder.approved_user && selectedWorkOrder.status === 1 && (
                      <>
                        <hr className="border-default-200" />
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-default-600">
                            <Check className="size-4" />
                            <span className="text-xs font-medium">Approved By</span>
                          </div>
                          <div className="pl-6">
                            <p className="text-sm text-default-800">{selectedWorkOrder.approved_user.name}</p>
                            {selectedWorkOrder.approved_at && (
                              <p className="text-xs text-default-600">{formatDate(selectedWorkOrder.approved_at)}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Rejected By */}
                    {selectedWorkOrder.rejected_user && selectedWorkOrder.status === 4 && (
                      <>
                        <hr className="border-default-200" />
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-default-600">
                            <X className="size-4" />
                            <span className="text-xs font-medium">Rejected By</span>
                          </div>
                          <div className="pl-6">
                            <p className="text-sm text-default-800">{selectedWorkOrder.rejected_user.name}</p>
                            {selectedWorkOrder.rejected_at && (
                              <p className="text-xs text-default-600">{formatDate(selectedWorkOrder.rejected_at)}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Completed By */}
                    {selectedWorkOrder.completed_user && selectedWorkOrder.status === 3 && (
                      <>
                        <hr className="border-default-200" />
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-default-600">
                            <Check className="size-4" />
                            <span className="text-xs font-medium">Completed By</span>
                          </div>
                          <div className="pl-6">
                            <p className="text-sm text-default-800">{selectedWorkOrder.completed_user.name}</p>
                            {selectedWorkOrder.completed_at && (
                              <p className="text-xs text-default-600">{formatDate(selectedWorkOrder.completed_at)}</p>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Last Updated */}
                    {selectedWorkOrder.updated_at && (
                      <>
                        <hr className="border-default-200" />
                        <div>
                          <div className="flex items-center gap-2 mb-1 text-default-600">
                            <Clock className="size-4" />
                            <span className="text-xs font-medium">Last Updated</span>
                          </div>
                          <p className="text-sm text-default-600 pl-6">
                            {formatDate(selectedWorkOrder.updated_at)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {viewMode === "list" && !selectedWorkOrder && (
              <div className="flex-1 bg-card flex items-center justify-center min-h-48">
                <p className="text-default-500">Select a work order to view details</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {viewMode === "list" && safeWorkOrders.total > 0 && (
            <div className="p-4 border-t border-default-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-default-600">
                Showing {safeWorkOrders.from} to {safeWorkOrders.to} of {safeWorkOrders.total} results
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => submitQuery({ page: safeWorkOrders.current_page - 1 })}
                  disabled={safeWorkOrders.current_page <= 1 || isLoading}
                  className="btn btn-sm bg-transparent border border-default-300 text-default-700 hover:bg-default-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </button>
                <span className="text-sm text-default-600 px-2">
                  Page {safeWorkOrders.current_page} of {safeWorkOrders.last_page}
                </span>
                <button
                  onClick={() => submitQuery({ page: safeWorkOrders.current_page + 1 })}
                  disabled={safeWorkOrders.current_page >= safeWorkOrders.last_page || isLoading}
                  className="btn btn-sm bg-transparent border border-default-300 text-default-700 hover:bg-default-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Work Order Dialog */}
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog();
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        description={`Are you sure you want to delete the work order "${deletingWorkOrder?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />

      {/* Expense Drawer */}
      <Drawer
        isOpen={isExpenseDrawerOpen}
        onClose={handleCloseExpenseDrawer}
        title={editingExpense ? "Edit Expense" : "Add Expense"}
        size="md"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseExpenseDrawer}
              disabled={isExpenseSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="expense-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={
                isExpenseSubmitting ||
                !expenseFormData.description.trim() ||
                !expenseFormData.amount.trim() ||
                isNaN(parseFloat(expenseFormData.amount)) ||
                parseFloat(expenseFormData.amount) <= 0
              }
            >
              {isExpenseSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingExpense ? "Update" : "Add"
              )}
            </button>
          </>
        }
      >
        <form id="expense-form" onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Description <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="description"
              placeholder="Enter expense description"
              value={expenseFormData.description}
              onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
              disabled={isExpenseSubmitting}
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Amount <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-default-400" />
              <input
                type="number"
                name="amount"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={expenseFormData.amount}
                onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                disabled={isExpenseSubmitting}
                className="form-input w-full pl-9"
              />
            </div>
          </div>
        </form>
      </Drawer>

      {/* Delete Expense Dialog */}
      <ConfirmDialog
        open={isDeleteExpenseDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteExpenseDialog();
        }}
        onConfirm={handleConfirmDeleteExpense}
        title="Confirm Delete Expense"
        description={`Are you sure you want to delete the expense "${deletingExpense?.description}" (${
          deletingExpense
            ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
                parseFloat(deletingExpense.amount || "0")
              )
            : "$0.00"
        })? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeletingExpense}
        size="lg"
      />

      {/* Status Change Confirmation Dialog */}
      <ConfirmDialog
        open={isStatusChangeDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseStatusChangeDialog();
        }}
        onConfirm={handleStatusChange}
        title="Confirm Status Change"
        description={
          pendingStatusChange
            ? `Are you sure you want to change the status from "${STATUS_LOOKUP[pendingStatusChange.currentStatus]?.label ?? "Unknown"}" to "${STATUS_LOOKUP[pendingStatusChange.newStatus]?.label ?? "Unknown"}"?`
            : "Are you sure you want to change the status?"
        }
        confirmText="Change Status"
        cancelText="Cancel"
        confirmVariant="primary"
        isLoading={isStatusChanging}
        size="lg"
      />
    </AppLayout>
  );
}
