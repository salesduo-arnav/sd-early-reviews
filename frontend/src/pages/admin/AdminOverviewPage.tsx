import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShieldCheck, Star, BarChart3, Users, CreditCard, Loader2, LayoutDashboard } from 'lucide-react';
import { adminApi, AdminMetrics, ChartDataPoint } from '@/api/admin';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/errors';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { format, subDays } from 'date-fns';

export default function AdminOverviewPage() {
    const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
    const [revenueData, setRevenueData] = useState<ChartDataPoint[]>([]);
    const [claimsData, setClaimsData] = useState<ChartDataPoint[]>([]);
    const [usersData, setUsersData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const endDate = format(new Date(), 'yyyy-MM-dd');
                const startDate = format(subDays(new Date(), 29), 'yyyy-MM-dd');

                const [m, r, c, u] = await Promise.all([
                    adminApi.getMetrics(),
                    adminApi.getRevenueChart(startDate, endDate),
                    adminApi.getClaimsChart(startDate, endDate),
                    adminApi.getUsersChart(startDate, endDate),
                ]);
                setMetrics(m);
                setRevenueData(r);
                setClaimsData(c);
                setUsersData(u);
            } catch (error) {
                toast.error(getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const metricCards = [
        { title: 'Platform Revenue', value: `$${(metrics?.platformRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600' },
        { title: 'Pending Orders', value: metrics?.pendingOrderVerifications ?? 0, icon: ShieldCheck, color: 'text-orange-600' },
        { title: 'Pending Reviews', value: metrics?.pendingReviewVerifications ?? 0, icon: Star, color: 'text-blue-600' },
        { title: 'Active Campaigns', value: metrics?.activeCampaigns ?? 0, icon: BarChart3, color: 'text-purple-600' },
        { title: 'Total Users', value: (metrics?.totalBuyers ?? 0) + (metrics?.totalSellers ?? 0), icon: Users, color: 'text-indigo-600' },
        { title: 'Pending Payouts', value: metrics?.pendingPayouts ?? 0, icon: CreditCard, color: 'text-red-600' },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-600">
                    <LayoutDashboard className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
                    <p className="text-muted-foreground text-sm">Platform-wide metrics and activity at a glance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {metricCards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Revenue (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} labelFormatter={(l) => format(new Date(l), 'MMM d, yyyy')} />
                                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">New Claims (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={claimsData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip labelFormatter={(l) => format(new Date(l), 'MMM d, yyyy')} />
                                <Bar dataKey="claims" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">User Registrations (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={usersData}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => format(new Date(v), 'MMM d')} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip labelFormatter={(l) => format(new Date(l), 'MMM d, yyyy')} />
                                <Legend />
                                <Bar dataKey="buyers" fill="hsl(var(--primary))" name="Buyers" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="sellers" fill="hsl(var(--chart-2))" name="Sellers" radius={[2, 2, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
