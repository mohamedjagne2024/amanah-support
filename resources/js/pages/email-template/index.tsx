import { router } from "@inertiajs/react";
import { ColumnDef } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { DataTable, type DataTableRowAction } from "@/components/DataTable";
import AppLayout from "@/layouts/app-layout";
import PageHeader from "@/components/Pageheader";
import PageMeta from "@/components/PageMeta";
import { Mail } from "lucide-react";
import { useLanguageContext } from "@/context/useLanguageContext";

type EmailTemplateRecord = {
  id: number;
  name: string;
  details: string;
  slug: string;
  language: string;
  html: string;
};

type EmailTemplatePaginator = {
  data: EmailTemplateRecord[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
};

type EmailTemplateFilters = {
  search?: string | null;
  sort_by?: string | null;
  sort_direction?: 'asc' | 'desc' | null;
};

type EmailTemplatePageProps = {
  templates: EmailTemplatePaginator;
  filters: EmailTemplateFilters;
};

export default function Index({ templates, filters }: EmailTemplatePageProps) {
  const { t } = useLanguageContext();

  const safeTemplates: EmailTemplatePaginator = {
    data: templates?.data ?? [],
    current_page: templates?.current_page ?? 1,
    per_page: templates?.per_page ?? 10,
    total: templates?.total ?? 0,
    last_page: templates?.last_page ?? 1,
    from: templates?.from ?? 0,
    to: templates?.to ?? 0,
  };

  const safeFilters: EmailTemplateFilters = {
    search: filters?.search ?? "",
    sort_by: filters?.sort_by ?? null,
    sort_direction: filters?.sort_direction ?? null
  };

  const [isLoading, setIsLoading] = useState(false);

  const submitQuery = useCallback(
    (partial: Partial<{ search: string; page: number; perPage: number; sort_by: string | null; sort_direction: 'asc' | 'desc' | null }>) => {
      const query = {
        search: partial.search ?? safeFilters.search ?? "",
        page: partial.page ?? safeTemplates.current_page,
        perPage: partial.perPage ?? safeTemplates.per_page,
        sort_by: partial.sort_by !== undefined ? partial.sort_by : safeFilters.sort_by,
        sort_direction: partial.sort_direction !== undefined ? partial.sort_direction : safeFilters.sort_direction
      };

      const hasChanged =
        query.search !== (safeFilters.search ?? "") ||
        query.page !== safeTemplates.current_page ||
        query.perPage !== safeTemplates.per_page ||
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
          if (key === "page" && value === 1) {
            return false;
          }
          if (key === "perPage" && value === 10) {
            return false;
          }
          return true;
        })
      );

      router.get("/settings/templates", sanitized, {
        preserveScroll: true,
        preserveState: true,
        replace: true,
        onStart: () => setIsLoading(true),
        onFinish: () => setIsLoading(false)
      });
    },
    [safeTemplates.current_page, safeTemplates.per_page, safeFilters.search, safeFilters.sort_by, safeFilters.sort_direction]
  );

  const columns = useMemo<ColumnDef<EmailTemplateRecord, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: t('settings.emailTemplates.templateName'),
        cell: ({ getValue }) => (
          <span className="font-medium text-default-800">{getValue<string>()}</span>
        ),
        enableSorting: true
      },
      {
        accessorKey: "details",
        header: t('settings.emailTemplates.details'),
        cell: ({ getValue }) => (
          <span className="text-default-600 text-sm">{getValue<string>()}</span>
        ),
        enableSorting: false
      },
      {
        accessorKey: "slug",
        header: t('settings.emailTemplates.slug'),
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-default-600 bg-default-100 px-2 py-1 rounded">
            {getValue<string>()}
          </span>
        ),
        enableSorting: true
      }
    ],
    [t]
  );

  const rowActions = useMemo<DataTableRowAction<EmailTemplateRecord>[]>(
    () => [
      {
        label: t('settings.emailTemplates.editTemplate'),
        value: "edit",
        onSelect: (template) => {
          router.visit(`/settings/templates/${template.id}/edit`);
        }
      }
    ],
    [t]
  );

  return (
    <AppLayout>
      <PageMeta title={t('settings.emailTemplates.title')} />
      <main>
        <PageHeader
          title={t('settings.emailTemplates.title')}
          subtitle={t('settings.emailTemplates.subtitle')}
          icon={Mail}
          count={safeTemplates.total}
        />

        <div className="space-y-6">
          <DataTable<EmailTemplateRecord>
            data={safeTemplates.data}
            columns={columns}
            pagination={{
              page: safeTemplates.current_page,
              perPage: safeTemplates.per_page,
              total: safeTemplates.total
            }}
            searchValue={safeFilters.search ?? ""}
            onSearchChange={(search) => submitQuery({ search, page: 1 })}
            sorting={{
              sortBy: safeFilters.sort_by ?? undefined,
              sortDirection: safeFilters.sort_direction ?? undefined
            }}
            onSortChange={(sortBy, sortDirection) => {
              submitQuery({ sort_by: sortBy ?? null, sort_direction: sortDirection ?? null, page: 1 });
            }}
            onPageChange={(page) => submitQuery({ page })}
            onPerPageChange={(perPage) => submitQuery({ perPage, page: 1 })}
            rowActions={rowActions}
            isLoading={isLoading}
          />
        </div>
      </main>
    </AppLayout>
  );
}
