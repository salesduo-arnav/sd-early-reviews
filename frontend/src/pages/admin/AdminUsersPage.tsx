import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuyersTable } from '@/components/admin/buyers/BuyersTable';
import { SellersTable } from '@/components/admin/sellers/SellersTable';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
    const [activeTab, setActiveTab] = useState('buyers');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/10 text-indigo-600">
                    <Users className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground text-sm">Manage buyers and sellers on the platform.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="buyers">Buyers</TabsTrigger>
                    <TabsTrigger value="sellers">Sellers</TabsTrigger>
                </TabsList>
                <TabsContent value="buyers" className="mt-6">
                    <BuyersTable />
                </TabsContent>
                <TabsContent value="sellers" className="mt-6">
                    <SellersTable />
                </TabsContent>
            </Tabs>
        </div>
    );
}
