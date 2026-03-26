import { AdminClaimsTable } from '@/components/admin/claims/AdminClaimsTable';
import { FileText } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';

export default function AdminClaimsPage() {
    return (
        <div className="space-y-6">
            <PageMeta title="Claims Management" description="View and manage all order claims across the SalesDuo Early Reviews platform." />
            <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-500/10 text-teal-600">
                    <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight">Claims</h1>
                    <p className="text-muted-foreground text-sm">View and manage all order claims across the platform.</p>
                </div>
            </div>
            <AdminClaimsTable />
        </div>
    );
}
