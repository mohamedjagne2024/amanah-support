import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableRowAction } from "@/components/DataTable";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageHeader from "@/components/Pageheader";
import { useLanguageContext } from "@/context/useLanguageContext";

type Contact = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  country_id: number | null;
  organization_id: number | null;
  organization: string | null;
  photo: string | null;
  created_at: string | null;
};

type Country = {
  id: number;
  name: string;
};

type Organization = {
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
  countries: Country[];
  organizations: Organization[];
  filters?: {
    search?: string | null;
    sort_by?: string | null;
    sort_direction?: 'asc' | 'desc' | null;
  };
};

export default function ContactManagement({ title, contacts, countries, organizations, filters }: ContactManagementPageProps) {
  const { t } = useLanguageContext();
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
    organization_id: "",
    password: "",
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
    city: "",
    country_id: "",
    organization_id: "",
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
      country_id: contact.country_id?.toString() || "",
      organization_id: contact.organization_id?.toString() || "",
      password: "",
    });
    setEditFormErrors({});
    setIsEditDrawerOpen(true);
  }, []);

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
        organization_id: "",
        password: "",
      });
      setEditFormErrors({});
    }, 300);
  }, []);

  const handleSaveContact = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || isSaving) return;

    setIsSaving(true);

    router.put(
      `/contacts/${editingContact.id}`,
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
  }, [editingContact, editFormData, handleCloseEditDrawer, isSaving]);

  // Create drawer handlers
  const handleOpenCreateDrawer = useCallback(() => {
    setCreateFormData({
      name: "",
      email: "",
      phone: "",
      city: "",
      country_id: "",
      organization_id: "",
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
        organization_id: "",
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

  const handleDeleteContact = useCallback((contact: Contact) => {
    if (!confirm(`${t('contacts.deleteConfirm')} ${contact.name}?`)) return;

    router.delete(`/contacts/${contact.id}`, {
      preserveScroll: true,
    });
  }, [t]);

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
        header: t('contacts.columns.contact'),
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
        accessorKey: "organization",
        header: t('contacts.columns.organization'),
        cell: ({ getValue }) => {
          const org = getValue<string | null>();
          return org ? (
            <Badge variant="info">{org}</Badge>
          ) : (
            <span className="text-default-400">-</span>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "phone",
        header: t('contacts.columns.phone'),
        cell: ({ getValue }) => (
          <span className="text-default-600">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "city",
        header: t('contacts.columns.location'),
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
        accessorKey: "created_at",
        header: t('contacts.columns.joined'),
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: true,
      },
    ],
    [t]
  );

  const rowActions = useMemo<DataTableRowAction<Contact>[]>(
    () => [
      {
        label: t('contacts.editContact'),
        value: "edit",
        onSelect: (contact) => {
          handleOpenEditDrawer(contact);
        }
      },
      {
        label: t('common.delete'),
        value: "delete",
        onSelect: (contact) => {
          handleDeleteContact(contact);
        }
      },
    ],
    [handleOpenEditDrawer, handleDeleteContact, t]
  );

  return (
    <AppLayout>
      <PageMeta title={t('contacts.title')} />
      <main>
        <PageHeader title={t('contacts.title')} />
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
                {t('contacts.addContact')}
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
        title={t('contacts.editContact')}
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
              {t('contacts.buttons.cancel')}
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
                  {t('contacts.buttons.saving')}
                </span>
              ) : (
                t('contacts.buttons.saveChanges')
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
              {t('contacts.form.name')} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder={t('contacts.form.enterName')}
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
              {t('contacts.form.email')} <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder={t('contacts.form.enterEmail')}
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
              {t('contacts.form.organization')}
            </label>
            <select
              name="organization_id"
              value={editFormData.organization_id}
              onChange={(e) => setEditFormData({ ...editFormData, organization_id: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.organization_id ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="">{t('contacts.form.noOrganization')}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {editFormErrors.organization_id && (
              <p className="text-danger text-sm mt-1">{editFormErrors.organization_id}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              {t('contacts.form.phone')}
            </label>
            <input
              type="tel"
              name="phone"
              placeholder={t('contacts.form.enterPhone')}
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
                {t('contacts.form.city')}
              </label>
              <input
                type="text"
                name="city"
                placeholder={t('contacts.form.enterCity')}
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
                {t('contacts.form.country')}
              </label>
              <select
                name="country_id"
                value={editFormData.country_id}
                onChange={(e) => setEditFormData({ ...editFormData, country_id: e.target.value })}
                disabled={isSaving}
                className={`form-input w-full ${editFormErrors.country_id ? 'border-danger focus:ring-danger' : ''}`}
              >
                <option value="">{t('contacts.form.selectCountry')}</option>
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
              {t('contacts.form.newPassword')} <span className="text-default-500 text-xs">({t('contacts.form.leaveBlank')})</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder={t('contacts.form.enterNewPassword')}
              value={editFormData.password}
              onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
              disabled={isSaving}
              className={`form-input w-full ${editFormErrors.password ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.password && (
              <p className="text-danger text-sm mt-1">{editFormErrors.password}</p>
            )}
          </div>
        </form>
      </Drawer>

      {/* Create Contact Drawer */}
      <Drawer
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
        title={t('contacts.addNewContact')}
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
              {t('contacts.buttons.cancel')}
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
                  {t('contacts.buttons.creating')}
                </span>
              ) : (
                t('contacts.buttons.addContact')
              )}
            </button>
          </>
        }
      >
        <form id="create-contact-form" onSubmit={handleCreateContact} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              {t('contacts.form.name')} <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder={t('contacts.form.enterName')}
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
              {t('contacts.form.email')} <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder={t('contacts.form.enterEmail')}
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
              {t('contacts.form.organization')}
            </label>
            <select
              name="organization_id"
              value={createFormData.organization_id}
              onChange={(e) => setCreateFormData({ ...createFormData, organization_id: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.organization_id ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="">{t('contacts.form.noOrganization')}</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {createFormErrors.organization_id && (
              <p className="text-danger text-sm mt-1">{createFormErrors.organization_id}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              {t('contacts.form.phone')}
            </label>
            <input
              type="tel"
              name="phone"
              placeholder={t('contacts.form.enterPhone')}
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
                {t('contacts.form.city')}
              </label>
              <input
                type="text"
                name="city"
                placeholder={t('contacts.form.enterCity')}
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
                {t('contacts.form.country')}
              </label>
              <select
                name="country_id"
                value={createFormData.country_id}
                onChange={(e) => setCreateFormData({ ...createFormData, country_id: e.target.value })}
                disabled={isCreating}
                className={`form-input w-full ${createFormErrors.country_id ? 'border-danger focus:ring-danger' : ''}`}
              >
                <option value="">{t('contacts.form.selectCountry')}</option>
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
              {t('contacts.form.password')}
            </label>
            <input
              type="password"
              name="password"
              placeholder={t('contacts.form.enterPassword')}
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.password ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.password && (
              <p className="text-danger text-sm mt-1">{createFormErrors.password}</p>
            )}
            <p className="text-default-500 text-xs mt-1">{t('contacts.form.leaveBlankAutoGenerate')}</p>
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
}
