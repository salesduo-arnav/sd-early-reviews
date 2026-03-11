import { AdminCampaignsTable } from '@/components/admin/campaigns/AdminCampaignsTable';
import { BarChart3 } from 'lucide-react';

export default function AdminCampaignsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 text-purple-600">
                    <BarChart3 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground text-sm">View and manage all campaigns across the platform.</p>
                </div>
            </div>
            <AdminCampaignsTable />
        </div>
    );
}
