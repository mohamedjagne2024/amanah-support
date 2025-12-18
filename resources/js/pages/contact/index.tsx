import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableRowAction } from "@/components/DataTable";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageHeader from "@/components/Pageheader";

type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  photo: string | null;
  roles: string[];
  created_at: string | null;
};

type Role = {
  id: number;
  name: string;
};

type Country = {
  id: number;
  name: string;
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

type ContactManagementPageProps = {
  title: string;
  contacts: PaginatedData<Contact>;
  roles: Role[];
  countries: Country[];
  filters?: {
    search?: string | null;
    sort_by?: string | null;
    sort_direction?: 'asc' | 'desc' | null;
  };
};

export default function ContactManagement({ title, contacts, roles, countries, filters }: ContactManagementPageProps) {
  const safeFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null,
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Edit drawer state (Manage Contact)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country_id: "",
    password: "",
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Create drawer state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    country_id: "",
    password: "",
  });
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});

  // Edit drawer handlers
  const handleOpenEditDrawer = useCallback((contact: Contact) => {
    setEditingContact(contact);
    setEditFormData({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      city: contact.city || "",
      country_id: countries.find(c => c.name === contact.country)?.id.toString() || "",
      password: "",
    });
    setSelectedRoles(contact.roles);
    setEditFormErrors({});
    setIsEditDrawerOpen(true);
  }, [countries]);

  const handleCloseEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setTimeout(() => {
      setEditingContact(null);
      setEditFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        country_id: "",
        password: "",
      });
      setSelectedRoles([]);
      setEditFormErrors({});
    }, 300);
  }, []);

  const handleSaveContact = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || isSaving) return;

    setIsSaving(true);

    router.put(
      `/contacts/${editingContact.id}`,
      { 
        ...editFormData,
        roles: selectedRoles,
      },
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
    }, [editingContact, editFormData, selectedRoles, handleCloseEditDrawer, isSaving]);

  // Create drawer handlers
  const handleOpenCreateDrawer = useCallback(() => {
    setCreateFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      country_id: "",
      password: "",
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
        city: "",
        country_id: "",
        password: "",
      });
      setCreateFormErrors({});
    }, 300);
  }, []);

  const handleCreateContact = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    router.post("/contacts", createFormData, {
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

  const handleToggleRole = useCallback((roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  }, []);

  const handleDeleteContact = useCallback((contact: Contact) => {
    if (!confirm(`Are you sure you want to delete ${contact.name}?`)) return;

    router.delete(`/contacts/${contact.id}`, {
      preserveScroll: true,
    });
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; sort_by: string | null; sort_direction: 'asc' | 'desc' | null; page: number; per_page: number }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction,
        page: partial.page ?? contacts.current_page,
        per_page: partial.per_page ?? contacts.per_page,
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.page !== contacts.current_page ||
        query.per_page !== contacts.per_page ||
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

      router.get("/contacts", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
      });
    },
    [safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction, contacts.current_page, contacts.per_page]
  );

  const columns = useMemo<ColumnDef<Contact, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Contact",
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-3">
            {row.original.photo ? (
              <img 
                src={row.original.photo} 
                alt={getValue<string>()} 
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {getValue<string>()?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="space-y-0.5">
              <div className="font-medium text-default-800">{getValue<string>()}</div>
              <div className="text-sm text-default-600">{row.original.email}</div>
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
          const country = row.original.country;
          const location = [city, country].filter(Boolean).join(', ');
          return (
            <span className="text-default-600">{location || '-'}</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ getValue }) => {
          const contactRoles = getValue<string[]>();
          if (contactRoles.length === 0) {
            return <span className="text-default-400">No roles</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {contactRoles.map((role) => (
                <Badge key={role} variant="info">
                  {role}
                </Badge>
              ))}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "created_at",
        header: "Joined",
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: true,
      },
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<Contact>[]>(
    () => [
      {
        label: "Edit Contact",
        value: "edit",
        onSelect: (contact) => {
          handleOpenEditDrawer(contact);
        }
      },
      {
        label: "Delete Contact",
        value: "delete",
        onSelect: (contact) => {
          handleDeleteContact(contact);
        }
      },
    ],
    [handleOpenEditDrawer, handleDeleteContact]
  );

  return (
    <AppLayout>
      <PageMeta title={title || "Contacts"} />
      <main>
        <PageHeader title={title || "Contacts"} />
        <div className="space-y-6">
          <DataTable<Contact>
            data={contacts.data}
            columns={columns}
            rowActions={rowActions}
            pagination={{
              page: contacts.current_page,
              perPage: contacts.per_page,
              total: contacts.total
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
                Add Contact
              </button>
            )}
            isLoading={isLoading}
            getRowId={(row) => String(row.id)}
          />
        </div>
      </main>

      {/* Edit Contact Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        title="Edit Contact"
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
              form="edit-contact-form"
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
        <form id="edit-contact-form" onSubmit={handleSaveContact} className="space-y-4">
          {/* Contact Info Header */}
          <div className="bg-default-50 p-4 rounded-lg flex items-center gap-3">
            {editingContact?.photo ? (
              <img 
                src={editingContact.photo} 
                alt={editingContact.name} 
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {editingContact?.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div>
              <div className="font-semibold text-default-900">{editingContact?.name}</div>
              <div className="text-sm text-default-600">{editingContact?.email}</div>
            </div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter contact name"
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
              Email <span className="text-danger">*</span>
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
                Country
              </label>
              <select
                name="country_id"
                value={editFormData.country_id}
                onChange={(e) => setEditFormData({ ...editFormData, country_id: e.target.value })}
                disabled={isSaving}
                className={`form-input w-full ${editFormErrors.country_id ? 'border-danger focus:ring-danger' : ''}`}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {editFormErrors.country_id && (
                <p className="text-danger text-sm mt-1">{editFormErrors.country_id}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              New Password <span className="text-default-500 text-xs">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter new password"
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.password ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.password && (
              <p className="text-danger text-sm mt-1">{editFormErrors.password}</p>
            )}
          </div>

          {/* Roles Section */}
          <div>
            <label className="block font-medium text-default-900 text-sm mb-3">
              Roles
            </label>
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-default-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => handleToggleRole(role.name)}
                    disabled={isSaving}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm text-default-700">{role.name}</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Drawer>

      {/* Create Contact Drawer */}
      <Drawer
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
        title="Add New Contact"
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
              form="create-contact-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                  "Add Contact"
              )}
            </button>
          </>
        }
      >
        <form id="create-contact-form" onSubmit={handleCreateContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-default-900 text-sm mb-2">
                Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter first name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.name ? 'border-danger focus:ring-danger' : ''}`}
              />
              {createFormErrors.name && (
                <p className="text-danger text-sm mt-1">{createFormErrors.name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Email <span className="text-danger">*</span>
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
                Country
              </label>
              <select
                name="country_id"
                value={createFormData.country_id}
                onChange={(e) => setCreateFormData({ ...createFormData, country_id: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.country_id ? 'border-danger focus:ring-danger' : ''}`}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {createFormErrors.country_id && (
                <p className="text-danger text-sm mt-1">{createFormErrors.country_id}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password (optional)"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.password ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.password && (
              <p className="text-danger text-sm mt-1">{createFormErrors.password}</p>
            )}
            <p className="text-default-500 text-xs mt-1">Leave blank to auto-generate a password</p>
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
}

