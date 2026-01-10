import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, Badge } from "@/components/DataTable";
import AppLayout from "@/layouts/app-layout";
import PageMeta from "@/components/PageMeta";
import PageHeader from "@/components/Pageheader";
import { useLanguageContext } from "@/context/useLanguageContext";

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
  const { t } = useLanguageContext();

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
        header: t('settings.permissions.columns.group'),
        cell: ({ getValue }) => (
          <span className="font-semibold text-default-800 capitalize">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "name",
        header: t('settings.permissions.columns.permission'),
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
        header: t('settings.permissions.columns.assignedRoles'),
        cell: ({ row }) => {
          const roleNames = row.original.roles;
          if (roleNames.length === 0) {
            return <span className="text-default-400">{t('settings.permissions.noRoles')}</span>;
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
                  +{roleNames.length - 3} {t('settings.permissions.more')}
                </Badge>
              )}
            </div>
          );
        },
        enableSorting: false
      },
      {
        accessorKey: "roles_count",
        header: t('settings.permissions.columns.roleCount'),
        cell: ({ getValue }) => (
          <span className="text-default-600">{getValue<number>()} {t('settings.permissions.rolesCount')}</span>
        ),
        enableSorting: true
      },
    ],
    [t]
  );

  return (
    <AppLayout>
      <PageMeta title={t('settings.permissions.title')} />
      <main>
        <PageHeader title={t('settings.permissions.title')} />
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
                onSearchChange={() => { }}
                onPageChange={() => { }}
                onPerPageChange={() => { }}
                isLoading={false}
              />
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
