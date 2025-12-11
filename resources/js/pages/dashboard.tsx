import { usePage } from '@inertiajs/react';
import { LuPackage, LuWrench, LuShoppingCart, LuDollarSign, LuTrendingUp, LuClock } from 'react-icons/lu';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import AppLayout from '@/layouts/app-layout';
import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';

interface DashboardProps {
  userName: string;
  metrics?: {
    totalAssets?: number;
    totalWorkOrders?: number;
    totalPurchaseOrders?: number;
    totalAssetValue?: number;
  };
  charts?: {
    assetsByStatus?: Array<{ status: string; count: number }>;
    workOrdersByPriority?: Array<{ priority: string; count: number }>;
    assetsByLocation?: Array<{ location: string; count: number }>;
    assetsByCategory?: Array<{ category: string; count: number }>;
    purchaseOrdersTrend?: Array<{
      month: string;
      count: number;
      value: number;
    }>;
    workOrdersTrend?: Array<{ month: string; count: number }>;
  };
  activities?: {
    recentWorkOrders?: Array<{
      id: number;
      title: string;
      asset_name: string;
      status: string;
      priority: string;
      created_at: string;
    }>;
    recentPurchaseOrders?: Array<{
      id: number;
      title: string;
      po_number: string;
      status: string;
      grand_total: number;
      created_at: string;
    }>;
  };
}

