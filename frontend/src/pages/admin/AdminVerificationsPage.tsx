import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderVerificationTable } from '@/components/admin/verifications/OrderVerificationTable';
import { ReviewVerificationTable } from '@/components/admin/verifications/ReviewVerificationTable';
import { ShieldCheck } from 'lucide-react';

export default function AdminVerificationsPage() {
    const [activeTab, setActiveTab] = useState('orders');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-500/10 text-orange-600">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Verifications</h1>
                    <p className="text-muted-foreground text-sm">Review and approve pending orders and reviews.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="orders">Pending Orders</TabsTrigger>
                    <TabsTrigger value="reviews">Pending Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="orders" className="mt-6">
                    <OrderVerificationTable />
                </TabsContent>
                <TabsContent value="reviews" className="mt-6">
                    <ReviewVerificationTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
