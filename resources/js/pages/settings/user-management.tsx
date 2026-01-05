import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableRowAction } from "@/components/DataTable";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageHeader from "@/components/Pageheader";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  region: string | null;
  region_id: number | null;
  country: string | null;
  country_id: number | null;
  profile_picture_url: string | null;
  is_super_admin: boolean;
  roles: string[];
  permissions: string[];
  created_at: string | null;
};

type Role = {
  id: number;
  name: string;
};

type PermissionItem = {
  id: number;
  name: string;
};

type PermissionGroup = {
  [key: string]: PermissionItem[];
};

type Region = {
  id: number;
  name: string;
};

type Country = {
  id: number;
  name: string;
};

type UserManagementPageProps = {
  users: User[];
  roles: Role[];
  permissions: PermissionGroup;
  regions: Region[];
  countries: Country[];
  filters?: {
    search?: string | null;
    sort_by?: string | null;
    sort_direction?: 'asc' | 'desc' | null;
  };
};

export default function UserManagement({ users, roles, permissions, regions, countries, filters }: UserManagementPageProps) {
  const safeFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null,
  };

  const [isLoading, setIsLoading] = useState(false);
  
  // Edit drawer state (Manage Roles & Permissions)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Edit User Details drawer state
  const [isEditUserDrawerOpen, setIsEditUserDrawerOpen] = useState(false);
  const [editingUserForUpdate, setEditingUserForUpdate] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    region_id: "",
    country_id: "",
  });
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Create drawer state
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    phone: "",
    region_id: "",
    country_id: "",
  });
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const [selectedCreateRoles, setSelectedCreateRoles] = useState<string[]>([]);

  // Edit drawer handlers
  const handleOpenEditDrawer = useCallback((user: User) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setSelectedPermissions(user.permissions);
    setIsEditDrawerOpen(true);
  }, []);

  const handleCloseEditDrawer = useCallback(() => {
    setIsEditDrawerOpen(false);
    setTimeout(() => {
      setEditingUser(null);
      setSelectedRoles([]);
      setSelectedPermissions([]);
    }, 300);
  }, []);

  const handleSaveRolesAndPermissions = useCallback(() => {
    if (!editingUser || isSaving) return;

    setIsSaving(true);

    router.post(
      `/settings/users/${editingUser.id}/roles-and-permissions`,
      { 
        roles: selectedRoles,
        permissions: selectedPermissions,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          handleCloseEditDrawer();
        },
        onFinish: () => {
          setIsSaving(false);
        },
      }
    );
  }, [editingUser, selectedRoles, selectedPermissions, handleCloseEditDrawer, isSaving]);

  // Edit User Details drawer handlers
  const handleOpenEditUserDrawer = useCallback((user: User) => {
    setEditingUserForUpdate(user);
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      phone: user.phone || "",
      region_id: user.region_id?.toString() || "",
      country_id: user.country_id?.toString() || "",
    });
    setEditFormErrors({});
    setIsEditUserDrawerOpen(true);
  }, []);

  const handleCloseEditUserDrawer = useCallback(() => {
    setIsEditUserDrawerOpen(false);
    setTimeout(() => {
      setEditingUserForUpdate(null);
      setEditFormData({
        name: "",
        email: "",
        password: "",
        phone: "",
        region_id: "",
        country_id: "",
      });
      setEditFormErrors({});
    }, 300);
  }, []);

  const handleSaveUser = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserForUpdate || isUpdating) return;

    setIsUpdating(true);

    router.put(
      `/settings/users/${editingUserForUpdate.id}`,
      editFormData,
      {
        preserveScroll: true,
        onSuccess: () => {
          handleCloseEditUserDrawer();
        },
        onError: (errors) => {
          setEditFormErrors(errors);
        },
        onFinish: () => {
          setIsUpdating(false);
        },
      }
    );
  }, [editingUserForUpdate, editFormData, handleCloseEditUserDrawer, isUpdating]);

  const handleDeleteUser = useCallback((user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    router.delete(`/settings/users/${user.id}`, {
      preserveScroll: true,
    });
  }, []);

  // Create drawer handlers
  const handleOpenCreateDrawer = useCallback(() => {
    setCreateFormData({
      name: "",
      email: "",
      password: "",
      password_confirmation: ""
    });
    setCreateFormErrors({});
    setSelectedCreateRoles([]);
    setIsCreateDrawerOpen(true);
  }, []);

  const handleCloseCreateDrawer = useCallback(() => {
    setIsCreateDrawerOpen(false);
    setTimeout(() => {
      setCreateFormData({
        name: "",
        email: "",
        password: "",
        password_confirmation: "",
        phone: "",
        region_id: "",
        country_id: "",
      });
      setCreateFormErrors({});
      setSelectedCreateRoles([]);
    }, 300);
  }, []);

  const handleCreateUser = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    router.post("/settings/users", {
      ...createFormData,
      roles: selectedCreateRoles,
    }, {
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
  }, [createFormData, selectedCreateRoles, handleCloseCreateDrawer]);

  const handleToggleCreateRole = useCallback((roleName: string) => {
    setSelectedCreateRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  }, []);

  const handleToggleRole = useCallback((roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(r => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  }, []);

  const handleTogglePermission = useCallback((permissionName: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
  }, []);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction,
      };

      const hasChanged = 
        query.search !== (safeFilters.search ?? "") ||
        query.sort_by !== safeFilters.sort_by ||
        query.sort_direction !== safeFilters.sort_direction;

      if (!hasChanged) {
        return;
      }

      const sanitized = Object.fromEntries(
        Object.entries(query).filter(([key, value]) => {
          if (value == null) return false;
          if (key === "search" && value === "") {
            return false;
          }
          return true;
        })
      );

      router.get("/settings/user-management", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false),
      });
    },
    [safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  // Helper function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue, row }) => (
          <div className="flex items-center gap-3">
            {row.original.profile_picture_url ? (
              <img 
                src={row.original.profile_picture_url} 
                alt={getValue<string>()} 
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {getInitials(getValue<string>())}
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
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "region",
        header: "Region",
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "country",
        header: "Country",
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string | null>() || '-'}</span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "roles",
        header: "Roles",
        cell: ({ getValue }) => {
          const userRoles = getValue<string[]>();
          if (userRoles.length === 0) {
            return <span className="text-default-400">No roles</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {userRoles.map((role) => (
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
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ getValue }) => {
          const userPermissions = getValue<string[]>();
          return (
            <span className="text-default-600">{userPermissions.length} permissions</span>
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

  const rowActions = useMemo<DataTableRowAction<User>[]>(
    () => [
      {
        label: "Edit User",
        value: "edit-user",
        onSelect: (user) => {
          handleOpenEditUserDrawer(user);
        }
      },
      {
        label: "Manage Roles & Permissions",
        value: "edit",
        onSelect: (user) => {
          handleOpenEditDrawer(user);
        }
      },
      {
        label: "Delete User",
        value: "delete",
        onSelect: (user) => {
          handleDeleteUser(user);
        }
      },
    ],
    [handleOpenEditDrawer, handleOpenEditUserDrawer, handleDeleteUser]
  );

  return (
    <AppLayout>
      <PageMeta title="User Management" />
      <main>
        <PageHeader title="User Management" />
        <div className="space-y-6">
          <DataTable<User>
            data={users}
            columns={columns}
            rowActions={rowActions}
            pagination={{
              page: 1,
              perPage: 10,
              total: users.length
            }}
            searchValue={safeFilters.search}
            onSearchChange={(search) => submitQuery({ search })}
            sorting={{
              sortBy: safeFilters.sort_by ?? undefined,
              sortDirection: safeFilters.sort_direction ?? undefined
            }}
            onSortChange={(sortBy, sortDirection) => {
              if (!sortBy || sortDirection === undefined) {
                submitQuery({ sort_by: null, sort_direction: null });
                return;
              }

              // If clicking the same column that's already sorted
              if (safeFilters.sort_by === sortBy) {
                // If currently ascending, switch to descending
                if (safeFilters.sort_direction === 'asc') {
                  submitQuery({ sort_by: sortBy, sort_direction: 'desc' });
                } 
                // If currently descending, reset sorting (third click)
                else if (safeFilters.sort_direction === 'desc') {
                  submitQuery({ sort_by: null, sort_direction: null });
                }
                // If no direction set, set to ascending
                else {
                  submitQuery({ sort_by: sortBy, sort_direction: 'asc' });
                }
              } else {
                // Clicking a different column, set to ascending
                submitQuery({ sort_by: sortBy, sort_direction: 'asc' });
              }
            }}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
            renderCreate={({ isBusy }) => (
              <button
                onClick={handleOpenCreateDrawer}
                disabled={isBusy}
                className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
              >
                Create User
              </button>
            )}
            isLoading={isLoading}
          />
        </div>
      </main>

      {/* Manage Roles & Permissions Drawer */}
      <Drawer
        isOpen={isEditDrawerOpen}
        onClose={handleCloseEditDrawer}
        title="Manage Roles & Permissions"
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
              type="button"
              onClick={handleSaveRolesAndPermissions}
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
        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-default-50 p-4 rounded-lg">
            <div className="font-semibold text-default-900">{editingUser?.name}</div>
            <div className="text-sm text-default-600">{editingUser?.email}</div>
          </div>

          {/* Roles Section */}
          <div>
            <label className="block font-medium text-default-900 text-sm mb-3">
              Roles
            </label>
            <div className="space-y-2">
              {roles.filter(role => role.name.toLowerCase() !== 'contact').map((role) => (
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

          {/* Direct Permissions Section */}
          <div>
            <label className="block font-medium text-default-900 text-sm mb-3">
              Direct Permissions
            </label>
            <div className="space-y-4">
              {Object.entries(permissions).map(([group, perms]) => (
                <div key={group} className="space-y-2">
                  <h4 className="font-semibold text-sm text-default-800 capitalize">
                    {group}
                  </h4>
                  <div className="space-y-2 pl-2">
                    {perms.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-default-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.includes(perm.name)}
                          onChange={() => handleTogglePermission(perm.name)}
                          disabled={isSaving}
                          className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className="text-sm text-default-700">
                          {perm.name.replace(`${group}.`, "")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Create User Drawer */}
      <Drawer
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseCreateDrawer}
        title="Create New User"
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
              form="create-user-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create User"
              )}
            </button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter user name"
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
              Password <span className="text-default-500 text-xs">(optional - auto-generated if empty)</span>
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
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="password_confirmation"
              placeholder="Confirm password"
              value={createFormData.password_confirmation}
              onChange={(e) => setCreateFormData({ ...createFormData, password_confirmation: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.password_confirmation ? 'border-danger focus:ring-danger' : ''}`}
            />
            {createFormErrors.password_confirmation && (
              <p className="text-danger text-sm mt-1">{createFormErrors.password_confirmation}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number (optional)"
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
              Region
            </label>
            <select
              name="region_id"
              value={createFormData.region_id}
              onChange={(e) => setCreateFormData({ ...createFormData, region_id: e.target.value })}
              disabled={isCreating}
              className={`form-input w-full ${createFormErrors.region_id ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="">Select region (optional)</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            {createFormErrors.region_id && (
              <p className="text-danger text-sm mt-1">{createFormErrors.region_id}</p>
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
              <option value="">Select country (optional)</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
            {createFormErrors.country_id && (
              <p className="text-danger text-sm mt-1">{createFormErrors.country_id}</p>
            )}
          </div>

          {/* Roles Section */}
          <div>
            <label className="block font-medium text-default-900 text-sm mb-3">
              Roles
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-default-200 rounded-lg p-3">
              {roles.filter(role => role.name.toLowerCase() !== 'contact').map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-default-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedCreateRoles.includes(role.name)}
                    onChange={() => handleToggleCreateRole(role.name)}
                    disabled={isCreating}
                    className="size-4 rounded border-default-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <span className="text-sm text-default-700">{role.name}</span>
                </label>
              ))}
            </div>
            {createFormErrors.roles && (
              <p className="text-danger text-sm mt-1">{createFormErrors.roles}</p>
            )}
          </div>
        </form>
      </Drawer>

      {/* Edit User Drawer */}
      <Drawer
        isOpen={isEditUserDrawerOpen}
        onClose={handleCloseEditUserDrawer}
        title="Edit User"
        size="lg"
        placement="right"
        footer={
          <>
            <button
              type="button"
              className="btn bg-transparent border border-default-300 text-default-700 hover:bg-default-100"
              onClick={handleCloseEditUserDrawer}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-user-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isUpdating}
            >
              {isUpdating ? (
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
        <form id="edit-user-form" onSubmit={handleSaveUser} className="space-y-4">
          {/* User Info Header */}
          <div className="bg-default-50 p-4 rounded-lg">
            <div className="font-semibold text-default-900">{editingUserForUpdate?.name}</div>
            <div className="text-sm text-default-600">{editingUserForUpdate?.email}</div>
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter user name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              disabled={isUpdating}
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
              disabled={isUpdating}
              className={`form-input w-full ${editFormErrors.email ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.email && (
              <p className="text-danger text-sm mt-1">{editFormErrors.email}</p>
            )}
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
              disabled={isUpdating}
              className={`form-input w-full ${editFormErrors.password ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.password && (
              <p className="text-danger text-sm mt-1">{editFormErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter phone number (optional)"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              disabled={isUpdating}
              className={`form-input w-full ${editFormErrors.phone ? 'border-danger focus:ring-danger' : ''}`}
            />
            {editFormErrors.phone && (
              <p className="text-danger text-sm mt-1">{editFormErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Region
            </label>
            <select
              name="region_id"
              value={editFormData.region_id}
              onChange={(e) => setEditFormData({ ...editFormData, region_id: e.target.value })}
              disabled={isUpdating}
              className={`form-input w-full ${editFormErrors.region_id ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="">Select region (optional)</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
            {editFormErrors.region_id && (
              <p className="text-danger text-sm mt-1">{editFormErrors.region_id}</p>
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
              disabled={isUpdating}
              className={`form-input w-full ${editFormErrors.country_id ? 'border-danger focus:ring-danger' : ''}`}
            >
              <option value="">Select country (optional)</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>{country.name}</option>
              ))}
            </select>
            {editFormErrors.country_id && (
              <p className="text-danger text-sm mt-1">{editFormErrors.country_id}</p>
            )}
          </div>
        </form>
      </Drawer>
    </AppLayout>
  );
}

