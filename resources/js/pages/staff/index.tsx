import { Link, router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableBulkAction, type DataTableRowAction, type DataTableFilter } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import ComboboxComponent, { SelectOption } from "@/components/Combobox";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Download, Upload, FileSpreadsheet, ChevronDown } from "lucide-react";

type DepartmentRecord = {
  id: number;
  name: string;
};

type RoleRecord = {
  id: number;
  name: string;
};

type StaffRecord = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  department_id: number | null;
  department: DepartmentRecord | null;
  status: number;
  can_login?: number;
  user_id?: number | null;
  user?: {
    id: number;
    email: string;
    role?: {
      id: number;
      name: string;
    } | null;
  } | null;
  created_at: string | null;
  updated_at: string | null;
};

type StaffPaginator = {
  data: StaffRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type StaffFilters = {
  search?: string | null;
  status?: string | null;
  department_id?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type StaffPageProps = {
  staff: StaffPaginator;
  departments: DepartmentRecord[];
  roles: RoleRecord[];
  filters: StaffFilters;
};

const STATUS_FILTER_OPTIONS = [
  { label: "Active", value: "1" },
  { label: "Inactive", value: "0" }
];

const STATUS_LOOKUP: Record<number, { label: string; variant: "success" | "default" }> = {
  1: { label: "Active", variant: "success" },
  0: { label: "Inactive", variant: "default" }
};

export default function Index({ staff, departments, roles, filters }: StaffPageProps) {
  const safeStaff: StaffPaginator = {
    data: staff?.data ?? [],
    current_page: staff?.current_page ?? 1,
    per_page: staff?.per_page ?? 10,
    total: staff?.total ?? 0,
    last_page: staff?.last_page ?? 1,
    from: staff?.from ?? 0,
    to: staff?.to ?? 0,
  };

  const safeFilters: StaffFilters = {
    search: filters?.search ?? "",
    status: filters?.status ?? "",
    department_id: filters?.department_id ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const departmentItems = useMemo(() => 
    (departments || []).map((dept) => ({
      label: dept.name,
      value: String(dept.id)
    })),
    [departments]
  );

  const roleItems = useMemo(() => 
    (roles || []).map((role) => ({
      label: role.name,
      value: String(role.id)
    })),
    [roles]
  );

  const [isLoading, setIsLoading] = useState(false);
  
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<StaffRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    department_id: "",
    status: "1",
    can_login: false,
    login_email: "",
    password: "",
    password_confirmation: "",
    role_id: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((staffMember?: StaffRecord) => {
    setEditingStaff(staffMember ?? null);
    const hasLogin = staffMember?.can_login === 1;
    setFormData({
      name: staffMember?.name ?? "",
      email: staffMember?.email ?? "",
      phone: staffMember?.phone ?? "",
      city: staffMember?.city ?? "",
      department_id: staffMember?.department_id ? String(staffMember.department_id) : "",
      status: staffMember ? String(staffMember.status) : "1",
      can_login: hasLogin,
      login_email: staffMember?.user?.email ?? "",
      password: "",
      password_confirmation: "",
      role_id: staffMember?.user?.role?.id ? String(staffMember.user.role.id) : ""
    });
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingStaff(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        department_id: "",
        status: "1",
        can_login: false,
        login_email: "",
        password: "",
        password_confirmation: "",
        role_id: ""
      });
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingStaff 
      ? `/staffs/${editingStaff.id}` 
      : "/staffs";
    
    const method = editingStaff ? "put" : "post";

    // Prepare data for submission
    const submitData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      department_id: formData.department_id,
      status: formData.status,
      can_login: formData.can_login ? "1" : "0",
      ...(formData.can_login && {
        login_email: formData.login_email,
        role_id: formData.role_id,
        ...(formData.password && {
          password: formData.password,
          password_confirmation: formData.password_confirmation
        })
      })
    };

    router[method](url, submitData, {
      preserveScroll: true,
      onStart: () => setIsSubmitting(true),
      onSuccess: () => {
        handleCloseDrawer();
      },
      onError: (errors) => {
        setFormErrors(errors);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  }, [editingStaff, formData, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((staffMember: StaffRecord) => {
    setDeletingStaff(staffMember);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingStaff(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingStaff) return;

    router.delete(`/staffs/${deletingStaff.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingStaff, handleCloseDeleteDialog]);

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

    router.post('/staffs/bulk-delete', {
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

  // Export handler
  const handleExport = useCallback(() => {
    const params = new URLSearchParams();
    
    if (safeFilters.search) params.append('search', safeFilters.search);
    if (safeFilters.status) params.append('status', safeFilters.status);
    if (safeFilters.department_id) params.append('department_id', safeFilters.department_id);

    window.location.href = `/staffs/export?${params.toString()}`;
  }, [safeFilters]);

  // Import handler
  const handleImportClick = useCallback(() => {
    router.visit('/staffs/import');
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; status: string; department_id: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        status: partial.status ?? safeFilters.status ?? "",
        department_id: partial.department_id ?? safeFilters.department_id ?? "",
        page: partial.page ?? safeStaff.current_page,
        perPage: partial.perPage ?? safeStaff.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.status !== (safeFilters.status ?? "") ||
        query.department_id !== (safeFilters.department_id ?? "") ||
        query.page !== safeStaff.current_page ||
        query.perPage !== safeStaff.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if ((key === "search" || key === "status" || key === "department_id") && value === "") {
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

      router.get("/staffs", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeStaff.current_page, safeStaff.per_page, safeFilters.search, safeFilters.status, safeFilters.department_id, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<StaffRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue, row }) => (
          <Link 
            href={`/staffs/${row.original.id}`}
            className="font-medium text-default-800 hover:text-primary hover:underline"
          >
            {getValue<string>()}
          </Link>
        ),
        enableSorting: true
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (
          <span className="text-default-700">{getValue<string | null>() ?? "-"}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ getValue }) => (
          <span className="text-default-700">{getValue<string | null>() ?? "-"}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "city",
        header: "City",
        cell: ({ getValue }) => (
          <span className="text-default-700">{getValue<string | null>() ?? "-"}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => {
          const department = row.original.department;
          return department ? (
            <Badge variant="primary">{department.name}</Badge>
          ) : (
            <span className="text-default-500">-</span>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const statusValue = Number(getValue<number>());
          const status = STATUS_LOOKUP[statusValue] ?? STATUS_LOOKUP[0];
          return (
            <Badge variant={status.variant}>{status.label}</Badge>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: true
      }
    ],
    []
  );

  const tableFilters = useMemo<DataTableFilter[]>(
    () => [
      {
        id: "status",
        label: "Status",
        placeholder: "All statuses",
        options: STATUS_FILTER_OPTIONS
      },
      {
        id: "department_id",
        label: "Department",
        placeholder: "All departments",
        options: departmentItems
      }
    ],
    [departmentItems]
  );

  const rowActions = useMemo<DataTableRowAction<StaffRecord>[]>(
    () => [
      {
        label: "View",
        value: "view",
        onSelect: (staffMember) => {
          router.visit(`/staffs/${staffMember.id}`);
        }
      },
      {
        label: "Edit",
        value: "edit",
        onSelect: (staffMember) => {
          handleOpenDrawer(staffMember);
        }
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (staffMember) => {
          handleOpenDeleteDialog(staffMember);
        }
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog]
  );

  const bulkActions = useMemo<DataTableBulkAction<StaffRecord>[]>(
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

  // Get selected department option for the form combobox
  const selectedDepartmentOption = useMemo(() => {
    if (!formData.department_id) return null;
    const found = departmentItems.find(item => item.value === formData.department_id);
    return found ? { label: found.label, value: found.value } as SelectOption : null;
  }, [formData.department_id, departmentItems]);

  // Get selected role option for the form combobox
  const selectedRoleOption = useMemo(() => {
    if (!formData.role_id) return null;
    const found = roleItems.find(item => item.value === formData.role_id);
    return found ? { label: found.label, value: found.value } as SelectOption : null;
  }, [formData.role_id, roleItems]);

  const departmentSelectOptions: SelectOption[] = useMemo(() => 
    departmentItems.map(item => ({ label: item.label, value: item.value })),
    [departmentItems]
  );

  const roleSelectOptions: SelectOption[] = useMemo(() => 
    roleItems.map(item => ({ label: item.label, value: item.value })),
    [roleItems]
  );

  return (
    <AppLayout>
      <PageMeta title="Staff" />
      <main>
        <PageBreadcrumb title="Staff" subtitle="Asset Management" />
        <div className="space-y-6">
          <DataTable<StaffRecord>
            data={safeStaff.data}
            columns={columns}
            pagination={{
              page: safeStaff.current_page,
              perPage: safeStaff.per_page,
              total: safeStaff.total
            }}
            searchValue={safeFilters.search ?? ""}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            filters={tableFilters}
            filterValues={{
              status: safeFilters.status ?? "",
              department_id: safeFilters.department_id ?? ""
            }}
            onFilterChange={(filterId, value) => {
              if (filterId === "status") {
                submitQuery({ status: value, page: 1 });
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
                          Export to Excel
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
                          Import from Excel
                        </button>
                      )}
                    </MenuItem>
                  </MenuItems>
                </Menu>
                <button
                  onClick={() => handleOpenDrawer()}
                  disabled={isBusy}
                  className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
                >
                  Create Staff
                </button>
              </div>
            )}
            rowActions={rowActions}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingStaff ? "Edit Staff" : "Create Staff"}
        size="lg"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseDrawer}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="staff-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingStaff ? "Update" : "Create"
              )}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter staff name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.name ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.name && (
              <p className="text-danger text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.email ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.email && (
              <p className="text-danger text-sm mt-1">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Phone
            </label>
            <input
              type="text"
              name="phone"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.phone ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.phone && (
              <p className="text-danger text-sm mt-1">{formErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              City
            </label>
            <input
              type="text"
              name="city"
              placeholder="Enter city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.city ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.city && (
              <p className="text-danger text-sm mt-1">{formErrors.city}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Department
            </label>
            <ComboboxComponent
              options={departmentSelectOptions}
              value={selectedDepartmentOption}
              onChange={(newValue) => {
                const value = newValue ? String((newValue as SelectOption).value) : "";
                setFormData({ ...formData, department_id: value });
              }}
              placeholder="Select a department"
              disabled={isSubmitting}
              isClearable={true}
              inputClassName={`form-input w-full ${formErrors.department_id ? 'border-danger focus:ring-danger' : ''}`}
            />
            {formErrors.department_id && (
              <p className="text-danger text-sm mt-1">{formErrors.department_id}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Status <span className="text-danger">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              disabled={isSubmitting}
              className={`form-input w-full ${formErrors.status ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
            {formErrors.status && (
              <p className="text-danger text-sm mt-1">{formErrors.status}</p>
            )}
          </div>

          {/* Login Details Section */}
          <div className="pt-4 border-t border-default-200">
            <h4 className="font-medium text-default-900 text-sm mb-4">Login Details</h4>
            
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_login}
                  onChange={(e) => setFormData({ ...formData, can_login: e.target.checked })}
                  disabled={isSubmitting}
                  className="form-checkbox"
                />
                <span className="text-default-700 text-sm">
                  Allow this staff member to log in to the system
                </span>
              </label>
              {formErrors.can_login && (
                <p className="text-danger text-sm mt-1">{formErrors.can_login}</p>
              )}
            </div>

            {formData.can_login && (
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Login Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="login_email"
                    placeholder="Enter login email address"
                    value={formData.login_email}
                    onChange={(e) => setFormData({ ...formData, login_email: e.target.value })}
                    disabled={isSubmitting}
                    className={`form-input w-full ${formErrors.login_email ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  {formErrors.login_email && (
                    <p className="text-danger text-sm mt-1">{formErrors.login_email}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Role <span className="text-danger">*</span>
                  </label>
                  <ComboboxComponent
                    options={roleSelectOptions}
                    value={selectedRoleOption}
                    onChange={(newValue) => {
                      const value = newValue ? String((newValue as SelectOption).value) : "";
                      setFormData({ ...formData, role_id: value });
                    }}
                    placeholder="Select a role"
                    disabled={isSubmitting}
                    isClearable={true}
                    inputClassName={`form-input w-full ${formErrors.role_id ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  {formErrors.role_id && (
                    <p className="text-danger text-sm mt-1">{formErrors.role_id}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Password {(!editingStaff || !editingStaff.user_id) && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder={editingStaff && editingStaff.user_id ? "Leave blank to keep current password" : "Enter password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isSubmitting}
                    className={`form-input w-full ${formErrors.password ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  {formErrors.password && (
                    <p className="text-danger text-sm mt-1">{formErrors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-default-900 text-sm mb-2">
                    Confirm Password {(!editingStaff || !editingStaff.user_id) && <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    placeholder="Confirm password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                    disabled={isSubmitting}
                    className={`form-input w-full ${formErrors.password_confirmation ? 'border-danger focus:ring-danger' : ''}`}
                  />
                  {formErrors.password_confirmation && (
                    <p className="text-danger text-sm mt-1">{formErrors.password_confirmation}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </Drawer>

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
        description={`Are you sure you want to delete "${deletingStaff?.name}"? This action cannot be undone.`}
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
        description={`Are you sure you want to delete ${bulkDeleteIds.length} staff member(s)? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isBulkDeleting}
        size="lg"
      />
    </AppLayout>
  );
}

