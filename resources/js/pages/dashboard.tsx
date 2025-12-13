import { LuTicket, LuUserX, LuCircleCheck, LuCircleAlert } from 'react-icons/lu';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import AppLayout from '@/layouts/app-layout';
import ApexChartClient from '@/components/client-wrapper/ApexChartClient';
import type { ApexOptions } from 'apexcharts';
import { useMemo } from 'react';

interface DashboardProps {
  userName: string;
  metrics: {
    totalTickets: number;
    openTickets: number;
    closedTickets: number;
    unassignedTickets: number;
  };
  charts: {
    ticketsByStatus: Array<{ status: string; count: number }>;
    ticketsByPriority: Array<{ priority: string; count: number }>;
    ticketsByCategory: Array<{ category: string; count: number }>;
    ticketsTrend: Array<{ month: string; count: number }>;
  };
  activities: {
    recentTickets: Array<{
      id: number;
      title: string;
      uid: string;
      user_name: string;
      status: string;
      priority: string;
      category: string;
      created_at: string;
    }>;
  };
}

const Dashboard = ({ userName, metrics, charts, activities }: DashboardProps) => {
  // Chart color palettes
  const statusColors = ['#3b82f6', '#14b8a6', '#f97316', '#ef4444', '#a855f7', '#22c55e'];
  const priorityColors = ['#ef4444', '#f97316', '#eab308', '#22c55e']; // Critical=Red, High=Orange, Medium=Yellow, Low=Green

  // Tickets by Status Chart
  const statusChartOptions = useMemo((): ApexOptions => {
    const data = charts.ticketsByStatus || [];
    return {
      chart: {
        type: 'donut',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      labels: data.map((item) => item.status),
      colors: statusColors.slice(0, data.length),
      legend: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: { size: '70%' },
        },
      },
      tooltip: {
        y: {
            formatter: function (val) {
                return val + " tickets"
            }
        }
      },
      stroke: {
        show: true,
        colors: ['transparent']
      }
    };
  }, [charts.ticketsByStatus]);

  const statusChartSeries = useMemo(() => {
    return charts.ticketsByStatus?.map((item) => item.count) || [];
  }, [charts.ticketsByStatus]);

  // Tickets by Priority Chart
  const priorityChartOptions = useMemo((): ApexOptions => {
    const data = charts.ticketsByPriority || [];
    return {
      chart: {
        type: 'donut',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      labels: data.map((item) => item.priority),
      colors: priorityColors.slice(0, data.length), 
      legend: { show: false },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: { size: '70%' },
        },
      },
      tooltip: {
        y: {
            formatter: function (val) {
                return val + " tickets"
            }
        }
      },
       stroke: {
        show: true,
        colors: ['transparent']
      }
    };
  }, [charts.ticketsByPriority]);

  const priorityChartSeries = useMemo(() => {
    return charts.ticketsByPriority?.map((item) => item.count) || [];
  }, [charts.ticketsByPriority]);

  // Tickets by Category Chart
  const categoryChartOptions = useMemo((): ApexOptions => {
    const data = charts.ticketsByCategory || [];
    return {
      series: [{ name: 'Tickets', data: data.map((item) => item.count) }],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          horizontal: true,
          barHeight: '60%',
        },
      },
      dataLabels: { enabled: true },
       xaxis: {
        categories: data.map((item) => item.category),
      },
      colors: ['#8b5cf6'],
      grid: { borderColor: '#e5e7eb' },
    };
  }, [charts.ticketsByCategory]);

  const categoryChartSeries = useMemo(() => {
    return [{ name: 'Tickets', data: charts.ticketsByCategory?.map((item) => item.count) || [] }];
  }, [charts.ticketsByCategory]);

  // Tickets Trend Chart
  const trendChartOptions = useMemo((): ApexOptions => {
    const data = charts.ticketsTrend || [];
    return {
      series: [{ name: 'Tickets', data: data.map((item) => item.count) }],
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 2 },
      fill: {
        type: 'gradient',
        gradient: { opacityFrom: 0.5, opacityTo: 0.1 },
      },
      xaxis: {
        categories: data.map((item) => item.month),
      },
      colors: ['#0ea5e9'],
      grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
    };
  }, [charts.ticketsTrend]);

  const trendChartSeries = useMemo(() => {
    return [{ name: 'Tickets', data: charts.ticketsTrend?.map((item) => item.count) || [] }];
  }, [charts.ticketsTrend]);

  const getPriorityColor = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p.includes('critical') || p.includes('urgent')) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (p.includes('high')) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    if (p.includes('medium')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  };

  const getStatusColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('closed') || s.includes('resolved')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (s.includes('open') || s.includes('new')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (s.includes('pending')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <AppLayout>
      <PageMeta title="Dashboard" />
      <main className="w-full">
        <PageBreadcrumb title="Dashboard" subtitle="Overview of support tickets and performance" />
        
        <div className="space-y-6 mt-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-primary/10 overflow-hidden border-none shadow-sm dark:bg-primary/20">
              <div className="card-body relative p-6">
                <LuTicket className="absolute top-0 size-32 text-primary/10 -end-10 dark:text-primary/20" />
                <div className="flex items-center gap-4">
                    <div className="btn btn-icon size-12 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center">
                        <LuTicket className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-default-600 dark:text-default-400">Total Tickets</p>
                        <h4 className="text-2xl font-bold text-default-900 dark:text-white mt-1">{metrics.totalTickets?.toLocaleString() || 0}</h4>
                    </div>
                </div>
              </div>
            </div>

            <div className="card bg-info/10 overflow-hidden border-none shadow-sm dark:bg-info/20">
              <div className="card-body relative p-6">
                <LuCircleAlert className="absolute top-0 size-32 text-info/10 -end-10 dark:text-info/20" />
                <div className="flex items-center gap-4">
                    <div className="btn btn-icon size-12 bg-info text-white rounded-full shadow-lg shadow-info/30 flex items-center justify-center">
                        <LuCircleAlert className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-default-600 dark:text-default-400">Open Tickets</p>
                        <h4 className="text-2xl font-bold text-default-900 dark:text-white mt-1">{metrics.openTickets?.toLocaleString() || 0}</h4>
                    </div>
                </div>
              </div>
            </div>

            <div className="card bg-success/10 overflow-hidden border-none shadow-sm dark:bg-success/20">
              <div className="card-body relative p-6">
                <LuCircleCheck className="absolute top-0 size-32 text-success/10 -end-10 dark:text-success/20" />
                <div className="flex items-center gap-4">
                    <div className="btn btn-icon size-12 bg-success text-white rounded-full shadow-lg shadow-success/30 flex items-center justify-center">
                        <LuCircleCheck className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-default-600 dark:text-default-400">Closed Tickets</p>
                        <h4 className="text-2xl font-bold text-default-900 dark:text-white mt-1">{metrics.closedTickets?.toLocaleString() || 0}</h4>
                    </div>
                </div>
              </div>
            </div>

            <div className="card bg-warning/10 overflow-hidden border-none shadow-sm dark:bg-warning/20">
              <div className="card-body relative p-6">
                <LuUserX className="absolute top-0 size-32 text-warning/10 -end-10 dark:text-warning/20" />
                <div className="flex items-center gap-4">
                    <div className="btn btn-icon size-12 bg-warning text-white rounded-full shadow-lg shadow-warning/30 flex items-center justify-center">
                        <LuUserX className="size-6" />
                    </div>
                    <div>
                         <p className="text-sm font-medium text-default-600 dark:text-default-400">Unassigned</p>
                         <h4 className="text-2xl font-bold text-default-900 dark:text-white mt-1">{metrics.unassignedTickets?.toLocaleString() || 0}</h4>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="card bg-white dark:bg-default-100 shadow-sm border border-default-200">
                <div className="card-header border-b border-default-200 p-4">
                    <h6 className="card-title text-base font-semibold text-default-900">Tickets by Status</h6>
                </div>
                <div className="card-body p-4">
                    <ApexChartClient
                        getOptions={() => statusChartOptions}
                        series={statusChartSeries}
                        type="donut"
                        height={280}
                    />
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        {charts.ticketsByStatus.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-200">
                            <div className="flex items-center gap-2">
                              <span
                                className="size-3 rounded-full"
                                style={{ backgroundColor: statusColors[index % statusColors.length] }}
                              />
                              <span className="text-sm font-medium text-default-700">{item.status}</span>
                            </div>
                            <span className="text-sm font-bold text-default-900">{item.count}</span>
                          </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card bg-white dark:bg-default-100 shadow-sm border border-default-200">
                <div className="card-header border-b border-default-200 p-4">
                    <h6 className="card-title text-base font-semibold text-default-900">Tickets by Priority</h6>
                </div>
                <div className="card-body p-4">
                    <ApexChartClient
                        getOptions={() => priorityChartOptions}
                        series={priorityChartSeries}
                        type="donut"
                        height={280}
                    />
                     <div className="mt-6 grid grid-cols-2 gap-4">
                        {charts.ticketsByPriority.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-default-50 dark:bg-default-200">
                            <div className="flex items-center gap-2">
                              <span
                                className="size-3 rounded-full"
                                style={{ backgroundColor: priorityColors[index % priorityColors.length] }}
                              />
                              <span className="text-sm font-medium text-default-700">{item.priority}</span>
                            </div>
                            <span className="text-sm font-bold text-default-900">{item.count}</span>
                          </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2 bg-white dark:bg-default-100 shadow-sm border border-default-200">
                    <div className="card-header border-b border-default-200 p-4">
                         <h6 className="card-title text-base font-semibold text-default-900">Ticket Volume Trend</h6>
                    </div>
                    <div className="card-body p-4">
                        <ApexChartClient
                            getOptions={() => trendChartOptions}
                            series={trendChartSeries}
                            type="area"
                            height={320}
                        />
                    </div>
                </div>

                <div className="card bg-white dark:bg-default-100 shadow-sm border border-default-200">
                     <div className="card-header border-b border-default-200 p-4">
                         <h6 className="card-title text-base font-semibold text-default-900">Tickets by Category</h6>
                    </div>
                     <div className="card-body p-4">
                        <ApexChartClient
                            getOptions={() => categoryChartOptions}
                            series={categoryChartSeries}
                            type="bar"
                            height={320}
                        />
                    </div>
                </div>
            </div>

          {/* Recent Tickets */}
          <div className="card bg-white dark:bg-default-100 shadow-sm border border-default-200">
            <div className="card-header border-b border-default-200 p-4 flex items-center justify-between">
                <h6 className="card-title text-base font-semibold text-default-900">Recent Tickets</h6>
            </div>
            <div className="card-body p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-default-50 border-b border-default-200 dark:bg-default-200">
                            <tr>
                                <th className="px-6 py-3 text-start text-xs font-medium text-default-500 uppercase">Ticket</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-default-500 uppercase">Requester</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-default-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-default-500 uppercase">Priority</th>
                                <th className="px-6 py-3 text-start text-xs font-medium text-default-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-end text-xs font-medium text-default-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-default-200">
                            {activities.recentTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-default-50 transition-colors dark:hover:bg-default-200">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-default-900 line-clamp-1 dark:text-default-300">{ticket.title}</span>
                                            <span className="text-xs text-default-500">#{ticket.uid}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                         <div className="flex items-center gap-2">
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                {ticket.user_name ? ticket.user_name.charAt(0) : 'U'}
                                            </div>
                                            <span className="text-sm text-default-700 dark:text-default-400">{ticket.user_name}</span>
                                        </div>
                                    </td>
                                     <td className="px-6 py-4">
                                        <span className="text-sm text-default-600 dark:text-default-400">{ticket.category}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-end text-sm text-default-500 whitespace-nowrap">
                                        {ticket.created_at}
                                    </td>
                                </tr>
                            ))}
                            {activities.recentTickets.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-4 text-default-500">No recent tickets found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default Dashboard;
