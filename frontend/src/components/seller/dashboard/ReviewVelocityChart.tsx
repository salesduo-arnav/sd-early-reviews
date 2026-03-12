import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, ReviewVelocity } from '@/api/seller';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, format } from 'date-fns';

export function ReviewVelocityChart() {
    const { t } = useTranslation();
    const [data, setData] = useState<ReviewVelocity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState('7');

    useEffect(() => {
        const fetchVelocity = async () => {
            setLoading(true);
            try {
                const endDate = format(new Date(), 'yyyy-MM-dd');
                const startDate = format(subDays(new Date(), parseInt(timeRange) - 1), 'yyyy-MM-dd');
                const velocityData = await dashboardApi.getSellerVelocity(startDate, endDate);

                const formattedData = velocityData.map(item => {
                    const d = new Date(item.date);
                    return {
                        ...item,
                        displayDate: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    };
                });

                setData(formattedData);
            } catch (err: unknown) {
                console.error('Failed to fetch review velocity', err);
                setError('Failed to load review velocity data.');
            } finally {
                setLoading(false);
            }
        };

        fetchVelocity();
    }, [timeRange]);

    return (
        <Card className="shadow-sm border-border col-span-1 md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('seller.dashboard.review_velocity', 'Review Velocity')}</CardTitle>
                    <CardDescription className='mt-2'>
                        {t('seller.dashboard.review_velocity_desc', 'Number of completed reviews over time across all campaigns.')}
                    </CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select Range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7">{t('seller.dashboard.last_7_days', 'Last 7 Days')}</SelectItem>
                        <SelectItem value="14">{t('seller.dashboard.last_14_days', 'Last 14 Days')}</SelectItem>
                        <SelectItem value="30">{t('seller.dashboard.last_30_days', 'Last 30 Days')}</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    {loading ? (
                        <div className="w-full h-full animate-pulse bg-muted rounded-xl" />
                    ) : error ? (
                        <div className="w-full h-full flex items-center justify-center text-destructive font-medium">
                            {error}
                        </div>
                    ) : data.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            {t('seller.dashboard.no_data', 'No data available for this period.')}
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--brand-primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--brand-primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="displayDate" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} dx={-10} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}
                                    itemStyle={{ color: 'hsl(var(--brand-primary))', fontWeight: 'bold' }}
                                    labelStyle={{ color: 'hsl(var(--card-foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                                />
                                <Area type="monotone" dataKey="completed" stroke="hsl(var(--brand-primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