const Dashboard = ({ userName, metrics = {}, charts = {}, activities = {} }: DashboardProps) => {
  const { props } = usePage();
  const permissions = ((props.auth as any)?.permissions || []) as string[];

  // Check if user has any widget permission
  const hasAnyWidgetPermission = permissions.some((perm: string) =>
    perm.startsWith('dashboard.widgets.')
  );

  // Helper function to check permissions
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  // If user has no widget permissions, show welcome message
  if (!hasAnyWidgetPermission) {
    return (
      <AppLayout>
        <PageMeta title="Dashboard" />
        <main>
          <PageBreadcrumb title="Dashboard" subtitle="All important metrics at a glance" />
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">Welcome, {userName}!</h2>
              <p className="text-default-700">
                You don't have permission to view any dashboard widgets.
              </p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  // Chart color palettes
  const statusColors = ['#14b8a6', '#3b82f6', '#f97316', '#ef4444', '#a855f7', '#22c55e'];
  const priorityColors = ['#22c55e', '#eab308', '#f97316', '#ef4444'];

  // Assets by Status Chart
  const assetsStatusChartOptions = useMemo((): ApexOptions => {
    const data = charts.assetsByStatus || [];
    return {
      chart: {
        type: 'donut',
        height: 280,
        toolbar: { show: false },
      },
      labels: data.map((item) => item.status),
      colors: statusColors.slice(0, data.length),
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
          },
        },
      },
    };
  }, [charts.assetsByStatus]);

  const assetsStatusChartSeries = useMemo(() => {
    return charts.assetsByStatus?.map((item) => item.count) || [];
  }, [charts.assetsByStatus]);

  // Work Orders by Priority Chart
  const workOrdersPriorityChartOptions = useMemo((): ApexOptions => {
    const data = charts.workOrdersByPriority || [];
    return {
      chart: {
        type: 'donut',
        height: 280,
        toolbar: { show: false },
      },
      labels: data.map((item) => item.priority),
      colors: priorityColors.slice(0, data.length),
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
          },
        },
      },
    };
  }, [charts.workOrdersByPriority]);

  const workOrdersPriorityChartSeries = useMemo(() => {
    return charts.workOrdersByPriority?.map((item) => item.count) || [];
  }, [charts.workOrdersByPriority]);

  // Assets by Location Chart
  const locationChartOptions = useMemo((): ApexOptions => {
    const data = charts.assetsByLocation || [];
    return {
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
        },
      },
      dataLabels: {
        enabled: true,
      },
      xaxis: {
        categories: data.map((item) => item.location),
      },
      colors: ['#14b8a6'],
      grid: {
        borderColor: '#e5e7eb',
      },
    };
  }, [charts.assetsByLocation]);

  const locationChartSeries = useMemo(() => {
    const data = charts.assetsByLocation || [];
    return [
      {
        name: 'Count',
        data: data.map((item) => item.count),
      },
    ];
  }, [charts.assetsByLocation]);

  // Assets by Category Chart
  const categoryChartOptions = useMemo((): ApexOptions => {
    const data = charts.assetsByCategory || [];
    return {
      series: [
        {
          name: 'Count',
          data: data.map((item) => item.count),
        },
      ],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: true,
      },
      xaxis: {
        categories: data.map((item) => item.category),
        labels: {
          rotate: -45,
          rotateAlways: true,
        },
      },
      colors: ['#a855f7'],
      grid: {
        borderColor: '#e5e7eb',
      },
    };
  }, [charts.assetsByCategory]);

  const categoryChartSeries = useMemo(() => {
    const data = charts.assetsByCategory || [];
    return [
      {
        name: 'Count',
        data: data.map((item) => item.count),
      },
    ];
  }, [charts.assetsByCategory]);

  // Purchase Orders Trend Chart
  const poTrendChartOptions = useMemo((): ApexOptions => {
    const data = charts.purchaseOrdersTrend || [];
    return {
      series: [
        {
          name: 'Count',
          data: data.map((item) => item.count),
        },
        {
          name: 'Value',
          data: data.map((item) => item.value),
        },
      ],
      chart: {
        type: 'area',
        height: 300,
        stacked: true,
        toolbar: { show: false },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.8,
        },
      },
      xaxis: {
        categories: data.map((item) => {
          const [year, month] = item.month.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }),
      },
      colors: ['#3b82f6', '#22c55e'],
      legend: {
        position: 'top',
      },
      grid: {
        borderColor: '#e5e7eb',
      },
    };
  }, [charts.purchaseOrdersTrend]);

  const poTrendChartSeries = useMemo(() => {
    const data = charts.purchaseOrdersTrend || [];
    return [
      {
        name: 'Count',
        data: data.map((item) => item.count),
      },
      {
        name: 'Value',
        data: data.map((item) => item.value),
      },
    ];
  }, [charts.purchaseOrdersTrend]);

  // Work Orders Trend Chart
  const woTrendChartOptions = useMemo((): ApexOptions => {
    const data = charts.workOrdersTrend || [];
    return {
      series: [
        {
          name: 'Count',
          data: data.map((item) => item.count),
        },
      ],
      chart: {
        type: 'area',
        height: 300,
        toolbar: { show: false },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 2,
      },
      fill: {
        type: 'gradient',
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.8,
        },
      },
      xaxis: {
        categories: data.map((item) => {
          const [year, month] = item.month.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('en-US', { month: 'short' });
        }),
      },
      colors: ['#f97316'],
      legend: {
        position: 'top',
      },
      grid: {
        borderColor: '#e5e7eb',
      },
    };
  }, [charts.workOrdersTrend]);

  const woTrendChartSeries = useMemo(() => {
    const data = charts.workOrdersTrend || [];
    return [
      {
        name: 'Count',
        data: data.map((item) => item.count),
      },
    ];
  }, [charts.workOrdersTrend]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
      case 'draft':
      case 'pending approval':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <AppLayout>
      <PageMeta title="Dashboard" />
      <main>
        <PageBreadcrumb title="Dashboard" subtitle="All important metrics at a glance" />
        <div className="space-y-6">
          {/* KPI Cards */}
          {(hasPermission('dashboard.widgets.total-assets') ||
            hasPermission('dashboard.widgets.work-orders') ||
            hasPermission('dashboard.widgets.purchase-orders') ||
            hasPermission('dashboard.widgets.total-asset-value')) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {hasPermission('dashboard.widgets.total-assets') && metrics.totalAssets !== undefined && (
                <div className="card bg-success/15 overflow-hidden">
                  <div className="card-body relative">
                    <LuPackage className="absolute top-0 size-32 text-success/10 -end-10" />
                    <div className="btn btn-icon size-12 bg-success">
                      <LuPackage className="size-6 text-white" />
                    </div>
                    <h5 className="mt-3 text-lg font-semibold">
                      <span className="counter-value" data-target={metrics.totalAssets}>
                        {metrics.totalAssets.toLocaleString()}
                      </span>
                    </h5>
                    <p className="text-sm text-default-700">Total Assets</p>
                  </div>
                </div>
              )}

              {hasPermission('dashboard.widgets.work-orders') && metrics.totalWorkOrders !== undefined && (
                <div className="card bg-danger/15 overflow-hidden">
                  <div className="card-body relative">
                    <LuWrench className="absolute top-0 size-32 text-danger/10 -end-10" />
                    <div className="btn btn-icon size-12 bg-danger">
                      <LuWrench className="size-6 text-white" />
                    </div>
                    <h5 className="mt-3 text-lg font-semibold">
                      <span className="counter-value" data-target={metrics.totalWorkOrders}>
                        {metrics.totalWorkOrders.toLocaleString()}
                      </span>
                    </h5>
                    <p className="text-sm text-default-700">Work Orders</p>
                  </div>
                </div>
              )}

              {hasPermission('dashboard.widgets.purchase-orders') && metrics.totalPurchaseOrders !== undefined && (
                <div className="card bg-info/15 overflow-hidden">
                  <div className="card-body relative">
                    <LuShoppingCart className="absolute top-0 size-32 text-info/10 -end-10" />
                    <div className="btn btn-icon size-12 bg-info">
                      <LuShoppingCart className="size-6 text-white" />
                    </div>
                    <h5 className="mt-3 text-lg font-semibold">
                      <span className="counter-value" data-target={metrics.totalPurchaseOrders}>
                        {metrics.totalPurchaseOrders.toLocaleString()}
                      </span>
                    </h5>
                    <p className="text-sm text-default-700">Purchase Orders</p>
                  </div>
                </div>
              )}

              {hasPermission('dashboard.widgets.total-asset-value') && metrics.totalAssetValue !== undefined && (
                <div className="card bg-success/15 overflow-hidden">
                  <div className="card-body relative">
                    <LuDollarSign className="absolute top-0 size-32 text-success/10 -end-10" />
                    <div className="btn btn-icon size-12 bg-success">
                      <LuDollarSign className="size-6 text-white" />
                    </div>
                    <h5 className="mt-3 text-lg font-semibold">
                      <span className="counter-value" data-target={metrics.totalAssetValue}>
                        ${metrics.totalAssetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </h5>
                    <p className="text-sm text-default-700">Total Asset Value</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Charts Section */}
          {(hasPermission('dashboard.widgets.assets-by-status') ||
            hasPermission('dashboard.widgets.work-orders-by-priority') ||
            hasPermission('dashboard.widgets.assets-by-location') ||
            hasPermission('dashboard.widgets.assets-by-category')) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assets by Status */}
              {hasPermission('dashboard.widgets.assets-by-status') &&
                charts.assetsByStatus &&
                charts.assetsByStatus.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title">Assets by Status</h6>
                    </div>
                    <div className="card-body">
                      <ApexChartClient
                        getOptions={() => assetsStatusChartOptions}
                        series={assetsStatusChartSeries}
                        type="donut"
                        height={280}
                      />
                      <div className="mt-4 space-y-2">
                        {charts.assetsByStatus.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-3 rounded-full"
                                style={{ backgroundColor: statusColors[index % statusColors.length] }}
                              />
                              <span className="text-sm">{item.status}</span>
                            </div>
                            <span className="text-sm font-semibold">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Work Orders by Priority */}
              {hasPermission('dashboard.widgets.work-orders-by-priority') &&
                charts.workOrdersByPriority &&
                charts.workOrdersByPriority.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title">Work Orders by Priority</h6>
                    </div>
                    <div className="card-body">
                      <ApexChartClient
                        getOptions={() => workOrdersPriorityChartOptions}
                        series={workOrdersPriorityChartSeries}
                        type="donut"
                        height={280}
                      />
                      <div className="mt-4 space-y-2">
                        {charts.workOrdersByPriority.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="size-3 rounded-full"
                                style={{ backgroundColor: priorityColors[index % priorityColors.length] }}
                              />
                              <span className="text-sm">{item.priority}</span>
                            </div>
                            <span className="text-sm font-semibold">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Assets by Location */}
              {hasPermission('dashboard.widgets.assets-by-location') &&
                charts.assetsByLocation &&
                charts.assetsByLocation.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title">Assets by Location</h6>
                    </div>
                    <div className="card-body">
                      <ApexChartClient
                        getOptions={() => locationChartOptions}
                        series={locationChartSeries}
                        type="bar"
                        height={320}
                      />
                    </div>
                  </div>
                )}

              {/* Assets by Category */}
              {hasPermission('dashboard.widgets.assets-by-category') &&
                charts.assetsByCategory &&
                charts.assetsByCategory.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <h6 className="card-title">Assets by Category</h6>
                    </div>
                    <div className="card-body">
                      <ApexChartClient
                        getOptions={() => categoryChartOptions}
                        series={categoryChartSeries}
                        type="bar"
                        height={320}
                      />
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Trend Charts */}
          {(hasPermission('dashboard.widgets.purchase-orders-trend') ||
            hasPermission('dashboard.widgets.work-orders-trend')) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Purchase Orders Trend */}
              {hasPermission('dashboard.widgets.purchase-orders-trend') &&
                charts.purchaseOrdersTrend &&
                charts.purchaseOrdersTrend.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h6 className="card-title">Purchase Orders Trend</h6>
                        <p className="text-sm text-default-700 mt-1">Last 12 months</p>
                      </div>
                    </div>
                    <div className="card-body">
                      <ApexChartClient
                        getOptions={() => poTrendChartOptions}
                        series={poTrendChartSeries}
                        type="area"
                        height={300}
                      />
                    </div>
                  </div>
                )}

              {/* Work Orders Trend */}
              {hasPermission('dashboard.widgets.work-orders-trend') &&
                charts.workOrdersTrend &&
                charts.workOrdersTrend.length > 0 && (
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <h6 className="card-title">Work Orders Trend</h6>
                        <p className="text-sm text-default-700 mt-1">Last 12 months</p>
                      </div>
                    </div>
                    <div className="card-body">
                      <ApexChartClient
                        getOptions={() => woTrendChartOptions}
                        series={woTrendChartSeries}
                        type="area"
                        height={300}
                      />
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Recent Activities */}
          {(hasPermission('dashboard.widgets.recent-work-orders') ||
            hasPermission('dashboard.widgets.recent-purchase-orders')) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Work Orders */}
              {hasPermission('dashboard.widgets.recent-work-orders') && activities.recentWorkOrders && (
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center justify-between w-full">
                      <h6 className="card-title">Recent Work Orders</h6>
                      <LuWrench className="size-5 text-orange-600" />
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {activities.recentWorkOrders.map((wo) => (
                        <div key={wo.id} className="pb-4 border-b border-default-200 last:border-0 last:pb-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h6 className="text-sm font-semibold">{wo.title}</h6>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(wo.priority)}`}>
                                {wo.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-default-700">
                              <LuPackage className="size-4" />
                              <span>{wo.asset_name}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(wo.status)}`}>
                                {wo.status}
                              </span>
                              <div className="flex items-center gap-1 text-default-700">
                                <LuClock className="size-3" />
                                <span>{wo.created_at}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Purchase Orders */}
              {hasPermission('dashboard.widgets.recent-purchase-orders') && activities.recentPurchaseOrders && (
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center justify-between w-full">
                      <h6 className="card-title">Recent Purchase Orders</h6>
                      <LuShoppingCart className="size-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="space-y-4">
                      {activities.recentPurchaseOrders.map((po) => (
                        <div key={po.id} className="pb-4 border-b border-default-200 last:border-0 last:pb-0">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h6 className="text-sm font-semibold">{po.title}</h6>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(po.status)}`}>
                                {po.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-default-700">PO# {po.po_number}</span>
                              <span className="font-semibold text-green-600">
                                ${po.grand_total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-default-700">
                              <LuClock className="size-3" />
                              <span>{po.created_at}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
};

export default Dashboard;
