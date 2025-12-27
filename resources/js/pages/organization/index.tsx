import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableRowAction } from "@/components/DataTable";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageHeader from "@/components/Pageheader";

type Organization = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  postal_code: string | null;
  contacts_count: number;
  created_at: string | null;
};

type Country = {
  id: number;
  name: string;
  code: string | null;
};

type PaginationLinks = {
  url: string | null;
  label: string;
  active: boolean;
};

type PaginatedData<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  links: PaginationLinks[];
};

type OrganizationManagementPageProps = {
  title: string;
  organizations: PaginatedData<Organization>;
  countries: Country[];
  filters?: {
    search?: string | null;
    sort_by?: string | null;
    sort_direction?: 'asc' | 'desc' | null;
  };
};

export default function OrganizationManagement({ title, organizations, countries, filters }: OrganizationManagementPageProps) {
  const safeFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null,
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Edit drawer state
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    country: "",
    postal_code: "",
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Create drawer state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    country: "",
    postal_code: "",
  });
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});

  // Edit drawer handlers
  const handleOpenEditDrawer = useCallback((organization: Organization) => {
    setEditingOrganization(organization);
    setEditFormData({
      name: organization.name || "",
      email: organization.email || "",
      phone: organization.phone || "",
      address: organization.address || "",
      city: organization.city || "",
      region: organization.region || "",
      country: organization.country || "",
      postal_code: organization.postal_code || "",
    });
    setEditFormErrors({});
    setIsEditDrawerOpen(true);
  }, []);

  const handleCloseEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setTimeout(() => {
      setEditingOrganization(null);
      setEditFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        region: "",
        country: "",
        postal_code: "",
      });
      setEditFormErrors({});
    }, 300);
  }, []);

  const handleSaveOrganization = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrganization || isSaving) return;

    setIsSaving(true);

    router.put(
      `/organizations/${editingOrganization.id}`,
      editFormData,
      {
        preserveScroll: true,
        onSuccess: () => {
          handleCloseEditDrawer();
        },
        onError: (errors) => {
          setEditFormErrors(errors);
        },
        onFinish: () => {
          setIsSaving(false);
        },
      }
    );
  }, [editingOrganization, editFormData, handleCloseEditDrawer, isSaving]);

  // Create drawer handlers
  const handleOpenCreateDrawer = useCallback(() => {
    setCreateFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      region: "",
      country: "",
      postal_code: "",
    });
    setCreateFormErrors({});
    setIsCreateDrawerOpen(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setIsCreateDrawerOpen(false);
    setTimeout(() => {
      setCreateFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        region: "",
        country: "",
        postal_code: "",
      });
      setCreateFormErrors({});
    }, 300);
  }, []);

  const handleCreateOrganization = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    router.post("/organizations", createFormData, {
      preserveScroll: true,
      onStart: () => setIsCreating(true),
      onSuccess: () => {
        handleCloseCreateDrawer();
      },
      onError: (errors) => {
        setCreateFormErrors(errors);
      },
      onFinish: () => {
        setIsCreating(false);
      }
    });
  }, [createFormData, handleCloseCreateDrawer]);

  const handleDeleteOrganization = useCallback((organization: Organization) => {
    if (!confirm(`Are you sure you want to delete ${organization.name}?`)) return;

    router.delete(`/organizations/${organization.id}`, {
      preserveScroll: true,
    });
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; sort_by: string | null; sort_direction: 'asc' | 'desc' | null; page: number; per_page: number }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction,
        page: partial.page ?? organizations.current_page,
        per_page: partial.per_page ?? organizations.per_page,
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.page !== organizations.current_page ||
        query.per_page !== organizations.per_page ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if (key === "search" && value === "") return false;
          if (key === "page" && value === 1) return false;
          if (key === "per_page" && value === 10) return false;
          return true;
        })
      );

      router.get("/organizations", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
      });
    },
    [safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction, organizations.current_page, organizations.per_page]
  );

  const columns = useMemo<ColumnDef<Organization, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-medium text-sm">
                {getValue<string>()?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="space-y-0.5">
              <div className="font-medium text-default-800">{getValue<string>()}</div>
              {row.original.email && (
                <div className="text-sm text-default-600">{row.original.email}</div>
              )}
            </div>
          </div>
        ),
        enableSorting: true,
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ getValue }) => (
          <span className="text-default-600">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "city",
        header: "Location",
        cell: ({ getValue, row }) => {
          const city = getValue<string | null>();
          const region = row.original.region;
          const country = row.original.country;
          const location = [city, region, country].filter(Boolean).join(', ');
          return (
            <span className="text-default-600">{location || '-'}</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "contacts_count",
        header: "Contacts",
        cell: ({ getValue }) => {
          const count = getValue<number>();
          return (
            <Badge variant={count > 0 ? "info" : "default"}>
              {count} {count === 1 ? 'contact' : 'contacts'}
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "created_at",
        header: "Created",
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: true,
      },
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<Organization>[]>(
    () => [
      {
        label: "Edit Organization",
        value: "edit",
        onSelect: (organization) => {
          handleOpenEditDrawer(organization);
        }
      },
      {
        label: "Delete Organization",
        value: "delete",
        onSelect: (organization) => {
          handleDeleteOrganization(organization);
        }
      },
    ],
    [handleOpenEditDrawer, handleDeleteOrganization]
  );

  return (
    <AppLayout>
      <PageMeta title={title || "Organizations"} />
      <main>
        <PageHeader title={title || "Organizations"} />
        <div className="space-y-6">
          <DataTable<Organization>
            data={organizations.data}
            columns={columns}
            rowActions={rowActions}
            pagination={{
              page: organizations.current_page,
              perPage: organizations.per_page,
              total: organizations.total
            }}
            searchValue={safeFilters.search}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            sorting={{
              sortBy: safeFilters.sort_by ?? undefined,
              sortDirection: safeFilters.sort_direction ?? undefined
            }}
            onSortChange={(sortBy, sortDirection) => {
              if (!sortBy || sortDirection === undefined) {
                submitQuery({ sort_by: null, sort_direction: null });
                return;
              }

              if (safeFilters.sort_by === sortBy) {
                if (safeFilters.sort_direction === 'asc') {
                  submitQuery({ sort_by: sortBy, sort_direction: 'desc' });
                } else if (safeFilters.sort_direction === 'desc') {
                  submitQuery({ sort_by: null, sort_direction: null });
                } else {
                  submitQuery({ sort_by: sortBy, sort_direction: 'asc' });
                }
              } else {
                submitQuery({ sort_by: sortBy, sort_direction: 'asc' });
              }
            }}
            onPageChange={(page) => submitQuery({ page })}
            onPerPageChange={(per_page) => submitQuery({ per_page, page: 1 })}
            renderCreate={({ isBusy }) => (
              <button
                onClick={handleOpenCreateDrawer}
                disabled={isBusy}
                className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
              >
                Add Organization
              </button>
            )}
            isLoading={isLoading}
            getRowId={(row) => String(row.id)}
          />
        </div>
      </main>

      {/* Edit Organization Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        title="Edit Organization"
        size="lg"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseEditDrawer}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-organization-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </>
        }
      >
        <form id="edit-organization-form" onSubmit={handleSaveOrganization} className="space-y-4">
          {/* Organization Info Header */}
          <div className="bg-default-50 p-4 rounded-lg flex items-center gap-3">
            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {editingOrganization?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <div className="font-semibold text-default-900">{editingOrganization?.name}</div>
              <div className="text-sm text-default-600">{editingOrganization?.email || 'No email'}</div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Organization Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter organization name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.name ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.name && (
              <p className="text-danger text-sm mt-1">{editFormErrors.name}</p>
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
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.email ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.email && (
              <p className="text-danger text-sm mt-1">{editFormErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.phone ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.phone && (
              <p className="text-danger text-sm mt-1">{editFormErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              placeholder="Enter street address"
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.address ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.address && (
              <p className="text-danger text-sm mt-1">{editFormErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                placeholder="Enter city"
                value={editFormData.city}
                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                disabled={isSaving}
                className={`form-input w-full ${editFormErrors.city ? 'border-danger focus:ring-danger' : ''}`}
              />
              {editFormErrors.city && (
                <p className="text-danger text-sm mt-1">{editFormErrors.city}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Region / State
              </label>
              <input
                type="text"
                name="region"
                placeholder="Enter region"
                value={editFormData.region}
                onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                disabled={isSaving}
                className={`form-input w-full ${editFormErrors.region ? 'border-danger focus:ring-danger' : ''}`}
              />
              {editFormErrors.region && (
                <p className="text-danger text-sm mt-1">{editFormErrors.region}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Country
              </label>
              <select
                name="country"
                value={editFormData.country}
                onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                disabled={isSaving}
                className={`form-input w-full ${editFormErrors.country ? 'border-danger focus:ring-danger' : ''}`}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.code || country.name.substring(0, 2).toUpperCase()}>
                    {country.name}
                  </option>
                ))}
              </select>
              {editFormErrors.country && (
                <p className="text-danger text-sm mt-1">{editFormErrors.country}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                placeholder="Enter postal code"
                value={editFormData.postal_code}
                onChange={(e) => setEditFormData({ ...editFormData, postal_code: e.target.value })}
                disabled={isSaving}
                className={`form-input w-full ${editFormErrors.postal_code ? 'border-danger focus:ring-danger' : ''}`}
              />
              {editFormErrors.postal_code && (
                <p className="text-danger text-sm mt-1">{editFormErrors.postal_code}</p>
              )}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Create Organization Drawer */}
      <Drawer
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
        title="Add New Organization"
        size="lg"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseCreateDrawer}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-organization-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                  "Add Organization"
              )}
            </button>
          </>
        }
      >
        <form id="create-organization-form" onSubmit={handleCreateOrganization} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Organization Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter organization name"
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.name ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.name && (
              <p className="text-danger text-sm mt-1">{createFormErrors.name}</p>
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
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.email ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.email && (
              <p className="text-danger text-sm mt-1">{createFormErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number"
              value={createFormData.phone}
              onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.phone ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.phone && (
              <p className="text-danger text-sm mt-1">{createFormErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Address
            </label>
            <input
              type="text"
              name="address"
              placeholder="Enter street address"
              value={createFormData.address}
              onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.address ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.address && (
              <p className="text-danger text-sm mt-1">{createFormErrors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                City
              </label>
              <input
                type="text"
                name="city"
                placeholder="Enter city"
                value={createFormData.city}
                onChange={(e) => setCreateFormData({ ...createFormData, city: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.city ? 'border-danger focus:ring-danger' : ''}`}
              />
              {createFormErrors.city && (
                <p className="text-danger text-sm mt-1">{createFormErrors.city}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Region / State
              </label>
              <input
                type="text"
                name="region"
                placeholder="Enter region"
                value={createFormData.region}
                onChange={(e) => setCreateFormData({ ...createFormData, region: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.region ? 'border-danger focus:ring-danger' : ''}`}
              />
              {createFormErrors.region && (
                <p className="text-danger text-sm mt-1">{createFormErrors.region}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Country
              </label>
              <select
                name="country"
                value={createFormData.country}
                onChange={(e) => setCreateFormData({ ...createFormData, country: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.country ? 'border-danger focus:ring-danger' : ''}`}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.code || country.name.substring(0, 2).toUpperCase()}>
                    {country.name}
                  </option>
                ))}
              </select>
              {createFormErrors.country && (
                <p className="text-danger text-sm mt-1">{createFormErrors.country}</p>
              )}
            </div>

            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                placeholder="Enter postal code"
                value={createFormData.postal_code}
                onChange={(e) => setCreateFormData({ ...createFormData, postal_code: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.postal_code ? 'border-danger focus:ring-danger' : ''}`}
              />
              {createFormErrors.postal_code && (
                <p className="text-danger text-sm mt-1">{createFormErrors.postal_code}</p>
              )}
            </div>
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
}
