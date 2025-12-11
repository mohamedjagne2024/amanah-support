import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, Badge, type DataTableRowAction } from "@/components/DataTable";
import { ConfirmDialog } from "@/components/Dialog";
import Drawer from "@/components/Drawer";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";

type Role = {
  id: number;
  name: string;
  permissions: string[];
  permissions_count: number;
  users_count: number;
};

type PermissionItem = {
  id: number;
  name: string;
};

type PermissionGroup = {
  [key: string]: PermissionItem[];
};

type RolesPageProps = {
  roles: Role[];
  permissions: PermissionGroup;
};

export default function Roles({ roles, permissions }: RolesPageProps) {
  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({ name: "" });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Drawer handlers
  const handleOpenDrawer = useCallback((role?: Role) => {
    setEditingRole(role ?? null);
    setFormData({ 
      name: role?.name ?? ""
    });
    setSelectedPermissions(role?.permissions ?? []);
    setFormErrors({});
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setEditingRole(null);
      setFormData({ name: "" });
      setSelectedPermissions([]);
      setFormErrors({});
    }, 300);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingRole 
      ? `/roles/${editingRole.id}` 
      : "/roles";
    
    const method = editingRole ? "put" : "post";

    router[method](url, {
      ...formData,
      permissions: selectedPermissions
    }, {
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
  }, [editingRole, formData, selectedPermissions, handleCloseDrawer]);

  // Delete handlers
  const handleOpenDeleteDialog = useCallback((role: Role) => {
    setDeletingRole(role);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTimeout(() => {
      setDeletingRole(null);
    }, 300);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deletingRole) return;

    router.delete(`/roles/${deletingRole.id}`, {
      preserveScroll: true,
      onStart: () => setIsDeleting(true),
      onFinish: () => {
        setIsDeleting(false);
        handleCloseDeleteDialog();
      }
    });
  }, [deletingRole, handleCloseDeleteDialog]);

  const handleTogglePermission = useCallback((permissionName: string) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionName)) {
        return prev.filter(p => p !== permissionName);
      } else {
        return [...prev, permissionName];
      }
    });
  }, []);

  const columns = useMemo<ColumnDef<Role, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "permissions_count",
        header: "Permissions",
        cell: ({ row }) => (
          <Badge variant="info">
            {row.original.permissions_count} permissions
          </Badge>
        ),
        enableSorting: true
      },
      {
        accessorKey: "users_count",
        header: "Users",
        cell: ({ row }) => (
          <span className="text-default-600">{row.original.users_count} users</span>
        ),
        enableSorting: true
      },
    ],
    []
  );

  const rowActions = useMemo<DataTableRowAction<Role>[]>(
    () => [
      {
        label: "Edit",
        value: "edit",
        onSelect: (role) => {
          handleOpenDrawer(role);
        }
      },
      {
        label: "Delete",
        value: "delete",
        onSelect: (role) => {
          handleOpenDeleteDialog(role);
        },
        condition: (role) => role.name !== "Super Admin"
      },
    ],
    [handleOpenDrawer, handleOpenDeleteDialog]
  );

  return (
    <AppLayout>
      <PageMeta title="Roles" />
      <main>
        <PageBreadcrumb title="Roles" subtitle="Settings" />
        <div className="space-y-6">
          <DataTable<Role>
            data={roles}
            columns={columns}
            rowActions={rowActions}
            pagination={{
              page: 1,
              perPage: 10,
              total: roles.length
            }}
            searchValue=""
            onSearchChange={() => {}}
            onPageChange={() => {}}
            onPerPageChange={() => {}}
            renderCreate={({ isBusy }) => (
              <button
                onClick={() => handleOpenDrawer()}
                disabled={isBusy}
                className="btn bg-primary text-white disabled:cursor-not-allowed btn-sm"
              >
                Create Role
              </button>
            )}
            isLoading={false}
          />
        </div>
      </main>

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={editingRole ? "Edit Role" : "Create Role"}
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
              form="role-form"
              className="btn bg-primary text-white hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                editingRole ? "Update Role" : "Create Role"
              )}
            </button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-medium text-default-900 text-sm mb-2">
              Role Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter role name"
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
            <label className="block font-medium text-default-900 text-sm mb-3">
              Permissions
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
                          disabled={isSubmitting}
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
        description={`Are you sure you want to delete the role "${deletingRole?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isDeleting}
        size="lg"
      />
    </AppLayout>
  );
}

