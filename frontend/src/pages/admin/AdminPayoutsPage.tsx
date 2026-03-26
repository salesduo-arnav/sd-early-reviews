import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayoutsTable } from '@/components/admin/payouts/PayoutsTable';
import { TransactionsTable } from '@/components/admin/payouts/TransactionsTable';
import { CreditCard } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';

export default function AdminPayoutsPage() {
    const [activeTab, setActiveTab] = useState('payouts');

    return (
        <div className="space-y-6">
            <PageMeta title="Payouts & Transactions" description="Manage buyer payouts and view all platform transactions on SalesDuo Early Reviews." />
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/10 text-red-600">
                    <CreditCard className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Payouts & Transactions</h1>
                    <p className="text-muted-foreground text-sm">Manage buyer reimbursements and view financial transactions.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="payouts">Payouts</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                </TabsList>
                <TabsContent value="payouts" className="mt-6">
                    <PayoutsTable />
                </TabsContent>
                <TabsContent value="transactions" className="mt-6">
                    <TransactionsTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
