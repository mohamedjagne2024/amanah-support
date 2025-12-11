import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, Badge } from "@/components/DataTable";
import AppLayout from "@/layouts/app-layout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import PageMeta from "@/components/PageMeta";

type Permission = {
  id: number;
  name: string;
  roles: string[];
  roles_count: number;
};

type PermissionGroup = {
  group: string;
  permissions: Permission[];
};

type Role = {
  id: number;
  name: string;
};

type PermissionsPageProps = {
  permissions: PermissionGroup[];
  roles: Role[];
};

export default function Permissions({ permissions, roles }: PermissionsPageProps) {
  const allPermissions = useMemo(() => {
    return permissions.flatMap(group => 
      group.permissions.map(perm => ({
        ...perm,
        group: group.group,
      }))
    );
  }, [permissions]);

  const columns = useMemo<ColumnDef<Permission & { group: string }, unknown>[]>(
    () => [
      {
        accessorKey: "group",
        header: "Group",
        cell: ({ getValue }) => (
          <span className="font-semibold text-default-800 capitalize">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "name",
        header: "Permission",
        cell: ({ getValue }) => {
          const name = getValue<string>();
          const parts = name.split(".");
          return (
            <span className="text-default-700">
              {parts.length > 1 ? parts[1] : name}
            </span>
          );
        },
        enableSorting: true
      },
      {
        accessorKey: "roles",
        header: "Assigned Roles",
        cell: ({ row }) => {
          const roleNames = row.original.roles;
          if (roleNames.length === 0) {
            return <span className="text-default-400">No roles</span>;
          }
          return (
            <div className="flex flex-wrap gap-1">
              {roleNames.slice(0, 3).map((role) => (
                <Badge key={role} variant="info">
                  {role}
                </Badge>
              ))}
              {roleNames.length > 3 && (
                <Badge variant="default">
                  +{roleNames.length - 3} more
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "roles_count",
        header: "Role Count",
        cell: ({ getValue }) => (
          <span className="text-default-600">{getValue<number>()} roles</span>
        ),
        enableSorting: true
      },
    ],
    []
  );

  return (
    <AppLayout>
      <PageMeta title="Permissions" />
      <main>
        <PageBreadcrumb title="Permissions" subtitle="Settings" />
        <div className="space-y-6">
          {permissions.map((group) => (
            <div key={group.group} className="bg-card border border-default-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-default-900 mb-4 capitalize">
                {group.group}
              </h2>
              <DataTable<Permission & { group: string }>
                data={group.permissions.map(p => ({ ...p, group: group.group }))}
                columns={columns}
                pagination={{
                  page: 1,
                  perPage: group.permissions.length,
                  total: group.permissions.length
                }}
                searchValue=""
                onSearchChange={() => {}}
                onPageChange={() => {}}
                onPerPageChange={() => {}}
                isLoading={false}
              />
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}

